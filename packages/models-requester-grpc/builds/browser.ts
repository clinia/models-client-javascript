import type { Requester, RequesterConfig } from '@clinia/models-client-common';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { GrpcRequester } from '../src/requester';
import { hostFullUrl } from '@clinia/models-client-common';

export const createGrpcRequester = (options: RequesterConfig): Requester => {
  const transport = createGrpcWebTransport({
    baseUrl: hostFullUrl(options.host),
  });

  return new GrpcRequester(transport);
};
