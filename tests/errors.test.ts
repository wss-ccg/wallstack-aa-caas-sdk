/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      tests/errors.test.ts
   VERSION:   0.2.0 (SDK · Error classes tests)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Unit tests for error classes: ErrorCode constants, WallStackError
   base class, 7 subclasses, and the createErrorFromApi factory.

   DEPENDENCIES:
   - vitest
   - ../src/errors.js
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   errors.test.ts
   ├── SUITE: ErrorCode
   ├── SUITE: WallStackError (base)
   ├── SUITE: error subclasses (7)
   │   ├── AuthenticationError (401)
   │   ├── PermissionError     (403)
   │   ├── NotFoundError       (404)
   │   ├── ValidationError     (400)
   │   ├── ConflictError       (409)
   │   ├── RateLimitError      (429)
   │   └── ServerError         (500+)
   └── SUITE: createErrorFromApi factory
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [createErrorFromApi(404, body)]
              │
              ▼
   ┌──────────────────────────────────┐
   │  switch (body.type)              │
   │  "not_found_error" → NotFoundError│
   └──────────────┬───────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────┐
   │  instanceof + statusCode + code  │
   │  assertions                      │
   └──────────────────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial tests for error classes and factory.        |
   ========================================================================== */

import { describe, it, expect } from "vitest";
import {
  ErrorCode,
  WallStackError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  ServerError,
  createErrorFromApi,
} from "../src/errors.js";

/* ==========================================================================
   SUITE: ERROR CODE CONSTANTS
   ========================================================================== */

describe("ErrorCode", () => {
  it("contains auth codes", () => {
    expect(ErrorCode.MISSING_AUTH).toBe("missing_authentication");
    expect(ErrorCode.INVALID_API_KEY).toBe("invalid_api_key");
    expect(ErrorCode.EMAIL_ALREADY_REGISTERED).toBe("email_already_registered");
  });

  it("contains rate limit codes", () => {
    expect(ErrorCode.RATE_LIMITED).toBe("rate_limit_exceeded");
    expect(ErrorCode.MONTHLY_LIMIT_EXCEEDED).toBe("monthly_limit_exceeded");
  });

  it("contains resource codes", () => {
    expect(ErrorCode.RELEASE_NOT_FOUND).toBe("release_not_found");
    expect(ErrorCode.TRACK_NOT_FOUND).toBe("track_not_found");
    expect(ErrorCode.ASSET_NOT_FOUND).toBe("asset_not_available");
  });
});

/* ==========================================================================
   SUITE: WALLSTACK ERROR (BASE)
   ========================================================================== */

describe("WallStackError (base)", () => {
  it("sets message, name, statusCode, type, code", () => {
    const err = new WallStackError("boom", 500, "api_error", "internal_server_error");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WallStackError);
    expect(err.message).toBe("boom");
    expect(err.name).toBe("WallStackError");
    expect(err.statusCode).toBe(500);
    expect(err.type).toBe("api_error");
    expect(err.code).toBe("internal_server_error");
  });

  it("has working prototype chain", () => {
    const err = new WallStackError("x");
    expect(err instanceof WallStackError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

/* ==========================================================================
   SUITE: ERROR SUBCLASSES
   ========================================================================== */

describe("error subclasses", () => {
  it("AuthenticationError is 401 authentication_error", () => {
    const err = new AuthenticationError("no", {
      type: "authentication_error",
      code: "invalid_api_key",
      message: "no",
    });
    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err).toBeInstanceOf(WallStackError);
    expect(err.statusCode).toBe(401);
    expect(err.type).toBe("authentication_error");
    expect(err.code).toBe("invalid_api_key");
  });

  it("PermissionError is 403 permission_error", () => {
    const err = new PermissionError("nope", {
      type: "permission_error",
      code: "release_not_purchased",
      message: "nope",
    });
    expect(err).toBeInstanceOf(PermissionError);
    expect(err.statusCode).toBe(403);
    expect(err.type).toBe("permission_error");
    expect(err.code).toBe("release_not_purchased");
  });

  it("NotFoundError is 404 not_found_error", () => {
    const err = new NotFoundError("gone", {
      type: "not_found_error",
      code: "track_not_found",
      message: "gone",
    });
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
    expect(err.type).toBe("not_found_error");
  });

  it("ValidationError is 400 invalid_request_error", () => {
    const err = new ValidationError("bad", {
      type: "invalid_request_error",
      code: "invalid_param_value",
      message: "bad",
      param: "limit",
    });
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.statusCode).toBe(400);
    expect(err.type).toBe("invalid_request_error");
    expect(err.param).toBe("limit");
  });

  it("ConflictError is 409 conflict_error", () => {
    const err = new ConflictError("dup", {
      type: "conflict_error",
      code: "email_already_registered",
      message: "dup",
    });
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.statusCode).toBe(409);
    expect(err.type).toBe("conflict_error");
  });

  it("RateLimitError is 429 with retryAfter", () => {
    const err = new RateLimitError("slow", 60, {
      type: "rate_limit_error",
      code: "rate_limit_exceeded",
      message: "slow",
      retry_after: 60,
    });
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.statusCode).toBe(429);
    expect(err.type).toBe("rate_limit_error");
    expect(err.retryAfter).toBe(60);
  });

  it("ServerError is 500+ api_error", () => {
    const err = new ServerError("down", 503, {
      type: "api_error",
      code: "internal_server_error",
      message: "down",
    });
    expect(err).toBeInstanceOf(ServerError);
    expect(err.statusCode).toBe(503);
    expect(err.type).toBe("api_error");
  });
});

/* ==========================================================================
   SUITE: createErrorFromApi FACTORY
   ========================================================================== */

describe("createErrorFromApi", () => {
  it("returns AuthenticationError for authentication_error", () => {
    const err = createErrorFromApi(401, {
      type: "authentication_error",
      code: "invalid_api_key",
      message: "x",
    });
    expect(err).toBeInstanceOf(AuthenticationError);
  });

  it("returns PermissionError for permission_error", () => {
    const err = createErrorFromApi(403, {
      type: "permission_error",
      code: "permission_denied",
      message: "x",
    });
    expect(err).toBeInstanceOf(PermissionError);
  });

  it("returns NotFoundError for not_found_error", () => {
    const err = createErrorFromApi(404, {
      type: "not_found_error",
      code: "release_not_found",
      message: "x",
    });
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it("returns ValidationError for invalid_request_error", () => {
    const err = createErrorFromApi(400, {
      type: "invalid_request_error",
      code: "invalid_param_value",
      message: "x",
    });
    expect(err).toBeInstanceOf(ValidationError);
  });

  it("returns ConflictError for conflict_error", () => {
    const err = createErrorFromApi(409, {
      type: "conflict_error",
      code: "email_already_registered",
      message: "x",
    });
    expect(err).toBeInstanceOf(ConflictError);
  });

  it("returns RateLimitError for rate_limit_error", () => {
    const err = createErrorFromApi(429, {
      type: "rate_limit_error",
      code: "rate_limit_exceeded",
      message: "x",
      retry_after: 30,
    });
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfter).toBe(30);
  });

  it("returns ServerError for api_error", () => {
    const err = createErrorFromApi(500, {
      type: "api_error",
      code: "internal_server_error",
      message: "x",
    });
    expect(err).toBeInstanceOf(ServerError);
  });

  it("defaults to ServerError for unknown type", () => {
    const err = createErrorFromApi(502, {
      type: "api_error",
      code: "unknown",
      message: "x",
    });
    expect(err).toBeInstanceOf(ServerError);
    expect(err.statusCode).toBe(502);
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
