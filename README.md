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

### Embedder Model

```typescript
// TODO
```

### Ranker Model

```typescript
import { ranker } from '@clinia/models-client-ranker';
import { v4 as uuidv4 } from 'uuid';

async function runRankerExample() {
  const myRanker = ranker({
    host: {
      Url: '127.0.0.1',
      Scheme: 'http',
      Port: 8001,
    },
  });

  // Get model name and version from environment variables.
  const modelName = process.env.CLINIA_MODEL_NAME;
  const modelVersion = process.env.CLINIA_MODEL_VERSION;
  if (!modelName || !modelVersion) {
    throw new Error('Missing required environment variables: CLINIA_MODEL_NAME or CLINIA_MODEL_VERSION');
  }

  const rankRequest = {
    id: uuidv4(),
    query: 'Where is Clinia based?',
    texts: ['Clinia is based in Montreal'],
  };

  const result = await myRanker.rank(modelName, modelVersion, rankRequest);
  console.log('Rank result:', result);

  console.log('Rank result:', result);
}

runRankerExample().catch(console.error);
```

### Chunker Model

```typescript
// TODO
```

## Note

This repository is automatically generated from a private repository within Clinia that contains additional resources including tests, mock servers, and development tools.

The version numbers of this package correspond to the same versions in the respective Python, Go and TypeScript public repositories, ensuring consistency across all implementations.

## License

Clinia Models Client JavaScript is an open-sourced software licensed under the [MIT license](LICENSE).
