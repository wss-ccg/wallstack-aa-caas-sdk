/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      tests/endpoints/health.test.ts
   VERSION:   0.2.0 (SDK · Health endpoint tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Unit tests for HealthClient: check() and openapi().
   Both endpoints are public (no auth required).

   ARCHITECTURAL ROLE:
   Verifies that HealthClient correctly calls GET /health and
   GET /openapi, and that responses are parsed correctly.

   DEPENDENCIES:
   - vitest
   - ../../src/client.js (HttpClient)
   - ../../src/endpoints/health.js (HealthClient)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   health.test.ts
   ├── HELPERS
   │   ├── jsonResponse(body, status)
   │   └── makeHealth(handler)
   └── SUITE: HealthClient
       ├── check()    → GET /health (public)
       └── openapi()  → GET /openapi (public)
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [test: health.check()]
              │
              ▼
   ┌──────────────────────────────┐
   │  mockFetch captures request  │
   │  • url: /api/v2/health       │
   │  • no Authorization header   │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  Assertions                  │
   │  • status === "ok"           │
   │  • version === "2.0.0"       │
   │  • url contains /health      │
   └──────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial tests for HealthClient.                     |
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../../src/client.js";
import { HealthClient } from "../../src/endpoints/health.js";

/* ==========================================================================
   HELPERS
   ========================================================================== */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeHealth(handler: (req: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new Request(input as RequestInfo, init))
  );
  const http = new HttpClient({ fetch: fetchMock as unknown as typeof fetch });
  return { health: new HealthClient(http), fetchMock };
}

/* ==========================================================================
   SUITE: HEALTH CLIENT
   ========================================================================== */

describe("HealthClient", () => {
  it("check() calls GET /health (public)", async () => {
    const { health, fetchMock } = makeHealth(() =>
      jsonResponse({
        data: { status: "ok", version: "2.0.0", uptime_seconds: 100 },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const result = await health.check();
    expect(result.status).toBe("ok");
    expect(result.version).toBe("2.0.0");

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/v2/health");
  });

  it("openapi() calls GET /openapi (public)", async () => {
    const { health } = makeHealth(() =>
      jsonResponse({
        openapi: "3.1.0",
        info: { title: "WallStack", version: "2.0.0" },
      })
    );

    const spec = await health.openapi();
    expect(spec).toHaveProperty("openapi", "3.1.0");
  });
});

/* ==========================================================================
   END OF FILE
   --------------------------------------------------------------------------
   Copyright(c) 2026 WallStack · B2B CaaS Audio. All rights reserved.

   Author:   Andrey S. Yarovenko (WallStack)
   Project:  AA-CaaS™ (Analog Audio Content-as-a-Service)
   Contact:  origin@wallstackaudio.com
   Docs:     https://wallstackaudio.com/api-docs
   ========================================================================== */
