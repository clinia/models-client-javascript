import type { Requester, RequesterConfig } from '@clinia/models-client-common';
import { createGrpcTransport } from '@connectrpc/connect-node';
import { GrpcRequester } from '../src/requester';
import { hostFullUrl } from '@clinia/models-client-common';

export const createGrpcRequester = (options: RequesterConfig): Requester => {
  const transport = createGrpcTransport({
    baseUrl: hostFullUrl(options.host),
  });

  return new GrpcRequester(transport);
};
