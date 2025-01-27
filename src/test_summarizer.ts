import { EmbedderClient, SummarizerClient, decodeTextFromBytes } from '.';
import {
  InferParameter,
  ModelStreamInferResponse,
} from '../packages/models-requester-grpc/grpc_service_pb';
import { ModelInferResponse } from '../packages/models-requester-grpc/grpc_service_pb';

const testEmbedder = async () => {
  // Example
  const TRITON_URL = 'http://127.0.0.1:8001';
  const MODEL_NAME = 'embedder_medical_journals_qa';
  const MODEL_VERSION = '120240905185426';

  const TEXTS = ['Hello, how are you?', 'Clinia is based in Montreal'];

  const client = new EmbedderClient(TRITON_URL);

  console.log(`Created EmbedderClient, getting embeddings for texts: ${TEXTS}`);
  client
    .getEmbeddings(MODEL_NAME, MODEL_VERSION, TEXTS)
    .then((embeddings) => console.log(embeddings))
    .catch((error) => console.error(error));
};

const testSummarizer = async () => {
  // Example
  const TRITON_URL = 'http://127.0.0.1:8001';
  const MODEL_NAME = 'summarizer_medical_journals_qa';
  const MODEL_VERSION = '120240909221000';

  const client = new SummarizerClient(TRITON_URL);

  const query = 'How can we find bone defects?';
  const articles = [
    '{"id": "test-id-1", "text": "", "title": "Process of finding bone problems", "passages": ["Bone defects can be found by means of a bone scanner"]}',
    '{"id": "test-id-2", "text": "", "title": "Process of finding mind problems", "passages": ["Mind problems are the field of a psychologist"]}',
  ];
  const mode = 'answer'; // 'summary' | 'answer'
  const stream = client.streamAnswer({
    modelName: MODEL_NAME,
    modelVersion: MODEL_VERSION,
    query,
    passages: articles,
    mode,
    maxGeneratedTokens: 256,
  });

  function validateResponse(inferResponse: ModelInferResponse) {
    if (
      inferResponse.outputs.length !== inferResponse.rawOutputContents.length
    ) {
      throw new Error(
        'Outputs length does not match raw output contents length',
      );
    }

    if (
      inferResponse.outputs.length !== 1 ||
      inferResponse.rawOutputContents.length !== 1
    ) {
      throw new Error(
        'Both outputs and rawOutputContents must have a single element',
      );
    }
  }

  for await (const response of stream) {
    if (response.errorMessage) {
      throw new Error(response.errorMessage);
    }

    if (!response.inferResponse) {
      throw new Error('No inference response was returned');
    }

    const isFinished: InferParameter | undefined =
      response.inferResponse.parameters.triton_final_response;

    if (isFinished?.parameterChoice.value) {
      console.log('Stream finished!');
      return;
    }

    validateResponse(response.inferResponse);
    const word = decodeTextFromBytes(
      response.inferResponse.rawOutputContents[0],
    );
    console.log(word);
  }
};

testSummarizer();
