/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      tests/endpoints/releases.test.ts
   VERSION:   0.2.0 (SDK · Releases endpoint tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Unit tests for ReleasesClient: list(), get(), tracks().
   All endpoints are public (no auth required).

   ARCHITECTURAL ROLE:
   Verifies that ReleasesClient correctly calls the /releases endpoints,
   builds query strings, and unwraps { data, meta } responses.

   DEPENDENCIES:
   - vitest
   - ../../src/client.js (HttpClient)
   - ../../src/endpoints/releases.js (ReleasesClient)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   releases.test.ts
   ├── HELPERS
   │   ├── jsonResponse(body, status)
   │   └── makeReleases(handler)
   └── SUITE: ReleasesClient
       ├── list()    → GET /releases?status=&limit=&offset=
       ├── get()     → GET /releases/{slug}
       └── tracks()  → GET /releases/{slug}/tracks
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [test: releases.list({ status, limit, offset })]
              │
              ▼
   ┌──────────────────────────────────────┐
   │  Build query string                  │
   │  ?status=available&limit=20&offset=0 │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  mockFetch captures URL              │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  Assertions                          │
   │  • url contains /releases            │
   │  • url contains status=available     │
   │  • url contains limit=20             │
   │  • url contains offset=0             │
   └──────────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial tests for ReleasesClient.                   |
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../../src/client.js";
import { ReleasesClient } from "../../src/endpoints/releases.js";

/* ==========================================================================
   HELPERS
   ========================================================================== */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeReleases(handler: (req: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new Request(input as RequestInfo, init))
  );
  const http = new HttpClient({ fetch: fetchMock as unknown as typeof fetch });
  return { releases: new ReleasesClient(http), fetchMock };
}

/* ==========================================================================
   SUITE: RELEASES CLIENT
   ========================================================================== */

describe("ReleasesClient", () => {
  it("list() calls GET /releases with query", async () => {
    const { releases, fetchMock } = makeReleases(() =>
      jsonResponse({
        data: { releases: [], total: 0, limit: 50, offset: 0 },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    await releases.list({ status: "available", limit: 20, offset: 0 });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/releases");
    expect(url).toContain("status=available");
    expect(url).toContain("limit=20");
    expect(url).toContain("offset=0");
  });

  it("get() calls GET /releases/{slug}", async () => {
    const { releases, fetchMock } = makeReleases(() =>
      jsonResponse({
        data: { id: "r1", slug: "vol-1", title: "Vol 1", tracks: [] },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const detail = await releases.get("vol-1");
    expect(detail.slug).toBe("vol-1");
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/releases/vol-1");
  });

  it("tracks() calls GET /releases/{slug}/tracks", async () => {
    const { releases, fetchMock } = makeReleases(() =>
      jsonResponse({ data: [], meta: { request_id: "r", timestamp: "t" } })
    );

    await releases.tracks("vol-1");
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/releases/vol-1/tracks");
  });

  it("get() throws when slug missing", async () => {
    const { releases } = makeReleases(() => jsonResponse({}));
    await expect(releases.get("")).rejects.toThrow("slug is required");
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
