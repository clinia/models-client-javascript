import {
  ModelInferRequest_InferInputTensor,
  InferTensorContents,
} from '../packages/models-requester-node-grpc/grpc_service_pb';

export class InferInput extends ModelInferRequest_InferInputTensor {
  constructor(name: string, datatype: string, data: Uint8Array[]) {
    super(); // Call the parent class constructor
    this.name = name;
    this.datatype = datatype;
    this.shape = [BigInt(data.length), BigInt(1)];
    this.contents = new InferTensorContents();
    this.contents.bytesContents = data;
  }

  static fromTexts(texts: string[], name: string): InferInput {
    const encoder = new TextEncoder();
    const encodedTexts = texts.map((text) => encoder.encode(text));

    return new InferInput(name, 'BYTES', encodedTexts);
  }
}
