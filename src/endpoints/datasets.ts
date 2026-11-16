/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/datasets.ts
   VERSION:   1.1.0 (SDK · Datasets endpoints — Dataset Centric 2.0)
   DATE:      2026-11-16
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /datasets endpoints of the WallStack REST v2 API.
   Implements Dataset Centric 2.0 (wss-ccg-ds-2.0).

   ARCHITECTURAL ROLE:
   Exposes AI Training dataset operations: form options (chain-state),
   request submission (with registration), and JSON manifest download.
   Used via client.datasets.

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (DatasetManifest, ChainStateResponse, DatasetRequest, DatasetRequestResponse)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   datasets.ts
   ├── CLASS DatasetsClient
   │   ├── chainState()        → GET /datasets/chain-state (public)
   │   ├── request(body)       → POST /datasets/request-with-register (public)
   │   └── manifest(slug)      → GET /datasets/{slug}/json (Bearer)
   └── EXPORTS: DatasetsClient
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 1.0.0   | 2026-11-16 | Initial. Dataset Centric 2.0 support:               |
   |         |            | • chainState (form options).                        |
   |         |            | • request (with registration).                      |
   |         |            | • manifest (JSON manifest).                         |
   ========================================================================== */

import type { HttpClient } from "../client.js";
import type {
  DatasetManifest,
  ChainStateResponse,
  DatasetRequest,
  DatasetRequestResponse,
} from "../types.js";

/* ==========================================================================
   DATASETS CLIENT
   ========================================================================== */

/**
 * Client for the /datasets endpoints (Dataset Centric 2.0).
 *
 * @example
 * ```typescript
 * import { WallStackClient } from "@wallstack-aa-caas/sdk";
 *
 * const client = new WallStackClient({ apiKey: "ws_live_..." });
 *
 * // Public — form options
 * const state = await client.datasets.chainState();
 *
 * // Public — submit request
 * const result = await client.datasets.request({
 *   datasetName: "My Dataset",
 *   tracks: [...],
 *   email: "user@example.com",
 * });
 *
 * // Bearer — download manifest
 * const manifest = await client.datasets.manifest("wss-ccg-ds-0001");
 * console.log(manifest.dataset.standardVersion); // "wss-ccg-ds-2.0"
 * ```
 */
export class DatasetsClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get chain state (form options for dataset request).
   * Public endpoint: GET /datasets/chain-state.
   */
  public async chainState(): Promise<ChainStateResponse> {
    return this.http.request<ChainStateResponse>(
      "GET",
      "/datasets/chain-state",
      { auth: "none" }
    );
  }

  /**
   * Submit dataset request (with optional registration).
   * Public endpoint: POST /datasets/request-with-register.
   */
  public async request(
    body: DatasetRequest
  ): Promise<DatasetRequestResponse> {
    return this.http.request<DatasetRequestResponse>(
      "POST",
      "/datasets/request-with-register",
      { auth: "none", body }
    );
  }

  /**
   * Get dataset manifest (Dataset Centric 2.0).
   * Bearer endpoint: GET /datasets/{slug}/json.
   */
  public async manifest(slug: string): Promise<DatasetManifest> {
    return this.http.request<DatasetManifest>(
      "GET",
      `/datasets/${encodeURIComponent(slug)}/json`,
      { auth: "bearer" }
    );
  }
}

/* ==========================================================================
   END OF FILE
   ========================================================================== */
