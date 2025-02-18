import type { RequesterConfig } from '@clinia/models-client-common';
import { Chunker } from '../src/chunker';
import { createGrpcRequester } from '@clinia/models-requester-grpc';

export const chunker = (options: RequesterConfig): Chunker => {
  return new Chunker({
    requester: createGrpcRequester(options),
  });
};
