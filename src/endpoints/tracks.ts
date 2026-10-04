/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/tracks.ts
   VERSION:   0.2.0 (SDK · Tracks download endpoint)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /tracks/{slug}/download endpoint of the WallStack
   REST v2 API. Requires Bearer API key authentication.

   ARCHITECTURAL ROLE:
   Replaces the fictional TracksClient from v0.1.1 (which had get/list/
   download with wrong params). Only the real download endpoint remains.

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (AssetType, DownloadResponse)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   tracks.ts
   ├── CLASS TracksClient
   │   └── download(slug, assetType) → GET /tracks/{slug}/download
   └── EXPORTS: TracksClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [client.tracks.download("the-loop-of-hope", "FULL_MIX")]
              │
              ▼
   ┌────────────────────────────────────┐
   │  Build query:                      │
   │  ?asset_type=FULL_MIX              │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  HttpClient.request(               │
   │    "GET",                          │
   │    "/tracks/the-loop-of-hope/      │
   │       download?asset_type=FULL_MIX"│
   │    auth: "bearer"                  │
   │  )                                 │
   └──────────────┬─────────────────────┘
                  │
        ┌─────────┴──────────┐
        │ 200                │ 401/403/404/429
        ▼                    ▼
   ┌──────────────┐   ┌──────────────────┐
   │ DownloadResp │   │ Authentication / │
   │ {url,lic,ttl}│   │ Permission /     │
   │              │   │ NotFound /       │
   │              │   │ RateLimit        │
   └──────────────┘   └──────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.1.0   | 2026-10-02 | Initial (fictional): get/list/download.             |
   |         |            | download(id, format, variant) — wrong params.       |
   | 0.2.0   | 2026-10-04 | FULL REWRITE:                                       |
   |         |            | • Removed get() — does not exist in API.            |
   |         |            | • Removed list() — does not exist in API.           |
   |         |            | • download(slug, assetType) — correct.              |
   |         |            | • Returns DownloadResponse (url, license_id, ttl).  |
   |         |            | • Requires Bearer API key.                          |
   ========================================================================== */

import type { HttpClient } from "../client.js";
import type { AssetType, DownloadResponse } from "../types.js";

/* ==========================================================================
   TRACKS CLIENT
   ========================================================================== */

/**
 * Client for the /tracks/{slug}/download endpoint.
 *
 * @example
 * ```typescript
 * const dl = await client.tracks.download("the-loop-of-hope", "FULL_MIX");
 * console.log(dl.download_url, dl.license_id, dl.expires_in);
 * ```
 */
export class TracksClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Returns a signed CDN URL for downloading a track asset.
   *
   * @param slug — Track slug (e.g. "the-loop-of-hope").
   * @param assetType — One of 7 asset types (FULL_MIX, STEM_*, DI_*).
   * @returns Download response with URL, license ID, and TTL.
   * @throws {AuthenticationError} When the API key is missing or invalid.
   * @throws {PermissionError} When the release was not purchased.
   * @throws {NotFoundError} When the track or asset does not exist.
   * @throws {RateLimitError} When the daily/rolling quota is exceeded.
   */
  public async download(
    slug: string,
    assetType: AssetType
  ): Promise<DownloadResponse> {
    if (!slug) {
      throw new Error("slug is required");
    }
    if (!assetType) {
      throw new Error("assetType is required");
    }

    const query = new URLSearchParams({ asset_type: assetType });
    const path =
      "/tracks/" + encodeURIComponent(slug) + "/download?" + query.toString();

    return this.http.request<DownloadResponse>("GET", path, {
      auth: "bearer",
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
