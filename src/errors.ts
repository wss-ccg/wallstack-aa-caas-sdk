/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/errors.ts
   VERSION:   0.2.0 (SDK · Stripe-style errors)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   ErrorCode (25+ constants) and error classes for the SDK.
   Aligned with the real API Stripe-style format:
   { error: { type, code, message, param?, doc_url?, request_id?, retry_after? } }

   ARCHITECTURAL ROLE:
   Provides typed error instances to every SDK call, mapped from the
   HTTP status and the Stripe-style error body returned by the API.

   CLASSES:
   • WallStackError      — base
   • AuthenticationError — 401
   • PermissionError     — 403
   • NotFoundError       — 404
   • ValidationError     — 400
   • ConflictError       — 409
   • RateLimitError      — 429 (+ retryAfter)
   • ServerError         — 500+

   DEPENDENCIES:
   - ./types.js (ErrorType, ApiErrorBody)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   errors.ts
   ├── ERROR CODES (25+ constants)
   │   └── ErrorCode as const
   ├── BASE ERROR CLASS
   │   └── WallStackError
   │       └── applyBody() — internal helper
   ├── ERROR SUBCLASSES (7)
   │   ├── AuthenticationError  (401)
   │   ├── PermissionError      (403)
   │   ├── NotFoundError        (404)
   │   ├── ValidationError      (400)
   │   ├── ConflictError        (409)
   │   ├── RateLimitError       (429)
   │   └── ServerError          (500+)
   └── CONSTRUCTOR FROM API
       └── createErrorFromApi() — factory
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM (ERROR HANDLING)
   --------------------------------------------------------------------------

   [HTTP Response with status >= 400]
              │
              ▼
   ┌──────────────────────────────────┐
   │  Parse body → ApiErrorBody       │
   │  { type, code, message, ... }    │
   └──────────────┬───────────────────┘
                  │
                  ▼
   ┌──────────────────────────────────┐
   │  createErrorFromApi(status, body)│
   └──────────────┬───────────────────┘
                  │
        ┌─────────┼─────────┬─────────┐
        ▼         ▼         ▼         ▼
   ┌────────┐┌────────┐┌────────┐┌────────┐
   │ Auth   ││NotFnd  ││Valid   ││RateLmt │
   │ 401    ││404     ││400     ││429     │
   │        ││        ││        ││+retry  │
   └────────┘└────────┘└────────┘└────────┘
        │         │         │         │
        └─────────┴─────────┴─────────┘
                  │
                  ▼
   ┌──────────────────────────────────┐
   │  Throw typed error               │
   │  (subclass of WallStackError)    │
   └──────────────────────────────────┘

   CLASS HIERARCHY:
   Error
     └── WallStackError
           ├── AuthenticationError
           ├── PermissionError
           ├── NotFoundError
           ├── ValidationError
           ├── ConflictError
           ├── RateLimitError
           └── ServerError
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.1.0   | 2026-10-02 | Initial release.                                    |
   |         |            | 8 classes (TimeoutError, NetworkError — fictional). |
   | 0.2.0   | 2026-10-04 | STRIPE-STYLE ERRORS:                                |
   |         |            | • ErrorCode (25+ constants).                        |
   |         |            | • 7 classes (aligned with API types).               |
   |         |            | • WallStackError.applyBody().                       |
   |         |            | • createErrorFromApi() factory.                     |
   |         |            | • Removed TimeoutError, NetworkError.               |
   |         |            | • Added PermissionError, ConflictError.             |
   ========================================================================== */

import type { ErrorType, ApiErrorBody } from "./types.js";

/* ==========================================================================
   ERROR CODES (from API)
   ========================================================================== */

/** API error codes (Stripe-style). */
export const ErrorCode = {
  /* Auth */
  MISSING_AUTH: "missing_authentication",
  INVALID_API_KEY: "invalid_api_key",
  EXPIRED_API_KEY: "expired_api_key",
  INVALID_JWT: "invalid_jwt",
  EXPIRED_JWT: "expired_jwt",
  INVALID_CREDENTIALS: "invalid_credentials",
  EMAIL_ALREADY_REGISTERED: "email_already_registered",
  WEAK_PASSWORD: "weak_password",

  /* Access */
  PERMISSION_DENIED: "permission_denied",
  RELEASE_NOT_PURCHASED: "release_not_purchased",
  RELEASE_UPCOMING: "release_not_yet_available",

  /* Validation */
  INVALID_JSON: "invalid_json_body",
  MISSING_PARAM: "missing_required_param",
  INVALID_PARAM: "invalid_param_value",

  /* Resources */
  RELEASE_NOT_FOUND: "release_not_found",
  TRACK_NOT_FOUND: "track_not_found",
  ASSET_NOT_FOUND: "asset_not_available",
  USER_NOT_FOUND: "user_not_found",
  LICENSE_NOT_FOUND: "license_not_found",

  /* Rate Limits */
  RATE_LIMITED: "rate_limit_exceeded",
  MONTHLY_LIMIT_EXCEEDED: "monthly_limit_exceeded",
  QUOTA_EXCEEDED: "quota_exceeded",

  /* Idempotency */
  IDEMPOTENCY_CONFLICT: "idempotency_key_conflict",

  /* Server */
  INTERNAL_ERROR: "internal_server_error",
} as const;

