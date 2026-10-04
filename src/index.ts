/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/index.ts
   VERSION:   0.2.0 (SDK · Main facade)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Main entry point for @wallstack-aa-caas/sdk. Exposes the
   WallStackClient facade with 6 sub-clients, aligned with the real
   REST v2 API (19 endpoints, { data, meta }, Stripe-style errors).

   ARCHITECTURAL ROLE:
   Composition root: creates HttpClient, wires all endpoint clients,
   re-exports errors and types for consumers.

   SUB-CLIENTS:
   • health     — /health, /openapi (public)
   • releases   — /releases, /releases/{slug}, /releases/{slug}/tracks
   • tracks     — /tracks/{slug}/download (Bearer)
   • auth       — /auth/register, /login, /logout, /me, /token, /refresh
   • user       — /user/usage, /user/subscription (Bearer)
   • dashboard  — /dashboard/download (Cookie, idempotent)

   DEPENDENCIES:
   - ./client.js
   - ./errors.js
   - ./types.js
   - ./endpoints/health.js
   - ./endpoints/releases.js
   - ./endpoints/tracks.js
   - ./endpoints/auth.js
   - ./endpoints/user.js
   - ./endpoints/dashboard.js
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   index.ts
   ├── CONSTANTS
   │   ├── VERSION = "0.2.0"
   │   └── SDK_NAME = "@wallstack-aa-caas/sdk"
   ├── CLASS WallStackClient
   │   ├── health:     HealthClient
   │   ├── releases:   ReleasesClient
   │   ├── tracks:     TracksClient
   │   ├── auth:       AuthClient
   │   ├── user:       UserClient
   │   ├── dashboard:  DashboardClient
   │   ├── setApiKey(key)
   │   ├── setJwtCookie(cookie)
   │   └── private http: HttpClient
   ├── RE-EXPORTS
   │   ├── Errors (7 classes + ErrorCode)
   │   ├── Types (all from ./types.js)
   │   └── Sub-clients
   └── DEFAULT EXPORT: WallStackClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [new WallStackClient({ apiKey, jwtCookie })]
              │
              ▼
   ┌──────────────────────────────────┐
   │  HttpClient (dual auth, retry)   │
   └──────────────┬───────────────────┘
                  │
        ┌─────────┼─────────┬─────────┬─────────┬─────────┐
        ▼         ▼         ▼         ▼         ▼         ▼
   ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
   │ health ││releases││ tracks ││  auth  ││  user  ││dashbrd │
   │ public ││ public ││ bearer ││ mixed  ││ bearer ││ cookie │
   └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
        │         │         │         │         │         │
        └─────────┴─────────┴─────────┴─────────┴─────────┘
                  │
                  ▼
   ┌──────────────────────────────────┐
   │  API: https://wallstackaudio.com │
   │  /api/v2                         │
   └──────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.1.0   | 2026-10-02 | Initial release. 3 clients (datasets, tracks,       |
   |         |            | licenses). Fictional.                               |
   | 0.2.0   | 2026-10-04 | FULL REWRITE:                                       |
   |         |            | • 6 sub-clients (health, releases, tracks, auth,    |
   |         |            |   user, dashboard).                                 |
   |         |            | • Removed: DatasetsClient, LicensesClient.          |
   |         |            | • Added: HealthClient, ReleasesClient, AuthClient,  |
   |         |            |   UserClient, DashboardClient.                      |
   |         |            | • setApiKey() / setJwtCookie() for runtime auth.    |
   |         |            | • VERSION bumped 0.1.0 → 0.2.0.                     |
   ========================================================================== */

import { HttpClient } from "./client.js";
import { HealthClient } from "./endpoints/health.js";
import { ReleasesClient } from "./endpoints/releases.js";
import { TracksClient } from "./endpoints/tracks.js";
import { AuthClient } from "./endpoints/auth.js";
import { UserClient } from "./endpoints/user.js";
import { DashboardClient } from "./endpoints/dashboard.js";
import type { WallStackClientOptions } from "./types.js";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

/** SDK version. */
export const VERSION = "0.2.0";

/** SDK package name. */
export const SDK_NAME = "@wallstack-aa-caas/sdk";

/* ==========================================================================
   MAIN CLIENT
   ========================================================================== */

