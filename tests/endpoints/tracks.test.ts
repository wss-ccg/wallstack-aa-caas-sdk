/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      tests/endpoints/tracks.test.ts
   VERSION:   0.2.0 (SDK · Tracks endpoint tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Unit tests for TracksClient: download(slug, assetType).
   Requires Bearer API key authentication.

   ARCHITECTURAL ROLE:
   Verifies URL construction, Bearer header, and asset_type query.

   DEPENDENCIES:
   - vitest
   - ../../src/client.js (HttpClient)
   - ../../src/endpoints/tracks.js (TracksClient)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   tracks.test.ts
   ├── HELPERS
   │   ├── jsonResponse(body, status)
   │   └── makeTracks(handler)
   └── SUITE: TracksClient
       ├── download()       → GET /tracks/{slug}/download?asset_type=
       ├── throws on empty slug
       └── throws on empty assetType
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [test: tracks.download("the-loop-of-hope", "FULL_MIX")]
              │
              ▼
   ┌──────────────────────────────────────┐
   │  Build URL                           │
   │  /tracks/the-loop-of-hope/download   │
   │     ?asset_type=FULL_MIX             │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  Bearer auth header                  │
   │  Authorization: Bearer ws_live_test  │
   └──────────────┬───────────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────────┐
   │  Assertions                          │
   │  • url contains /download            │
   │  • url contains asset_type=FULL_MIX  │
   │  • Authorization header present      │
   └──────────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial tests for TracksClient.                     |
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../../src/client.js";
import { TracksClient } from "../../src/endpoints/tracks.js";

/* ==========================================================================
   HELPERS
   ========================================================================== */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeTracks(handler: (req: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new Request(input as RequestInfo, init))
  );
  const http = new HttpClient({
    apiKey: "ws_live_test",
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { tracks: new TracksClient(http), fetchMock };
}

/* ==========================================================================
   SUITE: TRACKS CLIENT
   ========================================================================== */

describe("TracksClient", () => {
  it("download() calls GET /tracks/{slug}/download with asset_type", async () => {
    const { tracks, fetchMock } = makeTracks(() =>
      jsonResponse({
        data: {
          download_url: "https://cdn.example.com/x.wav",
          license_id: "WSS-LIC-V1",
          expires_in: 900,
          track_title: "x",
          asset_type: "FULL_MIX",
        },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const dl = await tracks.download("the-loop-of-hope", "FULL_MIX");
    expect(dl.download_url).toBe("https://cdn.example.com/x.wav");
    expect(dl.expires_in).toBe(900);

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/tracks/the-loop-of-hope/download");
    expect(url).toContain("asset_type=FULL_MIX");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ws_live_test");
  });

  it("download() throws when slug missing", async () => {
    const { tracks } = makeTracks(() => jsonResponse({}));
    await expect(tracks.download("", "FULL_MIX")).rejects.toThrow(
      "slug is required"
    );
  });

  it("download() throws when assetType missing", async () => {
    const { tracks } = makeTracks(() => jsonResponse({}));
    await expect(
      tracks.download("x", "" as unknown as "FULL_MIX")
    ).rejects.toThrow("assetType is required");
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
