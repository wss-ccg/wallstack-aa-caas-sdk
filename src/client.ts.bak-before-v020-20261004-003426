/**
 * WallStack AA-CaaS™ SDK — Main HTTP client
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk/client
 */

import {
  AuthenticationError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
  ValidationError,
  WallStackError,
} from "./errors.js";
import type { WallStackClientOptions } from "./types.js";

const DEFAULT_BASE_URL = "https://wallstackaudio.com/api/v2";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

export class HttpClient {
  public readonly apiKey: string;
  public readonly baseUrl: string;
  public readonly timeout: number;
  public readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: WallStackClientOptions) {
    if (!options.apiKey) {
      throw new AuthenticationError("Missing required option: apiKey");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchImpl = options.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new NetworkError(
        "No fetch implementation available. Pass fetch in options or use Node.js >= 18."
      );
    }
  }

  public async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = this.baseUrl + path;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(method, url, body);
      } catch (err) {
        lastError = err;

        const isRetryable =
          err instanceof RateLimitError ||
          err instanceof ServerError ||
          err instanceof TimeoutError ||
          err instanceof NetworkError;

        if (!isRetryable || attempt === this.maxRetries) {
          throw err;
        }

        const delay = 200 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError instanceof Error ? lastError : new WallStackError("Unknown error");
  }

  private async executeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    url: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + this.apiKey,
          "User-Agent": "@wallstack-aa-caas/sdk",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof WallStackError) {
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new TimeoutError("Request timed out after " + this.timeout + "ms");
      }

      throw new NetworkError(err instanceof Error ? err.message : "Network error", err);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text().catch(() => undefined);
    }

    let message = "HTTP " + response.status;
    if (typeof details === "object" && details !== null && "message" in details) {
      message = String((details as { message: unknown }).message);
    }

    switch (response.status) {
      case 400:
        throw new ValidationError(message, details);
      case 401:
      case 403:
        throw new AuthenticationError(message, details);
      case 404:
        throw new NotFoundError(message, details);
      case 429: {
        const retryAfter = Number(response.headers.get("Retry-After")) || undefined;
        throw new RateLimitError(message, retryAfter, details);
      }
      default:
        if (response.status >= 500) {
          throw new ServerError(message, response.status, details);
        }
        throw new WallStackError(message, response.status, "unknown_error", details);
    }
  }
}
