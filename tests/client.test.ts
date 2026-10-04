/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      tests/client.test.ts
   VERSION:   0.2.0 (SDK · HttpClient tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Unit tests for HttpClient: dual auth, { data, meta } unwrapping,
   idempotency header, retry with exponential backoff, and Stripe-style
   error mapping.

   DEPENDENCIES:
   - vitest
   - ../src/client.js
   - ../src/errors.js
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   client.test.ts
   ├── HELPERS
   │   ├── jsonResponse(body, status)
   │   └── makeClient(handler, opts?)
   ├── SUITE: HttpClient — auth
   ├── SUITE: HttpClient — unwrap
   ├── SUITE: HttpClient — idempotency
   ├── SUITE: HttpClient — retry
   └── SUITE: HttpClient — error mapping
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [test: request() with apiKey]
              │
              ▼
   ┌──────────────────────────────┐
   │  mockFetch captures request  │
   │  • url, headers, method, body│
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  Assertions                  │
   │  • Authorization: Bearer ... │
   │  • Cookie: ws_session=...    │
   │  • Idempotency-Key: ...      │
   │  • unwrap { data, meta }     │
   │  • error mapping (7 types)   │
   └──────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial tests for HttpClient.                       |
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../src/client.js";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "../src/errors.js";

/* ==========================================================================
   HELPERS
   ========================================================================== */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeClient(
  handler: (req: Request) => Response | Promise<Response>,
  opts: { apiKey?: string; jwtCookie?: string } = {}
) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input as RequestInfo, init);
      return handler(req);
    }
  );

  const http = new HttpClient({
    apiKey: opts.apiKey,
    jwtCookie: opts.jwtCookie,
    fetch: fetchMock as unknown as typeof fetch,
  });

  return { http, fetchMock };
}

/* ==========================================================================
   SUITE: AUTH
   ========================================================================== */

describe("HttpClient — auth", () => {
  it("sends Bearer header when apiKey is set", async () => {
    const { http, fetchMock } = makeClient(
      () =>
        jsonResponse({
          data: { ok: true },
          meta: { request_id: "r", timestamp: "t" },
        }),
      { apiKey: "ws_live_test" }
    );

    await http.request("GET", "/health");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ws_live_test");
  });

  it("sends Cookie header when jwtCookie is set and auth=cookie", async () => {
    const { http, fetchMock } = makeClient(
      () => jsonResponse({ data: {}, meta: { request_id: "r", timestamp: "t" } }),
      { jwtCookie: "jwt_abc" }
    );

    await http.request("GET", "/auth/me", { auth: "cookie" });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Cookie"]).toBe("ws_session=jwt_abc");
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("setApiKey replaces the key at runtime", async () => {
    const { http, fetchMock } = makeClient(() =>
      jsonResponse({ data: {}, meta: { request_id: "r", timestamp: "t" } })
    );

    http.setApiKey("ws_live_new");
    await http.request("GET", "/health");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ws_live_new");
  });
});

/* ==========================================================================
   SUITE: UNWRAP
   ========================================================================== */

describe("HttpClient — unwrap", () => {
  it("unwraps { data, meta } to data", async () => {
    const { http } = makeClient(() =>
      jsonResponse({
        data: { releases: [], total: 0 },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    const result = await http.request<{ releases: unknown[]; total: number }>(
      "GET",
      "/releases"
    );
    expect(result).toEqual({ releases: [], total: 0 });
  });

  it("returns undefined for 204 No Content", async () => {
    const { http } = makeClient(() => new Response(null, { status: 204 }));
    const result = await http.request("POST", "/auth/logout", {
      auth: "cookie",
    });
    expect(result).toBeUndefined();
  });
});

/* ==========================================================================
   SUITE: IDEMPOTENCY
   ========================================================================== */

describe("HttpClient — idempotency", () => {
  it("adds Idempotency-Key header when provided", async () => {
    const { http, fetchMock } = makeClient(() =>
      jsonResponse({ data: {}, meta: { request_id: "r", timestamp: "t" } })
    );

    await http.request("POST", "/auth/token", {
      auth: "cookie",
      idempotencyKey: "idem_xyz",
    });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("idem_xyz");
  });
});

/* ==========================================================================
   SUITE: RETRY
   ========================================================================== */

describe("HttpClient — retry", () => {
  it("retries on 429 then succeeds", async () => {
    let calls = 0;
    const { http } = makeClient(() => {
      calls++;
      if (calls === 1) {
        return jsonResponse(
          {
            error: {
              type: "rate_limit_error",
              code: "rate_limit_exceeded",
              message: "slow down",
            },
          },
          429
        );
      }
      return jsonResponse({
        data: { ok: true },
        meta: { request_id: "r", timestamp: "t" },
      });
    });

    const result = await http.request<{ ok: boolean }>("GET", "/health");
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it("retries on 500 then succeeds", async () => {
    let calls = 0;
    const { http } = makeClient(() => {
      calls++;
      if (calls === 1) {
        return jsonResponse(
          {
            error: {
              type: "api_error",
              code: "internal_server_error",
              message: "boom",
            },
          },
          500
        );
      }
      return jsonResponse({
        data: { ok: true },
        meta: { request_id: "r", timestamp: "t" },
      });
    });

    const result = await http.request<{ ok: boolean }>("GET", "/health");
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });
});

/* ==========================================================================
   SUITE: ERROR MAPPING
   ========================================================================== */

describe("HttpClient — error mapping", () => {
  it("maps 401 to AuthenticationError", async () => {
    const { http } = makeClient(() =>
      jsonResponse(
        {
          error: {
            type: "authentication_error",
            code: "invalid_api_key",
            message: "bad key",
          },
        },
        401
      )
    );

    await expect(http.request("GET", "/health")).rejects.toBeInstanceOf(
      AuthenticationError
    );
  });

  it("maps 404 to NotFoundError", async () => {
    const { http } = makeClient(() =>
      jsonResponse(
        {
          error: {
            type: "not_found_error",
            code: "release_not_found",
            message: "no",
          },
        },
        404
      )
    );

    await expect(http.request("GET", "/releases/x")).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("maps 400 to ValidationError", async () => {
    const { http } = makeClient(() =>
      jsonResponse(
        {
          error: {
            type: "invalid_request_error",
            code: "invalid_param_value",
            message: "bad",
          },
        },
        400
      )
    );

    await expect(http.request("GET", "/releases")).rejects.toBeInstanceOf(
      ValidationError
    );
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
