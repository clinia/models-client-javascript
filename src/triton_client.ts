import {
  Transport,
  PromiseClient,
  createPromiseClient,
} from '@connectrpc/connect';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { GRPCInferenceService } from '../packages/models-requester-grpc/grpc_service_connect';
import {
  ModelInferRequest_InferInputTensor,
  ModelInferRequest_InferRequestedOutputTensor,
  ModelInferResponse,
} from '../packages/models-requester-grpc/grpc_service_pb';
import { format_request } from './utils';

export class TritonClient {
  channel: Transport;
  client: PromiseClient<typeof GRPCInferenceService>;

  constructor(url: string) {
    this.channel = createGrpcTransport({
      baseUrl: url,
      httpVersion: '2',
    });

    this.client = createPromiseClient(GRPCInferenceService, this.channel);
  }

  async infer(
    modelName: string,
    modelVersion: string,
    inputs: ModelInferRequest_InferInputTensor[],
    outputs: ModelInferRequest_InferRequestedOutputTensor[],
    requestId: string | null = null,
  ): Promise<ModelInferResponse> {
    // Format request
    const request = format_request(
      (modelName = modelName),
      (modelVersion = modelVersion),
      (inputs = inputs),
      (outputs = outputs),
      (requestId = requestId),
    );

    const response = await this.client.modelInfer(request);

    return response;
  }
}
