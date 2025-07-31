import type { RequesterConfig } from '@clinia/models-client-common';
import { SparseEmbedder } from '../src/sparse-embedder';
import { createGrpcRequester } from '@clinia/models-requester-grpc';

export const sparseEmbedder = (options: RequesterConfig): SparseEmbedder => {
  return new SparseEmbedder({
    requester: createGrpcRequester(options),
  });
};
