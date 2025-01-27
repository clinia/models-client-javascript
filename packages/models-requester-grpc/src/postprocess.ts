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
  if (shape.length !== 2) {
    throw new Error('shape must have exactly two dimensions');
  }

  const rows = Number(shape[0]);
  const cols = Number(shape[1]);

  if (array.length !== rows * cols) {
    throw new Error(
      'the total number of elements does not match the specified dimensions',
    );
  }

  const reshapedArray: Float32Array[] = [];
  for (let i = 0; i < rows; i++) {
    reshapedArray.push(array.slice(i * cols, i * cols + cols));
  }

  return reshapedArray;
};
