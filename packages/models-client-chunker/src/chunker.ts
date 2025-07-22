import {
  type ClientOptions,
  type Requester,
  type Input,
  type Datatype,
  type Output,
  getOutputStringContents,
} from '@clinia/models-client-common';

export type Chunk = {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
};

export type ChunkRequest = {
  id: string;
  texts: string[];
};

export type ChunkResponse = {
  id: string;
  chunks: Chunk[][];
};

const CHUNK_INPUT_KEY = 'text';
const CHUNK_OUTPUT_KEY = 'chunk';
const CHUNK_INPUT_DATATYPE: Datatype = 'BYTES';

export class Chunker {
  private _requester: Requester;

  /**
   * Get the underlying requester instance.
   */
  get requester(): Requester {
    return this._requester;
  }

  constructor(options: ClientOptions) {
    this._requester = options.requester;
  }

  private processOutput(output: Output): Chunk[][] {
    let textChunks = getOutputStringContents(output);
    let formattedChunks = [];
    for (let text_chunk of textChunks) {
      // Filter out "pad" values and then map
      let filtered = text_chunk.filter((chunk) => chunk !== 'pad');
      let formatted_text_chunks = filtered.map((chunk) => {
        try {
          return JSON.parse(chunk) as Chunk;
        } catch (e) {
          throw new Error(`Invalid JSON: ${chunk}`);
        }
      });
      formattedChunks.push(formatted_text_chunks);
    }

    return formattedChunks;
  }

  async chunk(
    modelName: string,
    modelVersion: string,
    request: ChunkRequest,
  ): Promise<ChunkResponse> {
    if (!request.texts) {
      throw new Error('Request must contain texts to chunk.');
    }

    if (request.texts.length === 0) {
      throw new Error('Request texts cannot be empty.');
    }

    const inputs: Input[] = [
      {
        name: CHUNK_INPUT_KEY,
        shape: [request.texts.length],
        datatype: CHUNK_INPUT_DATATYPE,
        contents: [
          {
            stringContents: request.texts,
          },
        ],
      },
    ];

    // The chunker model has only one input and one output
    const outputKeys = [CHUNK_OUTPUT_KEY];

    const outputs = await this._requester.infer(
      modelName,
      modelVersion,
      inputs,
      outputKeys,
      request.id,
    );

    // Since we have only one output, we can directly access the first output.
    // We already check the size of the output in the infer function therefore we can "safely" access the element 0.
    const chunks = this.processOutput(outputs[0]);

    return {
      id: request.id,
      chunks,
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
