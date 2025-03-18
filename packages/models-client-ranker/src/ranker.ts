import {
  getOutputFp32Contents,
  type ClientOptions,
  type Datatype,
  type Input,
  type Requester,
} from '@clinia/models-client-common';

const RANKER_QUERY_INPUT_KEY = 'query';
const RANKER_QUERY_INPUT_DATATYPE: Datatype = 'BYTES';

// TODO: change to text
const RANKER_TEXT_INPUT_KEY = 'text';
const RANKER_TEXT_INPUT_DATATYPE: Datatype = 'BYTES';

const RANKER_OUTPUT_KEY = 'score';

export type RankRequest = {
  /**
   * The unique identifier for the request.
   */
  id: string;
  /**
   * The query to rank the passages against.
   */
  query: string;
  /**
   * The list of passages to be ranked.
   */
  texts: string[];
};

export type RankResponse = {
  /**
   * The unique identifier for the response, corresponding to that of the request.
   */
  id: string;
  /**
   * The list of scores for each pair of query and passage.
   */
  scores: Float32Array;
};

export class Ranker {
  private _requester: Requester;

  /**
   * Creates an instance of Ranker.
   * @param options - The client options containing the requester.
   */
  constructor(options: ClientOptions) {
    this._requester = options.requester;
  }

  /**
   * Asynchronously rank passages using a specified model.
   * @param modelName - The name of the model to use.
   * @param modelVersion - The version of the model to use.
   * @param request - The request containing the query and texts to be ranked.
   * @returns The response containing the scores.
   */
  async rank(
    modelName: string,
    modelVersion: string,
    request: RankRequest,
  ): Promise<RankResponse> {
    // Duplicate query to be the same size as texts
    const inputQueries = Array(request.texts.length).fill(request.query);

    // We don't specify the shape considering it calculated inside the infer function
    // when transforming the string content to the raw input.
    const inputs: Input[] = [
      {
        name: RANKER_QUERY_INPUT_KEY,
        datatype: RANKER_QUERY_INPUT_DATATYPE,
        contents: [
          {
            stringContents: inputQueries,
          },
        ],
      },
      {
        name: RANKER_TEXT_INPUT_KEY,
        datatype: RANKER_TEXT_INPUT_DATATYPE,
        contents: [
          {
            stringContents: request.texts,
          },
        ],
      },
    ];

    // The ranker model has only one input and one output.
    const outputKeys = [RANKER_OUTPUT_KEY];

    const outputs = await this._requester.infer(
      modelName,
      modelVersion,
      inputs,
      outputKeys,
      request.id,
    );

    // Since we have only one output, we can directly access the first output.
    // We already check the size of the output in the infer function.
    const scores = getOutputFp32Contents(outputs[0]);

    // Flatten the 2D array into a 1D array
    const flattenedScores: number[] = [];
    for (const score of scores) {
      if (score.length !== 1) {
        throw new Error(
          `Expected a single score per text, but got ${score.length} elements`,
        );
      }
      flattenedScores.push(...score);
    }

    return {
      id: request.id,
      scores: new Float32Array(flattenedScores),
    };
  }
}
