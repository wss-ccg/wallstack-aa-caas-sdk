/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   FILE:      tests/endpoints/user.test.ts
   VERSION:   0.2.0 (SDK · User endpoint tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:  Unit tests for UserClient (usage, subscription).
   DEPENDENCIES: vitest, ../../src/client.js, ../../src/endpoints/user.js
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../../src/client.js";
import { UserClient } from "../../src/endpoints/user.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeUser(handler: (req: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new Request(input as RequestInfo, init))
  );
  const http = new HttpClient({
    apiKey: "ws_live_test",
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { user: new UserClient(http), fetchMock };
}

describe("UserClient", () => {
  it("usage() GET /user/usage with Bearer", async () => {
    const { user, fetchMock } = makeUser(() =>
      jsonResponse({
        data: {
          api_key_id: "k1",
          key_prefix: "ws_live_a1",
          period: { start: "2026-10-01", end: "2026-10-31" },
          requests: { total: 42, limit: 2500, remaining: 2458 },
          last_used_at: "2026-10-04T00:00:00Z",
        },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const usage = await user.usage();
    expect(usage.requests.total).toBe(42);

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/user/usage");
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ws_live_test");
  });

  it("subscription() GET /user/subscription with Bearer", async () => {
    const { user } = makeUser(() =>
      jsonResponse({
        data: {
          tier: "CAAS",
          isActive: true,
          expiresAt: null,
          autoRenew: true,
          features: {
            monthlyRequests: 5000,
            reaperScriptAccess: true,
            apiAccess: true,
          },
        },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const sub = await user.subscription();
    expect(sub.tier).toBe("CAAS");
    expect(sub.isActive).toBe(true);
  });
});

/* Copyright(c) 2026 WallStack · B2B CaaS Audio. All rights reserved. */
