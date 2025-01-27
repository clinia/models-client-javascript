import type { Content } from './content';
import type { Datatype } from './datatype';

export type Input = {
  name: string;
  datatype: Datatype;
  shape?: number[];
  contents: Content[];
};

export const getInputStringContents = (input: Input): string[][] => {
  if (input.datatype !== 'BYTES') {
    throw new Error('Data type not supported');
  }

  const contents: string[][] = [];
  for (const content of input.contents) {
    if (content.stringContents) contents.push(content.stringContents);
  }

  return contents;
};
