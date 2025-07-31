# Clinia Models Client Javascript

## Features

- Native JavaScript/TypeScript implementation for communicating with Clinia's models on NVIDIA Triton Inference Server
- gRPC-based communication for efficient and reliable model inference
- Type-safe interfaces for all models and requests with full TypeScript support
- Cross-platform compatibility (Browser and Node.js)
- Support for batch processing for optimal performance
- Minimal dependencies and lightweight implementation
- UMD and ESM module support
- Designed for internal Clinia services with VPC access

## Getting Started

To get started, install the package using your preferred package manager:

```bash
# Using npm
npm install @clinia/models-client-javascript

# Using yarn
yarn add @clinia/models-client-javascript
```

Each model is available as a separate package for better tree-shaking:

```bash
# Install specific model clients
npm install @clinia/models-client-embedder
npm install @clinia/models-client-ranker
npm install @clinia/models-client-chunker
```

You can now import the Clinia Models client in your project and play with it.

## Playground Examples

### Embedder

```typescript
import { embedder } from '@clinia/models-client-embedder';

async function runEmbedderExample() {
  const myEmbedder = embedder({
    host: {
      Url: '127.0.0.1',
      Scheme: 'http',
      Port: 8001,
    },
  });

  // Will throw an error if server is not ready
  await myEmbedder.requester.health();

  // Will throw an error if model is not ready
  await myEmbedder.ready(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
  );

  const result = await myEmbedder.embed(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
    {
      texts: ['Clinia is based in Montreal'],
      id: 'request-123',
    },
  );

  console.log(JSON.stringify(result, null, 2));
}

runEmbedderExample().catch(console.error);
```

### Sparse Embedder

```typescript
import { sparseEmbedder } from '@clinia/models-client-sparse-embedder';

async function runEmbedderExample() {
  const myEmbedder = sparseEmbedder({
    host: {
      Url: '127.0.0.1',
      Scheme: 'http',
      Port: 8001,
    },
  });

  // Will throw an error if server is not ready
  await myEmbedder.requester.health();

  // Will throw an error if model is not ready
  await myEmbedder.ready(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
  );

  const result = await myEmbedder.embed(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
    {
      texts: ['Clinia is based in Montreal'],
      id: 'request-123',
    },
  );

  console.log(JSON.stringify(result, null, 2));
}

runEmbedderExample().catch(console.error);
```

### Chunker

```typescript
import { chunker } from '@clinia/models-client-chunker';

async function runChunkerExample() {
  const myChunker = chunker({
    host: {
      Url: '127.0.0.1',
      Scheme: 'http',
      Port: 8001,
    },
  });

  // Will throw an error if server is not ready
  await myChunker.requester.health();

  // Will throw an error if model is not ready
  await myChunker.ready(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
  );

  const result = await myChunker.chunk(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
    {
      texts: ['Clinia is based in Montreal'],
      id: 'request-123',
    },
  );

  console.log(JSON.stringify(result, null, 2));
}

runChunkerExample().catch(console.error);
```

### Ranker

```typescript
import { ranker } from '@clinia/models-client-ranker';

async function runRankerExample() {
  const myRanker = ranker({
    host: {
      Url: '127.0.0.1',
      Scheme: 'http',
      Port: 8001,
    },
  });

  // Will throw an error if server is not ready
  await myRanker.requester.health();

  // Will throw an error if model is not ready
  await myRanker.ready(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
  );

  const result = await myRanker.rank(
    process.env.CLINIA_MODEL_NAME,
    process.env.CLINIA_MODEL_VERSION,
    {
      query: 'hello, how are you?',
      texts: ['Clinia is based in Montreal'],
      id: 'request-123',
    },
  );

  console.log('Rank result:', result);
}

runRankerExample().catch(console.error);
```

## Note

This repository is automatically generated from a private repository within Clinia that contains additional resources including tests, mock servers, and development tools.

The version numbers of this package correspond to the same versions in the respective Python, Go and TypeScript public repositories, ensuring consistency across all implementations.

## License

Clinia Models Client JavaScript is an open-sourced software licensed under the [MIT license](LICENSE).
