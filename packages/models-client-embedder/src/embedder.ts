import {
  type ClientOptions,
  type Requester,
  type Input,
  type Datatype,
  getOutputFp32Contents,
} from '@clinia/models-client-common';

export type EmbedRequest = {
  /**
   * The unique identifier for the request.
   */
  id: string;
  /**
   * The list of texts to be embedded.
   */
  texts: string[];
};

export type EmbedResponse = {
  /**
   * The unique identifier for the response,corresponding to that of the request.
   */
  id: string;
  /**
   * The list of embeddings for each text. Each embedding is a list of floats, corresponding to the embedding dimensions.
   */
  embeddings: Float32Array[];
};

const EMBEDDER_INPUT_KEY = 'text';
const EMBEDDER_OUTPUT_KEY = 'embedding';
const EMBEDDER_INPUT_DATATYPE: Datatype = 'BYTES';

export class Embedder {
  private _requester: Requester;

  /**
   * Get the underlying requester instance.
   */
  get requester(): Requester {
    return this._requester;
  }

  /**
   * Creates an instance of Embedder.
   * @param options - The client options containing the requester.
   */
  constructor(options: ClientOptions) {
    this._requester = options.requester;
  }

  /**
   * Asynchronously generate embeddings using a specified model.
   * @param modelName - The name of the model to use.
   * @param modelVersion - The version of the model to use.
   * @param request - The request containing texts to be embedded.
   * @returns The response containing the embeddings.
   */
  async embed(
    modelName: string,
    modelVersion: string,
    request: EmbedRequest,
  ): Promise<EmbedResponse> {
    if (!request.texts) {
      throw new Error('Request texts must be provided.');
    }

    if (request.texts.length === 0) {
      throw new Error('Request texts cannot be empty.');
    }

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

  /**
   * Checks the readiness status of the model.
   * @throws {Error} If the model is not ready.
   */
  async ready(modelName: string, modelVersion: string): Promise<void> {
    await this._requester.ready(modelName, modelVersion);
  }
}
