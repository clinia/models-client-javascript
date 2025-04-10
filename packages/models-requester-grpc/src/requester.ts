import {
  type Content,
  type Input,
  type Output,
  type Requester,
  getInputStringContents,
} from '@clinia/models-client-common';

import { type Transport, createClient, type Client } from '@connectrpc/connect';
import {
  GRPCInferenceService,
  type ModelReadyRequest,
  type ServerReadyRequest,
  type ModelInferRequest,
  type ModelInferRequest_InferInputTensor,
  type ModelInferRequest_InferRequestedOutputTensor,
  type ModelInferResponse,
} from './gen/grpc_service_pb';
import { preprocess, formatModelNameAndVersion } from './preprocess';
import { postprocessBytes, postprocessFp32 } from './postprocess';

export class GrpcRequester implements Requester {
  private _inferenceClient: Client<typeof GRPCInferenceService>;

  constructor(transport: Transport) {
    this._inferenceClient = createClient(GRPCInferenceService, transport);
  }

  private buildRequest(
    modelName: string,
    modelVersion: string,
    inputs: Input[],
    outputKeys: string[],
    id: string,
  ): ModelInferRequest {
    // Prepare input tensors
    const grpcInputs: ModelInferRequest_InferInputTensor[] = [];
    const rawInputs: Uint8Array[] = [];
    for (const [_, input] of inputs.entries()) {
      // For now we only support bytes/string data types
      // TODO: Support other data types
      if (input.datatype !== 'BYTES') {
        throw new Error('Data type not supported');
      }

      const { rawInputContents, shape } = preprocess(
        getInputStringContents(input)[0],
      );

      grpcInputs.push({
        $typeName: 'inference.ModelInferRequest.InferInputTensor',
        parameters: {},
        name: input.name,
        shape,
        datatype: 'BYTES',
      });
      rawInputs.push(rawInputContents);
    }

    // Prepare output keys
    const grpcOutputs =
      outputKeys.map<ModelInferRequest_InferRequestedOutputTensor>(
        (outputKey) => ({
          $typeName: 'inference.ModelInferRequest.InferRequestedOutputTensor',
          parameters: {},
          name: outputKey,
        }),
      );

    return {
      modelName: modelName,
      modelVersion: modelVersion,
      id: id,
      inputs: grpcInputs,
      outputs: grpcOutputs,
      rawInputContents: rawInputs,
    } as ModelInferRequest;
  }

  private processResponse(res: ModelInferResponse): Output[] {
    // Prepare output tensors
    const outputs: Output[] = [];
    for (const [i, rawOutputContent] of res.rawOutputContents.entries()) {
      const resOutput = res.outputs[i];
      let contents: Content[] = [];

      // TODO: Support other datatypes
      switch (resOutput.datatype) {
        case 'FP32': {
          const output32 = postprocessFp32(rawOutputContent, resOutput.shape);
          contents = output32.map<Content>((v) => ({ fp32Contents: v }));
          break;
        }
        case 'BYTES': {
          const outputBytes = postprocessBytes(
            rawOutputContent,
            resOutput.shape,
          );
          contents = outputBytes.map<Content>((v) => ({ stringContents: v }));
          break;
        }
        default:
          throw new Error(`unsupported datatype ${resOutput.datatype}`);
      }

      outputs.push({
        name: resOutput.name,
        shape: resOutput.shape.map((v) => Number(v)),
        datatype: resOutput.datatype,
        contents: contents,
      });
    }
    return outputs;
  }

  async infer(
    modelName: string,
    modelVersion: string,
    inputs: Input[],
    outputKeys: string[],
    id: string,
  ): Promise<Output[]> {
    // Format model name and version
    const [formattedModelName, formattedModelVersion] =
      formatModelNameAndVersion(modelName, modelVersion);

    const req = this.buildRequest(
      formattedModelName,
      formattedModelVersion,
      inputs,
      outputKeys,
      id,
    );
    const res = await this._inferenceClient.modelInfer(req);

    // TODO: Check resp ID
    if (res.id !== id) {
      throw new Error(`unexpected response id=${res.id} not equal to ${id}`);
    }

    if (res.rawOutputContents.length != outputKeys.length) {
      throw new Error(
        `expected ${outputKeys.length} output keys, got ${res.rawOutputContents.length}`,
      );
    }

    return this.processResponse(res);
  }

  async ready(modelName: string, modelVersion: string): Promise<void> {
    // Format model name and version
    const [formattedModelName, formattedModelVersion] =
      formatModelNameAndVersion(modelName, modelVersion);

    const request: ModelReadyRequest = {
      $typeName: 'inference.ModelReadyRequest',
      name: formattedModelName,
      version: formattedModelVersion,
    };
    const res = await this._inferenceClient.modelReady(request);
    if (!res.ready) {
      throw new Error(
        `Model ${modelName} with version ${modelVersion} is not ready`,
      );
    }
  }

  async health(): Promise<void> {
    const request: ServerReadyRequest = {
      $typeName: 'inference.ServerReadyRequest',
    };
    const res = await this._inferenceClient.serverReady(request);
    if (!res.ready) {
      throw new Error('Server is not ready');
    }
  }

  stream(
    modelName: string,
    modelVersion: string,
    inputs: Input[],
  ): AsyncIterable<string> {
    throw new Error('Method not implemented.');
  }

  close(): void {
    // noop
  }
}
