import { v4 as uuidv4 } from 'uuid';
import { TritonClient } from './triton_client';
import {
  ModelInferRequest,
  ModelInferRequest_InferInputTensor,
  ModelInferRequest_InferRequestedOutputTensor,
  ModelStreamInferResponse,
} from '../packages/models-requester-node-grpc/grpc_service_pb';
import { createAsyncIterable } from '@connectrpc/connect/protocol';

const getSummarizerInputs = (
  query: string,
  articles: string[],
  mode: string,
  maxGeneratedTokens: number = 256, // Always set to 256 for now
) => {
  const inputs = [
    new ModelInferRequest_InferInputTensor({
      name: 'query',
      datatype: 'BYTES',
      shape: [BigInt(1), BigInt(1)],
    }),
    new ModelInferRequest_InferInputTensor({
      name: 'articles',
      datatype: 'BYTES',
      shape: [BigInt(1), BigInt(articles.length)],
    }),
    new ModelInferRequest_InferInputTensor({
      name: 'mode',
      datatype: 'BYTES',
      shape: [BigInt(1), BigInt(1)],
    }),
    new ModelInferRequest_InferInputTensor({
      name: 'streaming',
      datatype: 'BOOL',
      shape: [BigInt(1), BigInt(1)],
    }),
    new ModelInferRequest_InferInputTensor({
      name: 'max_new_tokens',
      datatype: 'INT32', // b'\x00\x01\x00\x00'
      shape: [BigInt(1), BigInt(1)],
    }),
  ];

  const rawInputContent = [
    encodeText(query),
    encodeText(...articles),
    encodeText(mode),
    new Uint8Array([0x01]), // Set to always TRUE
    encodeInt32ToUint8Array(maxGeneratedTokens),
  ] as Uint8Array[];

  return [inputs, rawInputContent] as const;
};

function encodeInt32ToUint8Array(value: number): Uint8Array {
  const buffer = new ArrayBuffer(4); // 4 bytes for a 32-bit integer
  const view = new DataView(buffer);
  view.setInt32(0, value, true); // true for little-endian
  return new Uint8Array(buffer);
}

function encodeText(...tensors: string[]): Uint8Array | Error {
  if (tensors === undefined || tensors === null) {
    return new Error(
      'Cannot serialize byte tensors: got undefined or null tensor array',
    );
  }

  // Calculate the total buffer length needed
  let totalLength = 0;
  const lengths = tensors.map((tensor) => {
    const len = Buffer.byteLength(tensor, 'utf8');
    totalLength += 4 + len; // 4 bytes for the length, plus the tensor length
    return len;
  });

  // Allocate a buffer to hold all tensor lengths and data
  const buffer = Buffer.alloc(totalLength);
  let offset = 0;

  // Fill the buffer with each tensor length and tensor data
  tensors.forEach((tensor, index) => {
    // Write the length of the tensor as a 4-byte little endian integer
    buffer.writeUInt32LE(lengths[index], offset);
    offset += 4;

    // Write the tensor data to the buffer
    buffer.write(tensor, offset, 'utf8');
    offset += lengths[index];
  });

  // Convert Buffer to Uint8Array
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export function decodeTextFromBytes(bytes: Uint8Array): string {
  // The length is encoded in the first four bytes of the array
  const length = new DataView(bytes.slice(0, 4).buffer).getUint32(0, true);
  // The text is encoded in the following bytes
  const word = new TextDecoder().decode(bytes.slice(4));

  if (word.length !== length) {
    throw new Error('Word length does not correspond with byte-encoded length');
  }

  return word;
}

export class SummarizerClient extends TritonClient {
  streamAnswer({
    modelName,
    modelVersion,
    query,
    passages,
    mode,
    requestId,
    maxGeneratedTokens = 256,
  }: {
    modelName: string;
    modelVersion: string;
    query: string;
    passages: string[];
    mode: string;
    requestId?: string;
    maxGeneratedTokens?: number;
  }): AsyncIterable<ModelStreamInferResponse> {
    const [inputs, rawInputs] = getSummarizerInputs(
      query,
      passages,
      mode,
      maxGeneratedTokens,
    );
    const requestedOutputs = [
      new ModelInferRequest_InferRequestedOutputTensor({
        name: 'answer',
      }),
    ];

    // Format request
    const request = new ModelInferRequest({
      modelName: modelName,
      modelVersion: modelVersion,
      id: requestId || uuidv4(),
      inputs: inputs,
      outputs: requestedOutputs,
      rawInputContents: rawInputs,
    });

    // Start stream and iterate through responses
    return this.client.modelStreamInfer(createAsyncIterable([request]));
  }
}
