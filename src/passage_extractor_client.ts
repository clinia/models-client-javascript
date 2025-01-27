import { InferInput } from './infer';
import { TritonClient } from './triton_client';
import { ModelInferRequest_InferRequestedOutputTensor } from '../packages/models-requester-node-grpc/grpc_service_pb';
import { deserializeBytesTensor, reshapeStringArray } from './utils';

function prepareInputs(textsWithParams: TextWithParams[]): InferInput[] {
  let texts: string[] = [];
  let params: string[] = [];

  for (const textWithParams of textsWithParams) {
    texts.push(textWithParams.text);
    params.push(textWithParams.params);
  }

  return [
    InferInput.fromTexts(texts, 'text'),
    InferInput.fromTexts(params, 'params'),
  ];
}

class TextWithParams {
  text: string;
  params: string;

  constructor(text: string, params: string) {
    this.text = text;
    this.params = params;
  }
}

class Passages {
  datatype: string;
  shape: BigInt[];
  data: string[][];

  constructor(datatype: string, shape: bigint[], data: string[][]) {
    this.datatype = datatype;
    this.shape = shape;
    this.data = data;
  }
}

export class PassageExtractorClient extends TritonClient {
  async getPassages(
    modelName: string,
    modelVersion: string,
    textsWithParams: TextWithParams[],
    requestId: string | null = null,
  ): Promise<Passages> {
    const outputName = 'passages';

    const inputs = prepareInputs(textsWithParams);
    const requestedOutputs = [
      new ModelInferRequest_InferRequestedOutputTensor({
        name: outputName,
      }),
    ];

    // Perform inference
    const response = await this.infer(
      modelName,
      modelVersion,
      inputs,
      requestedOutputs,
      requestId,
    );

    // Check output validity
    if (response.outputs.length != response.rawOutputContents.length) {
      throw new Error(
        'Outputs length does not match raw output contents length',
      );
    }
    if (
      response.outputs.length != 1 ||
      response.rawOutputContents.length != 1
    ) {
      throw new Error(
        'Both outputs and rawOutputContents must have a single element',
      );
    }

    // Parse from raw bytes to strings
    const stringContents = deserializeBytesTensor(
      response.rawOutputContents[0],
    );

    // Split array according to tensor shape
    const reshapedContents = reshapeStringArray(
      stringContents,
      response.outputs[0].shape,
    );

    return new Passages(
      response.outputs[0].datatype,
      response.outputs[0].shape,
      reshapedContents,
    );
  }
}
