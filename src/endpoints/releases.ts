/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/releases.ts
   VERSION:   0.2.0 (SDK · Releases endpoints)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /releases endpoints of the WallStack REST v2 API.
   All endpoints are public (no auth required).

   ARCHITECTURAL ROLE:
   Replaces the fictional DatasetsClient from v0.1.1. Exposes the real
   release catalog and track listing. Used via client.releases.

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (Release, ReleaseDetail, Track, ListReleasesParams)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   releases.ts
   ├── CLASS ReleasesClient
   │   ├── list(params?)       → GET /releases
   │   ├── get(slug)           → GET /releases/{slug}
   │   └── tracks(slug)        → GET /releases/{slug}/tracks
   └── EXPORTS: ReleasesClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [client.releases.list({ status: "available" })]
              │
              ▼
   ┌────────────────────────────────────┐
   │  Build query string                │
   │  status=available&limit=50&offset=0│
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  HttpClient.request(               │
   │    "GET", "/releases?..."          │
   │    auth: "none"                    │
   │  )                                 │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  { data: { releases, total, ... }, │
   │    meta } → data.releases          │
   └────────────────────────────────────┘

   [client.releases.get("wss-ccg-vol-1")]
              │
              ▼
   ┌────────────────────────────────────┐
   │  GET /releases/wss-ccg-vol-1       │
   │  → ReleaseDetail (release + tracks)│
   └────────────────────────────────────┘

   [client.releases.tracks("wss-ccg-vol-1")]
              │
              ▼
   ┌────────────────────────────────────┐
   │  GET /releases/wss-ccg-vol-1/tracks│
   │  → Track[]                         │
   └────────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial ReleasesClient (replaces DatasetsClient).   |
   |         |            | • list() with status/limit/offset.                  |
   |         |            | • get(slug) → ReleaseDetail.                        |
   |         |            | • tracks(slug) → Track[].                           |
   |         |            | • All public (auth: "none").                        |
   ========================================================================== */

import type { HttpClient } from "../client.js";
import type {
  Release,
  ReleaseDetail,
  Track,
  ListReleasesParams,
} from "../types.js";

/* ==========================================================================
   INTERNAL TYPES
   ========================================================================== */

/**
 * List response shape from GET /releases.
 * Note: the API wraps this inside { data, meta }, and the client
 * unwraps `data` automatically. So we only model the inner shape here.
 */
interface ReleasesListData {
  releases: Release[];
  total: number;
  limit: number;
  offset: number;
}

/* ==========================================================================
   RELEASES CLIENT
   ========================================================================== */

/**
 * Client for the public /releases endpoints.
 *
 * @example
 * ```typescript
 * const { releases, total } = await client.releases.list({
 *   status: "available",
 *   limit: 20,
 * });
 *
 * const detail = await client.releases.get("wss-ccg-vol-1");
 * console.log(detail.title, detail.tracks.length);
 *
 * const tracks = await client.releases.tracks("wss-ccg-vol-1");
 * ```
 */
export class ReleasesClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lists releases with optional filtering and pagination.
   *
   * @param params — Optional filters (status, limit, offset).
   * @returns Object with `releases`, `total`, `limit`, `offset`.
   */
  public async list(params?: ListReleasesParams): Promise<ReleasesListData> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));

    const qs = query.toString();
    const path = qs ? "/releases?" + qs : "/releases";

    return this.http.request<ReleasesListData>("GET", path, { auth: "none" });
  }

  /**
   * Fetches a single release by slug, including its tracks.
   *
   * @param slug — Release slug (e.g. "wss-ccg-vol-1").
   * @returns Full release detail with tracks array.
   * @throws {NotFoundError} When the release does not exist.
   */
  public async get(slug: string): Promise<ReleaseDetail> {
    if (!slug) {
      throw new Error("slug is required");
    }
    return this.http.request<ReleaseDetail>(
      "GET",
      "/releases/" + encodeURIComponent(slug),
      { auth: "none" }
    );
  }

  /**
   * Lists tracks of a specific release.
   *
   * @param slug — Release slug.
   * @returns Array of tracks.
   * @throws {NotFoundError} When the release does not exist.
   */
  public async tracks(slug: string): Promise<Track[]> {
    if (!slug) {
      throw new Error("slug is required");
    }
    return this.http.request<Track[]>(
      "GET",
      "/releases/" + encodeURIComponent(slug) + "/tracks",
      { auth: "none" }
    );
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
