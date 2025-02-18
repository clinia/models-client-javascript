/**
 * Postprocesses the output tensor of a model with a bytes data type.
 * @param output - The output tensor as a byte array.
 * @param shape - The shape of the output tensor.
 * @returns The output tensor as a 2D array of string values.
 */
export const postprocessBytes = (
  output: Uint8Array,
  shape: bigint[],
): string[][] => {
  const array = decodeBytes(output);
  const reshapedArray = reshapeArray(array, shape.map(Number));
  return reshapedArray;
};

/**
 * Decodes a byte array into an array of strings.
 * Assumes that the encoded tensor contains a UTF8 encoded string array.
 * @param encodedTensor - The encoded tensor as a Uint8Array.
 * @returns The decoded string array.
 */
const decodeBytes = (encodedTensor: Uint8Array): string[] => {
  const result: string[] = [];
  let offset = 0;
  const view = new DataView(
    encodedTensor.buffer,
    encodedTensor.byteOffset,
    encodedTensor.byteLength,
  );
  const decoder = new TextDecoder('utf-8');

  while (offset < encodedTensor.byteLength) {
    if (offset + 4 > encodedTensor.byteLength) {
      throw new Error('Unexpected end of tensor: not enough bytes for length');
    }
    // Read 4 bytes as a little-endian uint32 to get the length
    const length = view.getUint32(offset, true);
    offset += 4;

    if (offset + length > encodedTensor.byteLength) {
      throw new Error(
        'Unexpected end of tensor: not enough bytes for string data',
      );
    }
    const stringBytes = encodedTensor.slice(offset, offset + length);
    const str = decoder.decode(stringBytes);
    result.push(str);
    offset += length;
  }

  return result;
};

/**
 * Postprocesses the output tensor of a model with a float32 data type.
 * @param output - The output tensor as a byte array.
 * @param shape - The shape of the output tensor.
 * @returns The output tensor as a 2D array of float32 values.
 */
export const postprocessFp32 = (
  output: Uint8Array,
  shape: bigint[],
): Float32Array[] => {
  const array = decodeFloat32(output);
  const reshapedArray = reshapeFloat32Array(array, shape);
  return reshapedArray;
};

/**
 * Decodes a byte array into a float32 array.
 * @param encodedTensor - The encoded tensor as a byte array.
 * @returns The decoded float32 array.
 */
const decodeFloat32 = (encodedTensor: Uint8Array): Float32Array => {
  if (encodedTensor.length % 4 !== 0) {
    throw new Error('encoded tensor length must be a multiple of 4');
  }

  const floats = new Float32Array(encodedTensor.byteLength / 4);
  const dv = new DataView(
    encodedTensor.buffer,
    encodedTensor.byteOffset,
    encodedTensor.byteLength,
  );

  for (let i = 0; i < floats.length; i++) {
    floats[i] = dv.getFloat32(i * 4, true); // true indicates little-endian
  }

  return floats;
};

interface Sliceable<A> {
  length: number;
  slice(start: number, end?: number): A;
}

/**
 * Reshapes a 1D sliceable array into a 2D array.
 * @param array - The 1D array (e.g. a Float32Array or a string[]).
 * @param shape - A two-element array [rows, cols].
 * @returns The reshaped 2D array.
 */
export const reshapeArray = <A extends Sliceable<A>>(
  array: A,
  shape: number[],
): A[] => {
  if (shape.length !== 2) {
    throw new Error('shape must have exactly two dimensions');
  }

  const rows = shape[0];
  const cols = shape[1];

  if (array.length !== rows * cols) {
    throw new Error(
      'the total number of elements does not match the specified dimensions',
    );
  }

  const reshaped: A[] = [];
  for (let i = 0; i < rows; i++) {
    reshaped.push(array.slice(i * cols, i * cols + cols));
  }

  return reshaped;
};

/**
 * Reshapes a 1D float32 array into a 2D array of float32 values.
 * @param array - The 1D float32 array to reshape.
 * @param shape - The shape of the 2D array.
 * @returns The 2D array of float32 values.
 */
export const reshapeFloat32Array = (
  array: Float32Array,
  shape: bigint[],
): Float32Array[] => {
  return reshapeArray(array, shape.map(Number));
};
