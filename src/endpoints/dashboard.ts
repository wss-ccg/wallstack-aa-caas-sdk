/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/dashboard.ts
   VERSION:   0.2.0 (SDK · Dashboard endpoints)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /dashboard endpoints of the WallStack REST v2 API.
   The dashboard download is idempotent (24h key TTL) and requires
   JWT cookie authentication.

   ARCHITECTURAL ROLE:
   DashboardClient wraps 1 endpoint: POST /dashboard/download.
   Different from tracks.download() — dashboard is cookie-auth and
   idempotent, while tracks.download() is bearer-auth.

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (DownloadRequest, DownloadResponse)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   dashboard.ts
   ├── CLASS DashboardClient
   │   └── download(params, idempotencyKey?) → POST /dashboard/download
   └── EXPORTS: DashboardClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [client.dashboard.download(
   │   { trackSlug: "the-loop-of-hope", assetType: "FULL_MIX" },
   │   "idem_abc123"
   │ )]
              │
              ▼
   ┌────────────────────────────────────┐
   │  POST /dashboard/download          │
   │  Cookie: ws_session=...            │
   │  Idempotency-Key: idem_abc123      │
   │  Body: { trackSlug, assetType }    │
   └──────────────┬─────────────────────┘
                  │
        ┌─────────┴──────────┐
        │ 1st call           │ repeat call (same idem key)
        ▼                    ▼
   ┌──────────────┐   ┌──────────────────┐
   │ Handler runs │   │ Cached response  │
   │ • checkAccess│   │ Idempotency-     │
   │ • record     │   │ Replayed: true   │
   │ • build URL  │   └──────────────────┘
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────┐
   │  { data: DownloadResponse }       │
   │  {                                │
   │    download_url, license_id,      │
   │    expires_in, track_title,       │
   │    asset_type                     │
   │  }                                │
   └───────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial DashboardClient (new file).                 |
   |         |            | • download(params, idempotencyKey?) → POST /dashboard/download. |
   |         |            | • Cookie auth (JWT).                                |
   |         |            | • Idempotency-Key (24h TTL).                        |
   ========================================================================== */

import type { HttpClient } from "../client.js";
import type { DownloadRequest, DownloadResponse } from "../types.js";

/* ==========================================================================
   DASHBOARD CLIENT
   ========================================================================== */

/**
 * Client for the /dashboard endpoints.
 *
 * @example
 * ```typescript
 * const dl = await client.dashboard.download(
 *   { trackSlug: "the-loop-of-hope", assetType: "FULL_MIX" },
 *   "idem_unique_key_123" // optional
 * );
 * console.log(dl.download_url, dl.license_id, dl.expires_in);
 * ```
 */
export class DashboardClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Downloads a track asset from the dashboard.
   *
   * Requires JWT cookie auth (ws_session).
   * Idempotent: pass the same idempotencyKey to replay the original result.
   *
   * @param params — trackSlug + assetType.
   * @param idempotencyKey — Optional idempotency key (24h TTL).
   * @returns Download response with URL, license ID, TTL.
   * @throws {AuthenticationError} When the JWT cookie is missing or expired.
   * @throws {RateLimitError} When the daily/rolling quota is exceeded.
   */
  public async download(
    params: DownloadRequest,
    idempotencyKey?: string
  ): Promise<DownloadResponse> {
    if (!params.trackSlug) {
      throw new Error("trackSlug is required");
    }
    if (!params.assetType) {
      throw new Error("assetType is required");
    }

    return this.http.request<DownloadResponse>("POST", "/dashboard/download", {
      body: params,
      auth: "cookie",
      idempotencyKey,
    });
  }
}

/* ==========================================================================
   END OF FILE
   --------------------------------------------------------------------------
   Copyright(c) 2026 WallStack · B2B CaaS Audio. All rights reserved.

   Author:   Andrey S. Yarovenko (WallStack)
   Project:  AA-CaaS™ (Analog Audio Content-as-a-Service)
   Contact:  origin@wallstackaudio.com
   Docs:     https://wallstackaudio.com/api-docs
   ========================================================================== */
