import {
  type ClientOptions,
  type Requester,
  type Input,
  type Datatype,
  getOutputFp32Contents,
} from '@clinia/models-client-common';

export type EmbedRequest = {
  id: string;
  texts: string[];
};

export type EmbedResponse = {
  id: string;
  embeddings: Float32Array[];
};

const EMBEDDER_INPUT_KEY = 'text';
const EMBEDDER_OUTPUT_KEY = 'embedding';
const EMBEDDER_INPUT_DATATYPE: Datatype = 'BYTES';

export class Embedder {
  private _requester: Requester;

  constructor(options: ClientOptions) {
    this._requester = options.requester;
  }

  async embed(
    modelName: string,
    modelVersion: string,
    request: EmbedRequest,
  ): Promise<EmbedResponse> {
    const inputs: Input[] = [
      {
        name: EMBEDDER_INPUT_KEY,
        shape: [request.texts.length],
        datatype: EMBEDDER_INPUT_DATATYPE,
        contents: [
          {
            stringContents: request.texts,
          },
        ],
      },
    ];

    // The embedder model has only one input and one output
    const outputKeys = [EMBEDDER_OUTPUT_KEY];

    const outputs = await this._requester.infer(
      modelName,
      modelVersion,
      inputs,
      outputKeys,
      request.id,
    );

    // Since we have only one output, we can directly access the first output.
    // We already check the size of the output in the infer function therefore we can "safely" access the element 0.
    const embeddings = getOutputFp32Contents(outputs[0]);

    return {
      id: request.id,
      embeddings,
    };
  }
}
