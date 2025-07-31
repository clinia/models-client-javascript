import {
  type ClientOptions,
  type Requester,
  type Input,
  type Datatype,
  getOutputSparseContents,
} from '@clinia/models-client-common';

export type SparseEmbedRequest = {
  /**
   * The unique identifier for the request.
   */
  id: string;
  /**
   * The list of texts to be embedded.
   */
  texts: string[];
};

export type SparseEmbedResponse = {
  /**
   * The unique identifier for the response,corresponding to that of the request.
   */
  id: string;
  /**
   * The list of sparse embeddings for each text. Each embedding is a map from feature names to their corresponding values.
   */
  embeddings: Record<string, number>[];
};

const SPARSE_EMBEDDER_INPUT_KEY = 'text';
const SPARSE_EMBEDDER_OUTPUT_KEY = 'embedding';
const SPARSE_EMBEDDER_INPUT_DATATYPE: Datatype = 'BYTES';

export class SparseEmbedder {
  private _requester: Requester;

  /**
   * Get the underlying requester instance.
   */
  get requester(): Requester {
    return this._requester;
  }

  /**
   * Creates an instance of SparseEmbedder.
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
    request: SparseEmbedRequest,
  ): Promise<SparseEmbedResponse> {
    if (!request.texts) {
      throw new Error('Request texts must be provided.');
    }

    if (request.texts.length === 0) {
      throw new Error('Request texts cannot be empty.');
    }

    const inputs: Input[] = [
      {
        name: SPARSE_EMBEDDER_INPUT_KEY,
        shape: [request.texts.length],
        datatype: SPARSE_EMBEDDER_INPUT_DATATYPE,
        contents: [
          {
            stringContents: request.texts,
          },
        ],
      },
    ];

    // The embedder model has only one input and one output
    const outputKeys = [SPARSE_EMBEDDER_OUTPUT_KEY];

    const outputs = await this._requester.infer(
      modelName,
      modelVersion,
      inputs,
      outputKeys,
      request.id,
    );

    const embeddings = getOutputSparseContents(outputs[0]);

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
