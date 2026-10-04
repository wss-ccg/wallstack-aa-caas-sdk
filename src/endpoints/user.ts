/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/user.ts
   VERSION:   0.2.0 (SDK · User endpoints)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /user endpoints of the WallStack REST v2 API.
   Returns API usage statistics and subscription information.
   Requires Bearer API key authentication.

   ARCHITECTURAL ROLE:
   UserClient wraps 2 endpoints: usage and subscription. Used for
   monitoring quota consumption and reading tier features.

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (Usage, Subscription)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   user.ts
   ├── CLASS UserClient
   │   ├── usage()         → GET /user/usage         (bearer)
   │   └── subscription()  → GET /user/subscription  (bearer)
   └── EXPORTS: UserClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [client.user.usage()]
              │
              ▼
   ┌────────────────────────────────────┐
   │  GET /user/usage  (Bearer)         │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  { data: Usage, meta }  →  Usage   │
   │  {                                 │
   │    api_key_id, key_prefix,         │
   │    period: { start, end },         │
   │    requests: { total, limit,       │
   │                remaining },        │
   │    last_used_at                    │
   │  }                                 │
   └────────────────────────────────────┘

   [client.user.subscription()]
              │
              ▼
   ┌────────────────────────────────────┐
   │  GET /user/subscription  (Bearer)  │
   └──────────────┬─────────────────────┘
                  │
                  ▼
   ┌────────────────────────────────────┐
   │  { data: Subscription, meta }      │
   │  {                                 │
   │    tier, isActive, expiresAt,      │
   │    autoRenew, features: {...}      │
   │  }                                 │
   └────────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial UserClient (new file).                      |
   |         |            | • usage()        → GET /user/usage.                 |
   |         |            | • subscription() → GET /user/subscription.          |
   ========================================================================== */

import type { HttpClient } from "../client.js";
import type { Usage, Subscription } from "../types.js";

/* ==========================================================================
   USER CLIENT
   ========================================================================== */

/**
 * Client for the /user endpoints.
 *
 * @example
 * ```typescript
 * const usage = await client.user.usage();
 * console.log(`${usage.requests.total} / ${usage.requests.limit} requests`);
 *
 * const sub = await client.user.subscription();
 * console.log(sub.tier, sub.isActive);
 * ```
 */
export class UserClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Returns API usage statistics for the current API key.
   *
   * @returns Usage info (period, request counter, last used).
   * @throws {AuthenticationError} When the API key is missing or invalid.
   */
  public async usage(): Promise<Usage> {
    return this.http.request<Usage>("GET", "/user/usage", {
      auth: "bearer",
    });
  }

  /**
   * Returns the current subscription (tier, features, status).
   *
   * @returns Subscription details.
   * @throws {AuthenticationError} When the API key is missing or invalid.
   */
  public async subscription(): Promise<Subscription> {
    return this.http.request<Subscription>("GET", "/user/subscription", {
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
