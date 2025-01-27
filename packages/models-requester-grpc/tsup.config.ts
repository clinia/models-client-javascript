import { defineConfig } from 'tsup';

import { getBaseBrowserOptions, getBaseNodeOptions } from '../../base.tsup.config';

import pkg from './package.json' with { type: 'json' };

export default defineConfig([
  {
    ...getBaseNodeOptions(pkg, __dirname),
    format: 'cjs',
    name: 'node cjs',
    entry: { 'requester.grpc.node': 'builds/node.ts' },
    dts: { entry: { 'requester.grpc.node': 'builds/node.ts' } },
  },
  {
    ...getBaseNodeOptions(pkg, __dirname),
    format: 'esm',
    name: 'node esm',
    entry: { 'requester.grpc.node': 'builds/node.ts' },
    dts: { entry: { 'requester.grpc.node': 'builds/node.ts' } },
  },
  {
    ...getBaseBrowserOptions(pkg, __dirname),
    minify: true,
    name: 'browser esm',
    entry: { 'requester.grpc.browser': 'builds/browser.ts' },
    dts: { entry: { 'requester.grpc.browser': 'builds/browser.ts' } },
    globalName: 'requestergrpc',
  },
]);
