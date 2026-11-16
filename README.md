# @wallstack-aa-caas/sdk

[![CI](https://github.com/wss-ccg/wallstack-aa-caas-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/wss-ccg/wallstack-aa-caas-sdk/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@wallstack-aa-caas%2Fsdk.svg)](https://www.npmjs.com/package/@wallstack-aa-caas/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official TypeScript SDK for the **WallStack AA-CaaS™ REST v2 API** — human-performed analog guitar assets (stems, full mixes, DI layers) from a physical Mesa Boogie studio, delivered via a Stripe-style REST API.

- **Package:** [@wallstack-aa-caas/sdk](https://www.npmjs.com/package/@wallstack-aa-caas/sdk)
- **API Docs:** [wallstackaudio.com/api-docs](https://wallstackaudio.com/api-docs)
- **OpenAPI:** [wallstackaudio.com/api/v2/openapi](https://wallstackaudio.com/api/v2/openapi)
- **License:** MIT

---

## Features

- **18 endpoints** across 7 sub-clients (incl. **Dataset Centric 2.0**)
- **Dual auth** — Bearer API key + JWT cookie
- **Stripe-style errors** — 7 types + 25 error codes
- **`{ data, meta }` responses** — consistent envelope
- **Idempotency-Key** support (`/auth/token`, `/auth/refresh`, `/dashboard/download`)
- **Retry with exponential backoff** on 429 / 5xx
- **Dataset Centric 2.0** — `wss-ccg-ds-2.0` (AI Training datasets)
- **Naming System 2.0** — 7 files per track (`AssetType` enum)
- **Full TypeScript types** — synced with OpenAPI 3.1
- **Dual ESM + CJS build**
- **Node.js >= 18**

---

## Installation

```bash
npm install @wallstack-aa-caas/sdk
```

---

## Quick Start

```typescript
import { WallStackClient } from "@wallstack-aa-caas/sdk";

const client = new WallStackClient({
  apiKey: process.env.WALLSTACK_API_KEY, // ws_live_* or ws_sandbox_*
});

// 1. Public — browse the release catalog
const { releases, total } = await client.releases.list({
  status: "available",
  limit: 20,
});
console.log(`${total} releases available`);

// 2. Public — get a release with tracks
const detail = await client.releases.get("wss-ccg-vol-1");
console.log(`${detail.title} — ${detail.tracks.length} tracks`);

// 3. Bearer — download a track asset
const dl = await client.tracks.download("the-loop-of-hope", "FULL_MIX");
console.log(dl.download_url, "expires in", dl.expires_in, "s");

// 4. Dataset Centric 2.0 — AI Training dataset
const manifest = await client.datasets.manifest("wss-ccg-ds-NNNN");
console.log(manifest.dataset.standardVersion); // "wss-ccg-ds-2.0"
console.log(`${manifest.tracks.length} tracks, ${manifest.tracks[0].items.length} items`);
```

---

## Authentication

The SDK supports **two auth modes**, matching the API:

| Mode | Header | Used by |
|---|---|---|
| **Bearer** | `Authorization: Bearer ws_live_*` | `/tracks/*`, `/user/*`, `/auth/refresh` |
| **Cookie** | `Cookie: ws_session=<jwt>` | `/auth/*`, `/dashboard/*`, `/admin/*` |

```typescript
const client = new WallStackClient({
  apiKey: "ws_live_...",
  jwtCookie: "eyJhbGciOi...",
});

// Or at runtime:
client.setApiKey("ws_live_...");
client.setJwtCookie("eyJhbGciOi...");
```

---

## Endpoints (18)

### Health (public)
```typescript
await client.health.check();     // GET /health
await client.health.openapi();   // GET /openapi
```

### Releases (public)
```typescript
await client.releases.list({ status: "available", limit: 20, offset: 0 });
await client.releases.get("wss-ccg-vol-1");
await client.releases.tracks("wss-ccg-vol-1");
```

### Tracks (Bearer)
```typescript
await client.tracks.download("the-loop-of-hope", "FULL_MIX");
```

### Auth
```typescript
await client.auth.register({ email, password, fullName, company }); // public
await client.auth.login({ email, password });                        // public
await client.auth.logout();                                          // cookie
await client.auth.me();                                              // cookie
await client.auth.createToken({ name: "prod" }, "idem-key");         // cookie + idem
await client.auth.refreshToken("idem-key");                          // bearer + idem
```

### User (Bearer)
```typescript
await client.user.usage();
await client.user.subscription();
```

### Dashboard (Cookie, idempotent)
```typescript
await client.dashboard.download(
  { trackSlug: "the-loop-of-hope", assetType: "FULL_MIX" },
  "idem-key-001"
);
```

### Datasets (Dataset Centric 2.0)
```typescript
// Public — form options
await client.datasets.chainState();

// Public — submit request
await client.datasets.request({
  datasetName: "My Dataset",
  tracks: [{ name: "Volume_1", key: "Dm", bpm: 120, harmony: "Dm-Bb-C-Gm", items: [] }],
  email: "user@example.com",
});

// Bearer — Dataset Centric 2.0 manifest
const m = await client.datasets.manifest("wss-ccg-ds-NNNN");
console.log(m.dataset.standardVersion); // wss-ccg-ds-2.0
```

### Asset Types (7)
`FULL_MIX` | `STEM_RHYTHM` | `STEM_ARPEGGIO` | `STEM_SOLO` | `DI_RHYTHM` | `DI_ARPEGGIO` | `DI_SOLO`

---

## Errors

All errors extend `WallStackError`. Each maps to a Stripe-style `type`:

| Class | Status | Type |
|---|---|---|
| `AuthenticationError` | 401 | `authentication_error` |
| `PermissionError` | 403 | `permission_error` |
| `NotFoundError` | 404 | `not_found_error` |
| `ValidationError` | 400 | `invalid_request_error` |
| `ConflictError` | 409 | `conflict_error` |
| `RateLimitError` | 429 | `rate_limit_error` |
| `ServerError` | 500+ | `api_error` |

```typescript
import { NotFoundError, RateLimitError } from "@wallstack-aa-caas/sdk";

try {
  await client.releases.get("does-not-exist");
} catch (err) {
  if (err instanceof NotFoundError) {
    console.error(err.code);       // "release_not_found"
    console.error(err.requestId);
  } else if (err instanceof RateLimitError) {
    console.error(err.retryAfter); // seconds
  }
}
```

All error codes are exported:

```typescript
import { ErrorCode } from "@wallstack-aa-caas/sdk";
ErrorCode.RATE_LIMITED;          // "rate_limit_exceeded"
ErrorCode.RELEASE_NOT_FOUND;     // "release_not_found"
```

---

## Rate Limits

| Preset | Limit | Applies to |
|---|---|---|
| `AUTH` | 300 req/min | Auth endpoints |
| `PUBLIC` | 60 req/min | `/releases`, `/health` |
| `DOWNLOAD` | 30 req/min | File download |

---

## Idempotency

Pass an `Idempotency-Key` on supported endpoints (24h TTL):

```typescript
await client.dashboard.download(
  { trackSlug: "the-loop-of-hope", assetType: "FULL_MIX" },
  "order-42-20261004"
);
```

---

## Requirements

- Node.js **>= 18** (uses global `fetch`)
- TypeScript **>= 5.0**
- Works in edge runtimes — pass `fetch` in options

---

## Development

```bash
npm install
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src
npm run build        # tsup (ESM + CJS + DTS)
npm test             # vitest run
```

---

## License

MIT (c) 2026 WallStack · B2B CaaS Audio

Author: Andrey S. Yarovenko
Contact: origin@wallstackaudio.com
Docs: https://wallstackaudio.com/api-docs