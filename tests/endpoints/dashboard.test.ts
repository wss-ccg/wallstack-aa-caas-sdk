/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   FILE:      tests/endpoints/dashboard.test.ts
   VERSION:   0.2.0 (SDK · Dashboard endpoint tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:  Unit tests for DashboardClient (download, idempotent).
   DEPENDENCIES: vitest, ../../src/client.js, ../../src/endpoints/dashboard.js
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../../src/client.js";
import { DashboardClient } from "../../src/endpoints/dashboard.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeDashboard(handler: (req: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new Request(input as RequestInfo, init))
  );
  const http = new HttpClient({
    jwtCookie: "jwt_test",
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { dashboard: new DashboardClient(http), fetchMock };
}

describe("DashboardClient", () => {
  it("download() POST /dashboard/download with Cookie", async () => {
    const { dashboard, fetchMock } = makeDashboard(() =>
      jsonResponse({
        data: {
          download_url: "https://cdn.example.com/y.wav",
          license_id: "WSS-LIC-ALL",
          expires_in: 900,
          track_title: "y",
          asset_type: "STEM_RHYTHM",
        },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const dl = await dashboard.download({
      trackSlug: "y",
      assetType: "STEM_RHYTHM",
    });
    expect(dl.download_url).toBe("https://cdn.example.com/y.wav");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Cookie"]).toBe("ws_session=jwt_test");
  });

  it("download() adds Idempotency-Key header", async () => {
    const { dashboard, fetchMock } = makeDashboard(() =>
      jsonResponse({
        data: {
          download_url: "https://cdn.example.com/y.wav",
          license_id: "WSS-LIC-ALL",
          expires_in: 900,
          track_title: "y",
          asset_type: "FULL_MIX",
        },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    await dashboard.download(
      { trackSlug: "y", assetType: "FULL_MIX" },
      "idem_dash_1"
    );

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("idem_dash_1");
  });

  it("download() throws on missing trackSlug", async () => {
    const { dashboard } = makeDashboard(() => jsonResponse({}));
    await expect(
      dashboard.download({ trackSlug: "", assetType: "FULL_MIX" })
    ).rejects.toThrow("trackSlug is required");
  });

  it("download() throws on missing assetType", async () => {
    const { dashboard } = makeDashboard(() => jsonResponse({}));
    await expect(
      dashboard.download({
        trackSlug: "y",
        assetType: "" as unknown as "FULL_MIX",
      })
    ).rejects.toThrow("assetType is required");
  });
});

/* Copyright(c) 2026 WallStack · B2B CaaS Audio. All rights reserved. */
