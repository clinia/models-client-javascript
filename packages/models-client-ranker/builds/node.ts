import type { RequesterConfig } from '@clinia/models-client-common';
import { Ranker } from '../src/ranker';
import { createGrpcRequester } from '@clinia/models-requester-grpc';

export const ranker = (options: RequesterConfig): Ranker => {
  return new Ranker({
    requester: createGrpcRequester(options),
  });
};
