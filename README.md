# @wallstack-aa-caas/sdk

[![CI](https://github.com/wss-ccg/wallstack-aa-caas-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/wss-ccg/wallstack-aa-caas-sdk/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@wallstack-aa-caas%2Fsdk.svg)](https://www.npmjs.com/package/@wallstack-aa-caas/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)

Official TypeScript SDK for the **WallStack AA-CaaS™ REST v2 API** — paired DI + Wet audio datasets for neural amp modeling, AI training, and analog guitar tone capture.

## Features

- ✅ **Full TypeScript support** — strict types, JSDoc on all public APIs
- ✅ **Dual ESM/CJS build** — works in Node.js, bundlers, and edge runtimes
- ✅ **Zero runtime dependencies** — minimal footprint
- ✅ **Type-safe responses** — 100% typed API responses
- ✅ **B2B-grade infrastructure** — CI/CD, semantic versioning, MIT license

## Installation

\`\`\`bash
npm install @wallstack-aa-caas/sdk
\`\`\`

Or with yarn / pnpm:

\`\`\`bash
yarn add @wallstack-aa-caas/sdk
pnpm add @wallstack-aa-caas/sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { WallStackClient } from "@wallstack-aa-caas/sdk";

const client = new WallStackClient({
  apiKey: process.env.WALLSTACK_API_KEY!,
  baseUrl: "https://wallstackaudio.com/api/v2",
});

// Fetch a dataset by ID
const dataset = await client.datasets.get("ds_abc123");
console.log(dataset.tracks);

// List all tracks in a dataset
const tracks = await client.tracks.list({ datasetId: "ds_abc123" });
console.log(tracks.length);

// Create a license for AI training
const license = await client.licenses.create({
  datasetId: "ds_abc123",
  type: "ai-training",
  company: "Example AI Corp",
});
console.log(license.key);
\`\`\`

## Configuration

| Option | Type | Required | Description |
|---|---|---|---|
| \`apiKey\` | \`string\` | ✅ | Your WallStack API key |
| \`baseUrl\` | \`string\` | ❌ | API base URL (default: \`https://wallstackaudio.com/api/v2\`) |
| \`timeout\` | \`number\` | ❌ | Request timeout in ms (default: 30000) |
| \`maxRetries\` | \`number\` | ❌ | Max retries on failure (default: 3) |

## API Reference

### Datasets

- \`client.datasets.get(id)\` — fetch one dataset
- \`client.datasets.list(params)\` — list datasets
- \`client.datasets.tracks(id)\` — list tracks in dataset

### Tracks

- \`client.tracks.get(id)\` — fetch one track
- \`client.tracks.list(params)\` — list tracks
- \`client.tracks.download(id, format)\` — download audio

### Licenses

- \`client.licenses.create(params)\` — create license
- \`client.licenses.get(key)\` — fetch license
- \`client.licenses.validate(key)\` — validate license

## Development

\`\`\`bash
# Install dependencies
npm install

# Build (dual ESM/CJS)
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Test
npm test
\`\`\`

## License

[MIT](./LICENSE) © 2026 WallStack

## Contact

- **Website:** [wallstackaudio.com](https://wallstackaudio.com)
- **Email:** origin@wallstackaudio.com
- **Issues:** [GitHub Issues](https://github.com/wss-ccg/wallstack-aa-caas-sdk/issues)
