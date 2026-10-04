# Changelog

All notable changes to `@wallstack-aa-caas/sdk` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] — 2026-10-04

### Added
- **6 sub-clients** — `health`, `releases`, `tracks`, `auth`, `user`, `dashboard`
- `HealthClient` — `check()`, `openapi()`
- `ReleasesClient` — `list()`, `get(slug)`, `tracks(slug)`
- `AuthClient` — `register()`, `login()`, `logout()`, `me()`, `createToken()`, `refreshToken()`
- `UserClient` — `usage()`, `subscription()`
- `DashboardClient` — `download()` (idempotent)
- **Dual auth** — Bearer API key (`apiKey`) + JWT cookie (`jwtCookie`)
- **Idempotency-Key** support — `auth.createToken()`, `auth.refreshToken()`, `dashboard.download()`
- **Retry with exponential backoff** on 429 / 5xx (up to `maxRetries`)
- **Stripe-style errors** — 7 classes + `ErrorCode` (25+ constants) + `createErrorFromApi()`
- **`{ data, meta }` unwrapping** — automatic in `HttpClient`
- Full TypeScript types synced with OpenAPI 3.1
- 8 test files / 52 tests (vitest)

### Changed
- **BREAKING:** Response format aligned with real API — `{ data, meta }` instead of raw payload.
- **BREAKING:** IDs are now `string` (was `number` in some places).
- **BREAKING:** Auth is dual (Bearer + JWT cookie) instead of Bearer only.
- **BREAKING:** `HttpClient` constructor accepts `{ apiKey?, jwtCookie?, ... }` — no more mandatory `apiKey`.
- `client.releases.*` replaces `client.datasets.*`.
- `client.tracks.download(slug, assetType)` replaces `client.tracks.download(id, format, variant)`.
- `package.json` version `0.1.1` → `0.2.0`.

### Removed
- **BREAKING:** `DatasetsClient` (`client.datasets.*`) — replaced by `ReleasesClient`.
- **BREAKING:** `LicensesClient` (`client.licenses.*`) — not part of the real API.
- **BREAKING:** `TimeoutError`, `NetworkError` — not part of the API's Stripe-style error set.
- **BREAKING:** `Dataset`, `License`, `LicenseType`, `CreateLicenseParams`, `PaginatedResponse`, `ListParams` — replaced by real types.
- `TracksClient.get()`, `TracksClient.list()` — do not exist in the API.

### Fixed
- Auth header is now correct per endpoint (`bearer` / `cookie` / `none`) instead of always Bearer.
- Error mapping now uses the API's real Stripe-style body: `{ error: { type, code, message, ... } }` instead of `{ status, message }`.

---

## [0.1.1] — 2026-10-02

### Fixed
- TypeScript declaration build (`dist/index.d.ts`).
- ESM + CJS dual build via tsup.

---

## [0.1.0] — 2026-10-02

### Added
- Initial (fictional) release.
- `WallStackClient` with `datasets`, `tracks`, `licenses` sub-clients.
- Bearer-only auth.

---

[0.2.0]: https://github.com/wss-ccg/wallstack-aa-caas-sdk/compare/sdk-v0.1.1...sdk-v0.2.0
[0.1.1]: https://github.com/wss-ccg/wallstack-aa-caas-sdk/releases/tag/sdk-v0.1.1
[0.1.0]: https://github.com/wss-ccg/wallstack-aa-caas-sdk/releases/tag/sdk-v0.1.0