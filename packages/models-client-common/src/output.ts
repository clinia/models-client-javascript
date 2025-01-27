import type { Content } from './content';
import type { Datatype } from './datatype';

export type Output = {
  name: string;
  datatype: Datatype;
  shape: number[];
  contents: Content[];
};

export const getOutputFp32Contents = (output: Output): Float32Array[] => {
  if (output.datatype !== 'FP32') {
    throw new Error('Data type not supported');
  }

  const contents: Float32Array[] = [];
  for (const content of output.contents) {
    if (content.fp32Contents) contents.push(content.fp32Contents);
  }

  return contents;
};
