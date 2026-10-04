/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/client.ts
   VERSION:   0.2.0 (SDK · HttpClient with dual auth + idempotency)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Core HTTP client for the WallStack REST v2 API.
   Handles:
   • Dual authentication (Bearer API key + JWT cookie).
   • Response unwrapping: every API response is { data, meta }.
   • Stripe-style error handling (7 types).
   • Idempotency-Key header on supported endpoints.
   • Retry with exponential backoff on 429/5xx.
   • Request timeout via AbortController.

   ARCHITECTURAL ROLE:
   Single transport layer used by all endpoint clients. Knows nothing
   about domain logic — only HTTP, auth, retries, error mapping.

   DEPENDENCIES:
   - ./errors.js (WallStackError + createErrorFromApi)
   - ./types.js (ApiResponse, ApiErrorResponse, WallStackClientOptions)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   client.ts
   ├── CONSTANTS (DEFAULT_BASE_URL, DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES)
   ├── CLASS HttpClient
   │   ├── apiKey?: string
   │   ├── jwtCookie?: string
   │   ├── setApiKey(key)
   │   ├── setJwtCookie(cookie)
   │   ├── request<T>(method, path, opts?)
   │   ├── private executeRequest()
   │   ├── private handleErrorResponse()
   │   └── private buildHeaders()
   └── EXPORTS: HttpClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM (REQUEST LIFECYCLE)
   --------------------------------------------------------------------------

   [client.releases.list()]
              │
              ▼
   ┌──────────────────────────────┐
   │  HttpClient.request()        │
   │  (method, path, opts)        │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  Retry loop (max 3 attempts) │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  executeRequest()            │
   │  • buildHeaders()            │
   │  • AbortController (timeout) │
   │  • fetch()                   │
   └──────────────┬───────────────┘
                  │
        ┌─────────┴─────────┐
        │ ok?               │ !ok
        ▼                   ▼
   ┌─────────┐      ┌───────────────────┐
   │ 204?    │      │ handleError()     │
   │ → void  │      │ → createError     │
   │         │      │   FromApi         │
   │ 200?    │      └────────┬──────────┘
   │ → {data}│               │
   └────┬────┘               │
        │                    │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ retryable? (429/5xx)│
        │  → backoff + retry  │
        │  else → throw       │
        └────────────────────┘
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.1.0   | 2026-10-02 | Initial release. Bearer only. No { data, meta }.    |
   | 0.2.0   | 2026-10-04 | FULL REWRITE:                                       |
   |         |            | • Dual auth (apiKey + jwtCookie).                   |
   |         |            | • Response unwrapping: { data, meta } → data.       |
   |         |            | • Stripe-style errors via createErrorFromApi().     |
   |         |            | • Idempotency-Key header support.                   |
   |         |            | • Retry on 429/5xx with exponential backoff.        |
   |         |            | • Request timeout via AbortController.              |
   |         |            | • Removed: NetworkError, TimeoutError (not in API). |
   ========================================================================== */

import {
  WallStackError,
  createErrorFromApi,
} from "./errors.js";
import type {
  ApiResponse,
  ApiErrorResponse,
  WallStackClientOptions,
} from "./types.js";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const DEFAULT_BASE_URL = "https://wallstackaudio.com/api/v2";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const SDK_VERSION = "0.2.0";

/* ==========================================================================
   REQUEST OPTIONS
   ========================================================================== */

/** Auth mode for the request. */
export type AuthMode = "bearer" | "cookie" | "none";

/** Options for a single request. */
export interface RequestOptions {
  /** JSON body. */
  body?: unknown;
  /** Idempotency-Key header. */
  idempotencyKey?: string;
  /** Auth mode. Default: "bearer" if apiKey set, else "none". */
  auth?: AuthMode;
}

/* ==========================================================================
   HTTP CLIENT
   ========================================================================== */

/**
 * Core HTTP client.
 *
 * Handles dual auth, response unwrapping, error mapping, retries.
 * Used internally by all endpoint clients.
 */
export class HttpClient {
  public apiKey?: string;
  public jwtCookie?: string;
  public readonly baseUrl: string;
  public readonly timeout: number;
  public readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WallStackClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.jwtCookie = options.jwtCookie;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchImpl = options.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new WallStackError(
        "No fetch implementation available. Use Node.js >= 18 or pass fetch."
      );
    }
  }

  /** Set / replace API key (Bearer auth). */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /** Set / replace JWT cookie (Cookie auth). */
  setJwtCookie(cookie: string): void {
    this.jwtCookie = cookie;
  }

  /**
   * Performs an HTTP request and returns the unwrapped `data` payload.
   *
   * @param method — HTTP method
   * @param path — Path relative to baseUrl (e.g. "/releases")
   * @param options — Request options (body, idempotency, auth)
   * @returns Unwrapped `data` from { data, meta }
   */
  public async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.baseUrl + path;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(method, url, options);
      } catch (err) {
        lastError = err;

        const retryable =
          err instanceof WallStackError &&
          err.statusCode !== undefined &&
          (err.statusCode === 429 || err.statusCode >= 500);

        if (!retryable || attempt === this.maxRetries) {
          throw err;
        }

        const delay = 200 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new WallStackError("Unknown error");
  }

  /* ------------------------------------------------------------------------
     PRIVATE
     ------------------------------------------------------------------------ */

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "@wallstack-aa-caas/sdk/" + SDK_VERSION,
    };

    const auth = options.auth ?? (this.apiKey ? "bearer" : "none");

    if (auth === "bearer" && this.apiKey) {
      headers["Authorization"] = "Bearer " + this.apiKey;
    } else if (auth === "cookie" && this.jwtCookie) {
      headers["Cookie"] = "ws_session=" + this.jwtCookie;
    }

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    return headers;
  }

  private async executeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    options: RequestOptions
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers: this.buildHeaders(options),
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const json = (await response.json()) as ApiResponse<T> | T;

      if (
        json !== null &&
        typeof json === "object" &&
        "data" in json &&
        "meta" in json
      ) {
        return (json as ApiResponse<T>).data;
      }

      return json as T;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof WallStackError) throw err;

      if (err instanceof Error && err.name === "AbortError") {
        throw new WallStackError(
          "Request timed out after " + this.timeout + "ms"
        );
      }

      throw new WallStackError(
        err instanceof Error ? err.message : "Network error"
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => undefined);
    }

    if (
      body !== null &&
      typeof body === "object" &&
      "error" in body &&
      (body as ApiErrorResponse).error &&
      typeof (body as ApiErrorResponse).error === "object"
    ) {
      const apiError = (body as ApiErrorResponse).error;
      throw createErrorFromApi(response.status, apiError);
    }

    throw new WallStackError(
      "HTTP " + response.status,
      response.status,
      "api_error",
      "unknown_error",
      body
    );
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