/** Value type of ErrorCode. */
export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

/* ==========================================================================
   BASE ERROR CLASS
   ========================================================================== */

/**
 * Base class for all SDK errors.
 * All API errors are subclasses of this.
 */
export class WallStackError extends Error {
  public readonly statusCode?: number;
  public readonly type?: ErrorType;
  public readonly code?: string;
  public readonly param?: string;
  public readonly docUrl?: string;
  public readonly requestId?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    type?: ErrorType,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "WallStackError";
    this.statusCode = statusCode;
    this.type = type;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  protected static applyBody(err: WallStackError, body: ApiErrorBody): void {
    (err as { code?: string }).code = body.code;
    (err as { param?: string }).param = body.param;
    (err as { docUrl?: string }).docUrl = body.doc_url;
    (err as { requestId?: string }).requestId = body.request_id;
  }
}

/* ==========================================================================
   ERROR SUBCLASSES
   ========================================================================== */

/** 401 — authentication failed. */
export class AuthenticationError extends WallStackError {
  constructor(message = "Authentication required", body?: ApiErrorBody) {
    super(message, 401, "authentication_error", body?.code);
    this.name = "AuthenticationError";
    if (body) WallStackError.applyBody(this, body);
  }
}

/** 403 — permission denied. */
export class PermissionError extends WallStackError {
  constructor(message = "Permission denied", body?: ApiErrorBody) {
    super(message, 403, "permission_error", body?.code);
    this.name = "PermissionError";
    if (body) WallStackError.applyBody(this, body);
  }
}

/** 404 — not found. */
export class NotFoundError extends WallStackError {
  constructor(message = "Resource not found", body?: ApiErrorBody) {
    super(message, 404, "not_found_error", body?.code);
    this.name = "NotFoundError";
    if (body) WallStackError.applyBody(this, body);
  }
}

/** 400 — validation error. */
export class ValidationError extends WallStackError {
  constructor(message = "Invalid request", body?: ApiErrorBody) {
    super(message, 400, "invalid_request_error", body?.code);
    this.name = "ValidationError";
    if (body) WallStackError.applyBody(this, body);
  }
}

/** 409 — conflict. */
export class ConflictError extends WallStackError {
  constructor(message = "Conflict", body?: ApiErrorBody) {
    super(message, 409, "conflict_error", body?.code);
    this.name = "ConflictError";
    if (body) WallStackError.applyBody(this, body);
  }
}

/** 429 — rate limit exceeded. */
export class RateLimitError extends WallStackError {
  public readonly retryAfter?: number;

  constructor(
    message = "Rate limit exceeded",
    retryAfter?: number,
    body?: ApiErrorBody
  ) {
    super(message, 429, "rate_limit_error", body?.code);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter ?? body?.retry_after;
    if (body) WallStackError.applyBody(this, body);
  }
}

/** 5xx — server error. */
export class ServerError extends WallStackError {
  constructor(
    message = "Internal server error",
    statusCode = 500,
    body?: ApiErrorBody
  ) {
    super(message, statusCode, "api_error", body?.code);
    this.name = "ServerError";
    if (body) WallStackError.applyBody(this, body);
  }
}

/* ==========================================================================
   CONSTRUCTOR FROM API RESPONSE
   ========================================================================== */

/**
 * Builds the appropriate error class from an API response.
 *
 * @param statusCode — HTTP status
 * @param body — ApiErrorBody ({ type, code, message, ... })
 * @returns Instance of the corresponding error class
 */
export function createErrorFromApi(
  statusCode: number,
  body: ApiErrorBody
): WallStackError {
  switch (body.type) {
    case "authentication_error":
      return new AuthenticationError(body.message, body);
    case "permission_error":
      return new PermissionError(body.message, body);
    case "not_found_error":
      return new NotFoundError(body.message, body);
    case "invalid_request_error":
      return new ValidationError(body.message, body);
    case "conflict_error":
      return new ConflictError(body.message, body);
    case "rate_limit_error":
      return new RateLimitError(body.message, body.retry_after, body);
    case "api_error":
    default:
      return new ServerError(body.message, statusCode, body);
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
