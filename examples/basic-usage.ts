/**
 * WallStack AA-CaaS™ SDK — Basic usage example
 *
 * Run with: npx tsx examples/basic-usage.ts
 */

import {
  WallStackClient,
  NotFoundError,
  RateLimitError,
  AuthenticationError,
  WallStackError,
} from "../src/index.js";

async function main(): Promise<void> {
  // 1. Initialize client
  const client = new WallStackClient({
    apiKey: process.env.WALLSTACK_API_KEY ?? "wsk_demo_key_replace_me",
    baseUrl: "https://wallstackaudio.com/api/v2",
    timeout: 30_000,
    maxRetries: 3,
  });

  console.log("✅ WallStack client initialized");

  try {
    // 2. List datasets
    const page = await client.datasets.list({ limit: 5 });
    console.log(`📦 Found ${page.total} datasets (showing ${page.data.length})`);

    for (const ds of page.data) {
      console.log(`  - ${ds.id}: ${ds.name} (${ds.trackCount} tracks)`);
    }

    // 3. Fetch a specific dataset
    if (page.data.length > 0) {
      const first = page.data[0];
      if (first) {
        const dataset = await client.datasets.get(first.id);
        console.log(`\n📀 Dataset: ${dataset.name}`);
        console.log(`   Sample rate: ${dataset.sampleRate} Hz`);
        console.log(`   Bit depth: ${dataset.bitDepth}-bit`);

        // 4. List tracks in dataset
        const tracks = await client.datasets.tracks(dataset.id, { limit: 10 });
        console.log(`\n🎸 Tracks: ${tracks.total}`);

        for (const track of tracks.data.slice(0, 3)) {
          console.log(`  - ${track.name} [${track.instrument}]`);
          console.log(`    Signal chain: ${track.signalChain}`);
        }

        // 5. Get download URL for a track
        if (tracks.data.length > 0) {
          const track = tracks.data[0];
          if (track) {
            const url = await client.tracks.download(track.id, "wav", "di");
            console.log(`\n⬇️  DI download URL: ${url}`);
          }
        }
      }
    }

    // 6. Create an AI-training license
    if (page.data.length > 0) {
      const first = page.data[0];
      if (first) {
        const license = await client.licenses.create({
          datasetId: first.id,
          type: "ai-training",
          company: "Example AI Corp",
          email: "contact@example.com",
        });
        console.log(`\n🔑 License created: ${license.key}`);
        console.log(`   Type: ${license.type}`);
        console.log(`   Expires: ${license.expiresAt ?? "never"}`);

        // 7. Validate license
        const valid = await client.licenses.validate(license.key);
        console.log(`   Valid: ${valid ? "✅ yes" : "❌ no"}`);
      }
    }
  } catch (err) {
    // 8. Error handling
    if (err instanceof AuthenticationError) {
      console.error("❌ Auth failed — check your API key");
    } else if (err instanceof NotFoundError) {
      console.error("❌ Resource not found:", err.message);
    } else if (err instanceof RateLimitError) {
      console.error(`❌ Rate limited — retry after ${err.retryAfter ?? "?"}s`);
    } else if (err instanceof WallStackError) {
      console.error(`❌ WallStack error [${err.code}]:`, err.message);
    } else {
      console.error("❌ Unknown error:", err);
    }
    process.exit(1);
  }

  console.log("\n✅ Example completed successfully");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
