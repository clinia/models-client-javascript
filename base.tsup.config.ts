import path from 'path';
import type { Options } from 'tsup';

type PKG = {
  dependencies?: Record<string, string>;
  name: string;
};

const requesters = {
  grpc: '@clinia/models-requester-grpc',
};

type Requester = keyof typeof requesters;

export function getBaseConfig(cwd: string): Options {
  return {
    clean: true,
    sourcemap: true,
    splitting: false,
    tsconfig: path.resolve(cwd, 'tsconfig.json'),
  };
}

export function getDependencies(pkg: PKG, requester: Requester): string[] {
  const deps = Object.keys(pkg.dependencies || {}) || [];

  if (pkg.name !== '@clinia/models-client') {
    return deps;
  }

  switch (requester) {
    case 'grpc':
      return deps;
    default:
      throw new Error('unknown requester', requester);
  }
}

export function getBaseNodeOptions(
  pkg: PKG,
  cwd: string,
  requester: Requester = 'grpc',
): Options {
  return {
    ...getBaseConfig(cwd),
    platform: 'node',
    target: 'node14',
    external: [...getDependencies(pkg, requester), 'node:crypto', 'util'],
  };
}

export function getBaseBrowserOptions(
  pkg: PKG,
  cwd: string,
  requester: Requester = 'grpc',
): Options {
  return {
    ...getBaseConfig(cwd),
    platform: 'browser',
    format: ['esm'],
    target: ['chrome109', 'safari15.6', 'firefox115', 'edge126'],
    external: [...getDependencies(pkg, requester), 'dom', 'util'],
  };
}
