import {
  ModelInferRequest,
  ModelInferRequest_InferInputTensor,
  ModelInferRequest_InferRequestedOutputTensor,
} from '../packages/models-requester-grpc/grpc_service_pb';
import { v4 as uuidv4 } from 'uuid';

export function format_request(
  modelName: string,
  modelVersion: string,
  inputs: ModelInferRequest_InferInputTensor[],
  outputs: ModelInferRequest_InferRequestedOutputTensor[],
  requestId: string | null = null,
): ModelInferRequest {
  // Generate requestId if not given
  const validRequestId: string = requestId || uuidv4();

  const request = new ModelInferRequest();

  request.modelName = modelName;
  request.modelVersion = modelVersion;
  request.id = validRequestId;
  request.inputs = inputs;
  request.outputs = outputs;

  return request;
}

export function BufferToFloat32Array(buf: ArrayBufferView): Float32Array {
  const newArray = new Float32Array(buf.byteLength / 4);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  for (let i = 0; i < newArray.length; i++) {
    newArray[i] = dv.getFloat32(i * 4, true); // true indicates little-endian
  }
  return newArray;
}

export function ReshapeFloat32Array(
  array: Float32Array,
  shape: bigint[],
): Float32Array[] {
  const rows = Number(shape[0]);
  const cols = Number(shape[1]);

  if (array.length !== rows * cols) {
    throw new Error(
      'The total number of elements does not match the specified dimensions.',
    );
  }

  const reshapedArray: Float32Array[] = [];
  for (let i = 0; i < rows; i++) {
    reshapedArray.push(array.slice(i * cols, i * cols + cols));
  }

  return reshapedArray;
}

export function reshapeStringArray(
  array: string[],
  shape: bigint[],
): string[][] {
  const rows = Number(shape[0]);
  const cols = Number(shape[1]);

  if (array.length !== rows * cols) {
    throw new Error(
      'The total number of elements does not match the specified dimensions.',
    );
  }

  const reshapedArray: string[][] = [];
  for (let i = 0; i < rows; i++) {
    reshapedArray.push(array.slice(i * cols, i * cols + cols));
  }

  return reshapedArray;
}

export function deserializeBytesTensor(bytesArray: Uint8Array): string[] {
  // We can't simply use Buffer.from(response.rawOutputContents[0]).toString('utf8') or TextDecoder().decode(response.rawOutputContents[0])
  // The reason is that Triton encodes bytes string in a way that each element has its length in first 4 bytes followed by the content.
  // Encoding the length this way it's important, since otherwise we wouldn't know where each element finishes and thus, reshaping would not be possible.

  /* ChatGPT transpiled version from Python _deserialize_bytes_tensor()
    Key Changes and Notes:
        DataView is used to read the length of the string from the buffer (getUint32). The second parameter (true) specifies that the data is little-endian, matching Python's <I format.
        Uint8Array represents the byte buffer in TypeScript.
        TextDecoder is used to convert bytes into a string. It assumes UTF-8 encoding by default, which is a common choice. Adjust the encoding if your data differs.
        We return an array of strings directly. TypeScript/JavaScript does not need to specify the dtype as in Python's numpy array.
        This code will work in environments where Uint8Array, DataView, and TextDecoder are available, such as modern web browsers or Node.js.
    */

  const decoder = new TextDecoder();

  const strings: string[] = [];
  let offset = 0;

  console.log(bytesArray.length);
  while (offset < bytesArray.length) {
    console.log(offset);
    const dataView = new DataView(bytesArray.buffer, offset);
    const length = dataView.getUint32(offset, true); // 'true' for little-endian

    console.log(length);
    offset += 4;

    const slice = bytesArray.slice(offset, offset + length);
    const string = decoder.decode(slice);
    strings.push(string);
    offset += length;
  }

  console.log(strings.length);
  return strings;
}
