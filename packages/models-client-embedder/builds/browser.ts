import type { RequesterConfig } from '@clinia/models-client-common';
import { Embedder } from '../src/embedder';
import { createGrpcRequester } from '@clinia/models-requester-grpc';

export const embedder = (options: RequesterConfig): Embedder => {
  return new Embedder({
    requester: createGrpcRequester(options),
  });
};
