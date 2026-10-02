# @wallstack-aa-caas/sdk

[![CI](https://github.com/wss-ccg/wallstack-aa-caas-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/wss-ccg/wallstack-aa-caas-sdk/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@wallstack-aa-caas%2Fsdk.svg)](https://www.npmjs.com/package/@wallstack-aa-caas/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

Official TypeScript SDK for the **WallStack AA-CaaS™ REST v2 API**

## Features

- ✅ Full TypeScript support
- ✅ Dual ESM+CJS build
- ✅ Type-safe responses

## Installation

```bash
npm install @wallstack-aa-caas/sdk
```

## Quick Start

```typescript
import { WallStackClient } from "@wallstack-aa-caas/sdk";

const client = new WallStackClient({
  apiKey: process.env.WALLSTACK_API_KEY!,
});

const dataset = await client.datasets.get("ds_abc123");
console.log(dataset.tracks);
```

## API Reference

- `client.datasets.get(id)` — fetch one dataset
- `client.datasets.list(params)` — list datasets
- `client.tracks.get(id)` — fetch one track
- `client.licenses.create(params)` — create license

## License

MIT © 2026 WallStack
