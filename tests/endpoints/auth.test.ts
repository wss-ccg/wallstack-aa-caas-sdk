/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   FILE:      tests/endpoints/auth.test.ts
   VERSION:   0.2.0 (SDK · Auth endpoint tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:  Unit tests for AuthClient (register, login, logout, me,
                 createToken, refreshToken).
   DEPENDENCIES: vitest, ../../src/client.js, ../../src/endpoints/auth.js
   ========================================================================== */

import { describe, it, expect, vi } from "vitest";
import { HttpClient } from "../../src/client.js";
import { AuthClient } from "../../src/endpoints/auth.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeAuth(handler: (req: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) =>
      handler(new Request(input as RequestInfo, init))
  );
  const http = new HttpClient({
    apiKey: "ws_live_test",
    jwtCookie: "jwt_test",
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { auth: new AuthClient(http), fetchMock };
}

describe("AuthClient", () => {
  it("register() POST /auth/register (public)", async () => {
    const { auth, fetchMock } = makeAuth(() =>
      jsonResponse(
        { data: { id: "u1", email: "x@y.z", role: "USER" },
          meta: { request_id: "r", timestamp: "t" } },
        201
      )
    );

    const user = await auth.register({
      email: "x@y.z",
      password: "12345678",
    });
    expect(user.email).toBe("x@y.z");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("login() POST /auth/login (public)", async () => {
    const { auth, fetchMock } = makeAuth(() =>
      jsonResponse({
        data: { id: "u1", email: "x@y.z", role: "USER" },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    await auth.login({ email: "x@y.z", password: "12345678" });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/auth/login");
  });

  it("logout() POST /auth/logout with Cookie", async () => {
    const { auth, fetchMock } = makeAuth(
      () => new Response(null, { status: 204 })
    );

    await auth.logout();
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Cookie"]).toBe("ws_session=jwt_test");
  });

  it("me() GET /auth/me with Cookie", async () => {
    const { auth, fetchMock } = makeAuth(() =>
      jsonResponse({
        data: { id: "u1", email: "x@y.z", role: "USER" },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    await auth.me();
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Cookie"]).toBe("ws_session=jwt_test");
  });

  it("createToken() POST /auth/token with Cookie + Idempotency-Key", async () => {
    const { auth, fetchMock } = makeAuth(() =>
      jsonResponse({
        data: {
          id: "k1",
          keyPrefix: "ws_live_a1",
          rawKey: "ws_live_a1xxxx",
          tier: "CAAS",
          isSandbox: false,
          createdAt: "2026-10-04T00:00:00Z",
          expiresAt: null,
          name: "prod",
        },
        meta: { request_id: "r", timestamp: "t" },
      }, 201)
    );

    const key = await auth.createToken({ name: "prod" }, "idem_1");
    expect(key.rawKey).toBe("ws_live_a1xxxx");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBe("idem_1");
    expect(headers["Cookie"]).toBe("ws_session=jwt_test");
  });

  it("refreshToken() POST /auth/refresh with Bearer + Idempotency-Key", async () => {
    const { auth, fetchMock } = makeAuth(() =>
      jsonResponse({
        data: {
          id: "k2",
          keyPrefix: "ws_live_b2",
          rawKey: "ws_live_b2yyyy",
          tier: "CAAS",
          isSandbox: false,
          createdAt: "2026-10-04T00:00:00Z",
          expiresAt: null,
          name: null,
        },
        meta: { request_id: "r", timestamp: "t" },
      })
    );

    await auth.refreshToken("idem_2");
    const headers = (fetchMock.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ws_live_test");
    expect(headers["Idempotency-Key"]).toBe("idem_2");
  });
});

/* Copyright(c) 2026 WallStack · B2B CaaS Audio. All rights reserved. */
