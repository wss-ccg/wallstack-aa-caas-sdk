/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      examples/basic-usage.ts
   VERSION:   1.1.0 (SDK · Basic usage example)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   End-to-end example of the WallStack SDK covering all 6 sub-clients:
   health, releases, tracks, auth, user, dashboard.
   Demonstrates public, Bearer, and Cookie authenticated calls.

   RUN:
     npx tsx examples/basic-usage.ts
     (or) WALLSTACK_API_KEY=ws_live_... npx tsx examples/basic-usage.ts

   DEPENDENCIES:
   - ../src/index.js
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   basic-usage.ts
   ├── IMPORTS
   │   ├── WallStackClient
   │   ├── NotFoundError
   │   └── RateLimitError
   └── FUNCTION main()
       ├── 1. Health check                    (public)
       ├── 2. List releases                   (public)
       ├── 3. Get release detail              (public)
       ├── 4. Download track (Bearer)         → tracks.download
       ├── 5. User usage + subscription       (Bearer)
       ├── 6. Register + login (Cookie)       → auth.register/login
       └── 7. Dashboard download (Cookie)     + Idempotency-Key
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM
   --------------------------------------------------------------------------

   [START]
      │
      ▼
   ┌──────────────────────────────┐
   │  new WallStackClient(...)    │
   │  • apiKey?                   │
   │  • jwtCookie?                │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  PUBLIC                      │
   │  • health.check()            │
   │  • releases.list()           │
   │  • releases.get(slug)        │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  BEARER AUTH                 │
   │  • tracks.download(...)      │
   │  • user.usage()              │
   │  • user.subscription()       │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │  COOKIE AUTH                 │
   │  • auth.register()           │
   │  • auth.login()              │
   │  • auth.me()                 │
   │  • auth.createToken()        │
   │  • dashboard.download(...)   │
   └──────────────┬───────────────┘
                  │
                  ▼
              [DONE]
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.1.0   | 2026-10-02 | Initial example (datasets, tracks, licenses).       |
   |         |            | Fictional API.                                      |
   | 0.2.0   | 2026-10-04 | FULL REWRITE aligned with real OpenAPI v1.0.2:      |
   |         |            | • 6 sub-clients (health, releases, tracks, auth,    |
   |         |            |   user, dashboard).                                 |
   |         |            | • Public, Bearer, and Cookie examples.              |
   |         |            | • Idempotency-Key usage.                            |
   |         |            | • Removed: datasets.*, licenses.*.                  |
   | 1.0.0   | 2026-11-16 | SDK 1.0.0: Naming System 2.0 + Dataset Centric 2.0. |
   ========================================================================== */

import {
  WallStackClient,
  WallStackError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from "../src/index.js";

// NOTE: The demo release (wss-ccg-vol-1) has only FULL_MIX.
// For STEM_* / DI_* — a paid release is required.

/* ==========================================================================
   MAIN
   ========================================================================== */

async function main(): Promise<void> {
  const client = new WallStackClient({
    apiKey: process.env.WALLSTACK_API_KEY,
    jwtCookie: process.env.WALLSTACK_JWT_COOKIE,
    baseUrl: "https://wallstackaudio.com/api/v2",
    timeout: 30_000,
    maxRetries: 3,
  });

  console.log("✅ WallStack client initialized");

  try {
    /* ─── 1. PUBLIC: HEALTH CHECK ─────────────────────────────────── */
    const health = await client.health.check();
    console.log(`\n🩺 Health: ${health.status} (v${health.version})`);

    /* ─── 2. PUBLIC: LIST RELEASES ────────────────────────────────── */
    const list = await client.releases.list({ status: "available", limit: 10 });
    console.log(`\n📦 Releases: ${list.total} (showing ${list.releases.length})`);
    for (const release of list.releases) {
      console.log(
        `  - ${release.slug}: ${release.title} (${release.track_count} tracks)`
      );
    }

    /* ─── 3. PUBLIC: GET RELEASE DETAIL ───────────────────────────── */
    const firstRelease = list.releases[0];
    if (firstRelease) {
      const detail = await client.releases.get(firstRelease.slug);
      console.log(
        `\n📀 ${detail.title} — ${detail.tracks.length} tracks, ${detail.bpm} BPM in ${detail.key}`
      );

      /* ─── 4. BEARER: DOWNLOAD TRACK ─────────────────────────────── */
      const firstTrack = detail.tracks[0];
      if (firstTrack && client["http"]) {
        // only if apiKey is set
        if (process.env.WALLSTACK_API_KEY) {
          try {
            // Demo has only FULL_MIX. Replace with STEM_* / DI_* for paid releases.
            const dl = await client.tracks.download(
              firstTrack.slug,
              "FULL_MIX"
            );
            console.log(`\n⬇️  Download URL: ${dl.download_url}`);
            console.log(`   License: ${dl.license_id}`);
            console.log(`   Expires in: ${dl.expires_in}s`);
          } catch (err) {
            if (err instanceof AuthenticationError) {
              console.log("\n⚠️  Set WALLSTACK_API_KEY to download assets.");
            } else {
              throw err;
            }
          }
        }
      }
    }

    /* ─── 5. BEARER: USER USAGE / SUBSCRIPTION ────────────────────── */
    if (process.env.WALLSTACK_API_KEY) {
      const usage = await client.user.usage();
      console.log(
        `\n📊 Usage: ${usage.requests.total} / ${usage.requests.limit} requests`
      );

      const sub = await client.user.subscription();
      console.log(`💎 Tier: ${sub.tier} (active: ${sub.isActive})`);
    }

    /* ─── 6. COOKIE: REGISTER + LOGIN + ME ────────────────────────── */
    if (process.env.WALLSTACK_DEMO_EMAIL && process.env.WALLSTACK_DEMO_PASSWORD) {
      const email = process.env.WALLSTACK_DEMO_EMAIL;
      const password = process.env.WALLSTACK_DEMO_PASSWORD;

      const me = await client.auth.login({ email, password });
      console.log(`\n👤 Logged in as: ${me.email} (${me.role})`);

      const current = await client.auth.me();
      console.log(`   Workspace: ${current.workspace.name}`);
    }

    /* ─── 7. COOKIE + IDEMPOTENCY: DASHBOARD DOWNLOAD ─────────────── */
    if (process.env.WALLSTACK_JWT_COOKIE && firstRelease) {
      const detail = await client.releases.get(firstRelease.slug);
      const firstTrack = detail.tracks[0];
      if (firstTrack) {
        const dl = await client.dashboard.download(
          { trackSlug: firstTrack.slug, assetType: "FULL_MIX" },
          "example-idem-key-001"
        );
        console.log(`\n🖥️  Dashboard download: ${dl.download_url}`);
        console.log(`   License: ${dl.license_id}, TTL: ${dl.expires_in}s`);
      }
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      console.error("❌ Not found:", err.message);
    } else if (err instanceof RateLimitError) {
      console.error("❌ Rate limited. Retry after:", err.retryAfter, "s");
    } else if (err instanceof AuthenticationError) {
      console.error("❌ Auth error:", err.message);
    } else if (err instanceof WallStackError) {
      console.error("❌ WallStack error:", err.message, err.code);
    } else {
      console.error("❌ Unexpected error:", err);
    }
    process.exit(1);
  }
}

/* ==========================================================================
   ENTRYPOINT
   ========================================================================== */

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
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