/**
 * Main entry point for the WallStack AA-CaaS™ SDK.
 *
 * @example
 * ```typescript
 * import { WallStackClient } from "@wallstack-aa-caas/sdk";
 *
 * const client = new WallStackClient({ apiKey: "ws_live_..." });
 *
 * // Public
 * const { releases } = await client.releases.list({ status: "available" });
 * const detail = await client.releases.get("wss-ccg-vol-1");
 *
 * // Bearer
 * const dl = await client.tracks.download("the-loop-of-hope", "FULL_MIX");
 * const usage = await client.user.usage();
 *
 * // Auth + Cookie
 * await client.auth.login({ email, password });
 * const me = await client.auth.me();
 * const key = await client.auth.createToken({ name: "prod" });
 * ```
 */
export class WallStackClient {
  /** Health / OpenAPI (public). */
  public readonly health: HealthClient;

  /** Releases catalog (public). */
  public readonly releases: ReleasesClient;

  /** Track download (Bearer). */
  public readonly tracks: TracksClient;

  /** Auth (register/login/logout/me/token/refresh). */
  public readonly auth: AuthClient;

  /** User usage & subscription (Bearer). */
  public readonly user: UserClient;

  /** Dashboard download (Cookie, idempotent). */
  public readonly dashboard: DashboardClient;

  private readonly http: HttpClient;

  /**
   * Creates a new WallStack client.
   *
   * @param options — Client configuration (apiKey?, jwtCookie?, baseUrl?, ...).
   */
  constructor(options: WallStackClientOptions = {}) {
    this.http = new HttpClient(options);

    this.health = new HealthClient(this.http);
    this.releases = new ReleasesClient(this.http);
    this.tracks = new TracksClient(this.http);
    this.auth = new AuthClient(this.http);
    this.user = new UserClient(this.http);
    this.dashboard = new DashboardClient(this.http);
  }

  /**
   * Sets / replaces the API key used for Bearer auth.
   *
   * @param key — API key (ws_live_* or ws_sandbox_*).
   */
  public setApiKey(key: string): void {
    this.http.setApiKey(key);
  }

  /**
   * Sets / replaces the JWT cookie used for Cookie auth.
   *
   * @param cookie — JWT token (ws_session cookie value).
   */
  public setJwtCookie(cookie: string): void {
    this.http.setJwtCookie(cookie);
  }
}

/* ==========================================================================
   RE-EXPORTS — ERRORS
   ========================================================================== */

export {
  WallStackError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  ServerError,
  ErrorCode,
  createErrorFromApi,
} from "./errors.js";

export type { ErrorCodeValue } from "./errors.js";

/* ==========================================================================
   RE-EXPORTS — TYPES
   ========================================================================== */

export type {
  /* Response */
  ApiResponse,
  ResponseMeta,
  RateLimitMeta,
  /* Errors */
  ErrorType,
  ApiErrorBody,
  ApiErrorResponse,
  /* Auth */
  UserRole,
  PlanTier,
  Workspace,
  User,
  ApiKey,
  /* Releases */
  ReleaseStatus,
  EditionType,
  Release,
  ReleaseTrackPreview,
  ReleaseDetail,
  /* Tracks */
  StemType,
  Track,
  /* Assets */
  AssetType,
  AssetContentType,
  AssetChannel,
  AssetStatus,
  Asset,
  /* User */
  Period,
  RequestCounter,
  Usage,
  SubscriptionFeatures,
  Subscription,
  /* Downloads */
  DownloadRequest,
  DownloadResponse,
  /* Request bodies */
  RegisterRequest,
  LoginRequest,
  TokenRequest,
  /* Params */
  ListReleasesParams,
  /* Client */
  WallStackClientOptions,
} from "./types.js";

/* ==========================================================================
   RE-EXPORTS — CLIENTS
   ========================================================================== */

export { HttpClient } from "./client.js";
export type { AuthMode, RequestOptions } from "./client.js";

export { HealthClient } from "./endpoints/health.js";
export type { HealthStatus, HealthData } from "./endpoints/health.js";

export { ReleasesClient } from "./endpoints/releases.js";

export { TracksClient } from "./endpoints/tracks.js";

export { AuthClient } from "./endpoints/auth.js";

export { UserClient } from "./endpoints/user.js";

export { DashboardClient } from "./endpoints/dashboard.js";

/* ==========================================================================
   DEFAULT EXPORT
   ========================================================================== */

export default WallStackClient;

/* ==========================================================================
   END OF FILE
   --------------------------------------------------------------------------
   Copyright(c) 2026 WallStack · B2B CaaS Audio. All rights reserved.

   Author:   Andrey S. Yarovenko (WallStack)
   Project:  AA-CaaS™ (Analog Audio Content-as-a-Service)
   Contact:  origin@wallstackaudio.com
   Docs:     https://wallstackaudio.com/api-docs
   ========================================================================== */
