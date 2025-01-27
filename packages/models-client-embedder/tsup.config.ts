import type { Options } from 'tsup';
import { defineConfig } from 'tsup';

import { getBaseBrowserOptions, getBaseNodeOptions } from '../../base.tsup.config';

import pkg from './package.json' with { type: 'json' };

const nodeOptions: Options = {
  ...getBaseNodeOptions(pkg, __dirname),
  dts: { entry: { node: 'builds/node.ts' } },
  entry: ['builds/node.ts', 'src/*.ts'],
};

const nodeConfigs: Options[] = [
  {
    ...nodeOptions,
    format: 'cjs',
    name: `node ${pkg.name} cjs`,
  },
  {
    ...nodeOptions,
    format: 'esm',
    name: `node ${pkg.name} esm`,
  },
];

const browserOptions: Options = {
  ...getBaseBrowserOptions(pkg, __dirname),
  globalName: 'embedder',
};

const browserConfigs: Options[] = [
  {
    ...browserOptions,
    minify: false,
    name: `browser ${pkg.name} esm`,
    dts: { entry: { browser: 'builds/browser.ts' } },
    entry: ['builds/browser.ts', 'src/*.ts'],
  },
];

export default defineConfig([...nodeConfigs, ...browserConfigs]);
