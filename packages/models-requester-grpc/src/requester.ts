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
  type ModelInferRequest_InferInputTensor,
  type ModelInferRequest_InferRequestedOutputTensor,
} from './gen/grpc_service_pb';
import { preprocess } from './preprocess';
import { postprocessFp32 } from './postprocess';

export class GrpcRequester implements Requester {
  private _client: Client<typeof GRPCInferenceService>;

  constructor(transport: Transport) {
    this._client = createClient(GRPCInferenceService, transport);
  }

  async infer(
    modelName: string,
    modelVersion: string,
    inputs: Input[],
    outputKeys: string[],
  ): Promise<Output[]> {
    // Prepare input tensors
    const grpcInputs: ModelInferRequest_InferInputTensor[] = [];
    const rawInputs: Uint8Array<ArrayBufferLike>[] = [];
    for (const [i, input] of inputs.entries()) {
      // For now we only support bytes/string data types
      // TODO: Support other data types
      if (input.datatype !== 'BYTES') {
        throw new Error('Data type not supported');
      }

      const { rawInputContents, shape } = preprocess(
        getInputStringContents(input)[i],
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

    const res = await this._client.modelInfer({
      modelName: modelName,
      modelVersion: modelVersion,
      inputs: grpcInputs,
      outputs: grpcOutputs,
      rawInputContents: rawInputs,
    });

    // TODO: Check resp ID
    if (res.id !== '') {
      throw new Error(`unexpected response id=${res.id} `);
    }

    if (res.rawOutputContents.length != outputKeys.length) {
      throw new Error(
        `expected ${outputKeys.length} output keys, got ${res.rawOutputContents.length}`,
      );
    }

    // Prepare output tensors
    const outputs: Output[] = [];
    for (const [i, rawOutputContent] of res.rawOutputContents.entries()) {
      const resOutput = res.outputs[i];

      // For now, we only support FP32 datatype
      // TODO: Support other datatypes
      if (resOutput.datatype !== 'FP32') {
        throw new Error(`unsupported output datatype: ${resOutput.datatype}`);
      }

      const output32 = postprocessFp32(rawOutputContent, resOutput.shape);
      const contents = output32.map<Content>((v) => ({ fp32Contents: v }));

      outputs.push({
        name: resOutput.name,
        shape: resOutput.shape.map((v) => Number(v)),
        datatype: 'FP32',
        contents: contents,
      });
    }

    return outputs;
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
