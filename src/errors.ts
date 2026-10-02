/**
 * WallStack AA-CaaS™ SDK — Error classes
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk/errors
 */

export class WallStackError extends Error {
  public readonly statusCode?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "WallStackError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends WallStackError {
  constructor(message = "Invalid or missing API key", details?: unknown) {
    super(message, 401, "authentication_error", details);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends WallStackError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, "not_found", details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends WallStackError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "validation_error", details);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends WallStackError {
  public readonly retryAfter?: number;

  constructor(message = "Rate limit exceeded", retryAfter?: number, details?: unknown) {
    super(message, 429, "rate_limit_exceeded", details);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends WallStackError {
  constructor(message = "Internal server error", statusCode = 500, details?: unknown) {
    super(message, statusCode, "server_error", details);
    this.name = "ServerError";
  }
}

export class TimeoutError extends WallStackError {
  constructor(message = "Request timed out", details?: unknown) {
    super(message, undefined, "timeout", details);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends WallStackError {
  constructor(message = "Network error", details?: unknown) {
    super(message, undefined, "network_error", details);
    this.name = "NetworkError";
  }
}
