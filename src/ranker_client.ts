import { InferInput } from './infer';
import { TritonClient } from './triton_client';
import { ModelInferRequest_InferRequestedOutputTensor } from '../packages/models-requester-node-grpc/grpc_service_pb';
import { BufferToFloat32Array, ReshapeFloat32Array } from './utils';

function prepareInputs(pairs: QueryPassagePair[]): InferInput[] {
  let queries: string[] = [];
  let passages: string[] = [];

  for (const pair of pairs) {
    queries.push(pair.query);
    passages.push(pair.passage);
  }

  return [
    InferInput.fromTexts(queries, 'query'),
    InferInput.fromTexts(passages, 'passage'),
  ];
}

class QueryPassagePair {
  query: string;
  passage: string;

  constructor(query: string, passage: string) {
    this.query = query;
    this.passage = passage;
  }
}

class Score {
  datatype: string;
  shape: BigInt[];
  tensor: Float32Array[];

  constructor(datatype: string, shape: bigint[], tensor: Float32Array[]) {
    this.datatype = datatype;
    this.shape = shape;
    this.tensor = tensor;
  }
}

export class RankerClient extends TritonClient {
  async getScores(
    modelName: string,
    modelVersion: string,
    pairs: QueryPassagePair[],
    requestId: string | null = null,
  ): Promise<Score> {
    const outputName = 'score';

    const inputs = prepareInputs(pairs);
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

    // Parse from raw bytes to FP32
    const floatContents = BufferToFloat32Array(response.rawOutputContents[0]);

    // Split array according to tensor shape
    const reshapedContents = ReshapeFloat32Array(
      floatContents,
      response.outputs[0].shape,
    );

    return new Score(
      response.outputs[0].datatype,
      response.outputs[0].shape,
      reshapedContents,
    );
  }
}
