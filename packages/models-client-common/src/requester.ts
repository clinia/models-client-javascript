import type { Host } from './host';
import type { Input } from './input';
import type { Output } from './output';

export interface Requester {
  infer(
    modelName: string,
    modelVersion: string,
    inputs: Input[],
    outputKeys: string[],
    id: string,
  ): Promise<Output[]>;

  stream(
    modelName: string,
    modelVersion: string,
    inputs: Input[],
  ): AsyncIterable<string>;

  ready(
    modelName: string,
    modelVersion: string,
  ): Promise<void>;

  health(): Promise<void>;

  close(): void;
}

export type RequesterConfig = {
  host: Host;
};
