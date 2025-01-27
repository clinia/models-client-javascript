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
const RANKER_TEXT_INPUT_KEY = 'passage';
const RANKER_TEXT_INPUT_DATATYPE: Datatype = 'BYTES';

const RANKER_OUTPUT_KEY = 'score';

export type RankRequest = {
  id: string;
  query: string;
  texts: string[];
};

export type RankResponse = {
  id: string;
  scores: Float32Array;
};

export class Ranker {
  private _requester: Requester;

  constructor(options: ClientOptions) {
    this._requester = options.requester;
  }

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
    );

    // Since we have only one output, we can directly access the first output.
    // We already check the size of the output in the infer function.
    const scores = getOutputFp32Contents(outputs[0]);

    // Flatten the 2D array into a 1D array
    const flattenedScores: number[] = [];
    for (const score of scores) {
      if (score.length !== 1) {
        throw new Error(
          `Expected a single score per passage, but got ${score.length} elements`,
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
