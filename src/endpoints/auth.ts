/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/endpoints/auth.ts
   VERSION:   0.2.0 (SDK · Auth endpoints)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Client for the /auth endpoints of the WallStack REST v2 API.
   Handles registration, login (JWT cookie), logout, current user,
   API key creation, and API key rotation.

   ARCHITECTURAL ROLE:
   AuthClient wraps 6 endpoints: register, login, logout, me, token,
   refresh. Some use Bearer auth (refresh), some use Cookie auth
   (logout, me, token), some are public (register, login).

   DEPENDENCIES:
   - ../client.js (HttpClient)
   - ../types.js (User, ApiKey, RegisterRequest, LoginRequest, TokenRequest)
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   auth.ts
   ├── CLASS AuthClient
   │   ├── register(params)          → POST /auth/register        (public)
   │   ├── login(params)             → POST /auth/login           (public)
   │   ├── logout()                  → POST /auth/logout          (cookie)
   │   ├── me()                      → GET  /auth/me              (cookie)
   │   ├── createToken(params?)      → POST /auth/token           (cookie + idem)
   │   └── refreshToken(idemKey?)    → POST /auth/refresh         (bearer + idem)
   └── EXPORTS: AuthClient
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   PUBLIC:
   register(email, pwd) ──► login(email, pwd) ──► [JWT cookie set]

   AUTHENTICATED (cookie):
   logout()  ──► POST /auth/logout     (clears ws_session cookie)
   me()      ──► GET  /auth/me         (returns current User)
   createToken() ──► POST /auth/token  (creates API key, idempotent)

   AUTHENTICATED (bearer):
   refreshToken() ──► POST /auth/refresh (rotates API key, idempotent)
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.2.0   | 2026-10-04 | Initial AuthClient (new file).                      |
   |         |            | • register()  → POST /auth/register (public).       |
   |         |            | • login()     → POST /auth/login (public).          |
   |         |            | • logout()    → POST /auth/logout (cookie).         |
   |         |            | • me()        → GET  /auth/me (cookie).             |
   |         |            | • createToken() → POST /auth/token (cookie+idem).   |
   |         |            | • refreshToken() → POST /auth/refresh (bearer+idem).|
   ========================================================================== */

import type { HttpClient } from "../client.js";
import type {
  ApiKey,
  LoginRequest,
  RegisterRequest,
  TokenRequest,
  User,
} from "../types.js";

/* ==========================================================================
   AUTH CLIENT
   ========================================================================== */

/**
 * Client for the /auth endpoints.
 *
 * @example
 * ```typescript
 * // Register + login
 * const user = await client.auth.register({
 *   email: "you@example.com",
 *   password: "s3cret-min-8",
 *   fullName: "Your Name",
 * });
 * const me = await client.auth.login({
 *   email: "you@example.com",
 *   password: "s3cret-min-8",
 * });
 *
 * // Create an API key (requires cookie auth)
 * const key = await client.auth.createToken({ name: "production" });
 * console.log(key.rawKey); // shown ONCE
 *
 * // Rotate an API key (requires Bearer auth)
 * const next = await client.auth.refreshToken();
 * ```
 */
export class AuthClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Registers a new user.
   *
   * @param params — Email, password (min 8), optional fullName and company.
   * @returns The created user.
   * @throws {ValidationError} On weak password or invalid email.
   * @throws {ConflictError} When email is already registered.
   */
  public async register(params: RegisterRequest): Promise<User> {
    return this.http.request<User>("POST", "/auth/register", {
      body: params,
      auth: "none",
    });
  }

  /**
   * Logs in and sets the JWT cookie (ws_session) on the client.
   *
   * @param params — Email and password.
   * @returns The authenticated user.
   * @throws {AuthenticationError} On invalid credentials.
   */
  public async login(params: LoginRequest): Promise<User> {
    return this.http.request<User>("POST", "/auth/login", {
      body: params,
      auth: "none",
    });
  }

  /**
   * Logs out the current user (clears the JWT cookie).
   *
   * @returns void
   */
  public async logout(): Promise<void> {
    return this.http.request<void>("POST", "/auth/logout", {
      auth: "cookie",
    });
  }

  /**
   * Returns the current user (requires JWT cookie).
   *
   * @returns The current user.
   * @throws {AuthenticationError} When the JWT is missing or expired.
   */
  public async me(): Promise<User> {
    return this.http.request<User>("GET", "/auth/me", { auth: "cookie" });
  }

  /**
   * Creates a new API key for the current user (requires JWT cookie).
   * Idempotent: pass the same idempotencyKey to replay the original result.
   *
   * @param params — Optional name and sandbox flag.
   * @param idempotencyKey — Optional idempotency key (24h TTL).
   * @returns The created API key (rawKey shown ONCE).
   */
  public async createToken(
    params: TokenRequest = {},
    idempotencyKey?: string
  ): Promise<ApiKey> {
    return this.http.request<ApiKey>("POST", "/auth/token", {
      body: params,
      auth: "cookie",
      idempotencyKey,
    });
  }

  /**
   * Rotates the current API key (requires Bearer auth).
   * Idempotent: pass the same idempotencyKey to replay the original result.
   *
   * @param idempotencyKey — Optional idempotency key (24h TTL).
   * @returns The new API key (rawKey shown ONCE).
   */
  public async refreshToken(idempotencyKey?: string): Promise<ApiKey> {
    return this.http.request<ApiKey>("POST", "/auth/refresh", {
      auth: "bearer",
      idempotencyKey,
    });
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
