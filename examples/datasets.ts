/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      examples/datasets.ts
   VERSION:   1.0.0 (Example · Dataset Centric 2.0)
   DATE:      2026-11-16
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   Example: how to use the SDK for Dataset Centric 2.0 (AI Training).
   Shows chain-state, dataset request, and JSON manifest download.

   RUN:
     tsx examples/datasets.ts
   ========================================================================== */

import { WallStackClient } from "../src/index.js";

async function main() {
  const client = new WallStackClient({
    apiKey: process.env.WALLSTACK_API_KEY,
  });

  // 1. Public — form options (channels, presets, parts)
  console.log("Fetching chain state...");
  const state = await client.datasets.chainState();
  console.log(`Channels: ${state.data.channels.length}`);
  console.log(`Presets: ${state.data.presets.length}`);
  console.log(`Parts: ${state.data.parts.join(", ")}`);

  // 2. Public — submit dataset request (with registration)
  console.log("\nSubmitting dataset request...");
  const result = await client.datasets.request({
    datasetName: "My Custom Dataset",
    tracks: [
      {
        name: "Volume_1",
        key: "Dm",
        bpm: 120,
        harmony: "Dm-Bb-C-Gm",
        items: [
          { part: "RHYTHM", presetId: "liquid-violin", preampOutput: "MAIN_L" },
        ],
      },
    ],
    email: "user@example.com",
    password: "secure-password",
  });
  console.log(`Inquiry ID: ${result.data.inquiryId}`);
  console.log(`isDemo: ${result.data.isDemo}`);
  if (result.data.licenseId) {
    console.log(`License: ${result.data.licenseId}`);
  }

  // 3. Bearer — download Dataset Centric 2.0 manifest (JSON)
  // (requires apiKey + existing dataset)
  if (client) {
    console.log("\nFetching Dataset Centric 2.0 manifest...");
    try {
      const manifest = await client.datasets.manifest("wss-ccg-ds-NNNN");
      console.log(`Standard: ${manifest.dataset.standardVersion}`);
      console.log(`Tracks: ${manifest.tracks.length}`);
      console.log(`License: ${manifest.license.type}`);
      console.log(`Content ID cleared: ${manifest.contentIdCleared}`);
    } catch (err) {
      console.log(`(manifest skipped: dataset not found — expected in demo)`);
    }
  }

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
