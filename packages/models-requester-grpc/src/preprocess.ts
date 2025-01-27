import { TextEncoder } from 'util';

/**
 * Preprocess an array of strings into a raw input contents and shape.
 * @param texts
 * @returns An object containing the raw input contents and shape.
 */
export const preprocess = (
  texts: string[],
): { rawInputContents: Uint8Array<ArrayBufferLike>; shape: bigint[] } => {
  const encodedText = encodeText(texts);
  const shape = [BigInt(encodedText.length), BigInt(1)];

  const rawInputContents = serializeByteTensor(encodedText);
  return { rawInputContents, shape };
};

/*
 * Encode an array of strings into an array of Uint8Array.
 * @param texts - Array of strings to encode.
 * @returns An array of Uint8Array.
 */
const encodeText = (texts: string[]): Uint8Array[] => {
  // Convert texts to Uint8Array array
  const encodedData: Uint8Array[] = new Array(texts.length);
  for (let i = 0; i < texts.length; i++) {
    encodedData[i] = new TextEncoder().encode(texts[i]);
  }
  return encodedData;
};

/*
 * Serialize a 2D byte tensor into a flat byte array.
 * @param inputTensor - 2D array of Uint8Array to serialize.
 * @returns A single Uint8Array.
 */
const serializeByteTensor = (inputTensor: Uint8Array[]): Uint8Array => {
  if (inputTensor.length === 0) {
    return new Uint8Array(0);
  }

  const flattenedBytesBuffer: number[] = [];

  for (const tensor of inputTensor) {
    if (tensor === null) {
      throw new Error('cannot serialize bytes tensor: got null tensor');
    }

    // Prepend the byte length as 4-byte little endian integer
    const length = tensor.length;
    const lengthBytes = new Uint8Array(new Uint32Array([length]).buffer);
    flattenedBytesBuffer.push(...lengthBytes);

    // Write the actual bytes
    flattenedBytesBuffer.push(...tensor);
  }

  return new Uint8Array(flattenedBytesBuffer);
};
