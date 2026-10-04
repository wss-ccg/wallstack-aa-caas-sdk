/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/health.ts
   VERSION:   0.2.0 (SDK · Health & OpenAPI endpoints)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /health and /openapi endpoints of the WallStack
   REST v2 API. Both are public (no auth required).

   ARCHITECTURAL ROLE:
   HealthClient exposes two public endpoints used for monitoring and
   SDK self-discovery. Used via client.health.

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (ResponseMeta)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   health.ts
   ├── TYPES
   │   ├── HealthStatus ("ok" | "degraded" | "down")
   │   └── HealthData
   ├── CLASS HealthClient
   │   ├── check()    → GET /health
   │   └── openapi()  → GET /openapi
   └── EXPORTS: HealthClient, HealthData, HealthStatus
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [client.health.check()]
              │
              ▼
   ┌──────────────────────────────┐
   │  HttpClient.request("GET",   │
   │    "/health")                │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  { data, meta } → data       │
   │  HealthData { status, ... }  │
   └──────────────────────────────┘

   [client.health.openapi()]
              │
              ▼
   ┌──────────────────────────────┐
   │  HttpClient.request("GET",   │
   │    "/openapi")               │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  Raw OpenAPI 3.1 document    │
   │  (no { data, meta } wrapper) │
   └──────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial HealthClient (new file).                    |
   |         |            | • check() → GET /health.                            |
   |         |            | • openapi() → GET /openapi.                         |
   ========================================================================== */

import type { HttpClient } from "../client.js";

/* ==========================================================================
   TYPES
   ========================================================================== */

/** Health status of the WallStack API. */
export type HealthStatus = "ok" | "degraded" | "down";

/** Health check payload. */
export interface HealthData {
  status: HealthStatus;
  version: string;
  uptime_seconds: number;
}

/* ==========================================================================
   HEALTH CLIENT
   ========================================================================== */

/**
 * Client for public meta endpoints (/health, /openapi).
 *
 * @example
 * ```typescript
 * const health = await client.health.check();
 * console.log(health.status, health.version);
 *
 * const spec = await client.health.openapi();
 * console.log(spec.openapi); // "3.1.0"
 * ```
 */
export class HealthClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Health check.
   *
   * @returns Health data (status, version, uptime).
   */
  public async check(): Promise<HealthData> {
    return this.http.request<HealthData>("GET", "/health", { auth: "none" });
  }

  /**
   * Returns the OpenAPI 3.1 document (raw, without { data, meta }).
   *
   * @returns OpenAPI spec object.
   */
  public async openapi(): Promise<Record<string, unknown>> {
    return this.http.request<Record<string, unknown>>("GET", "/openapi", {
      auth: "none",
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
