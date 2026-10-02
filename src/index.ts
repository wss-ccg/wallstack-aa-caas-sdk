/**
 * WallStack AA-CaaS™ SDK
 *
 * Official TypeScript SDK for the WallStack AA-CaaS™ REST v2 API.
 * Provides type-safe access to datasets, tracks, and licenses
 * for AI training, neural amp modeling, and analog guitar tone capture.
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk
 * @version 0.1.0
 * @author Andrey S. Yarovenko
 * @license MIT
 *
 * @example
 * \`\`\`typescript
 * import { WallStackClient } from "@wallstack-aa-caas/sdk";
 *
 * const client = new WallStackClient({
 * });
 *
 * const dataset = await client.datasets.get("ds_abc123");
 * console.log(dataset.name, dataset.trackCount);
 * \`\`\`
 */

import { HttpClient } from "./client.js";
import { DatasetsClient } from "./endpoints/datasets.js";
import { LicensesClient } from "./endpoints/licenses.js";
import { TracksClient } from "./endpoints/tracks.js";
import type { WallStackClientOptions } from "./types.js";

/** SDK version. */
export const VERSION = "0.1.0";

/** SDK package name. */
export const SDK_NAME = "@wallstack-aa-caas/sdk";

/**
 * Main entry point for the WallStack AA-CaaS™ SDK.
 *
 * @example
 * \`\`\`typescript
 * const client = new WallStackClient({ apiKey: "..." });
 *
 * // Datasets
 * const dataset = await client.datasets.get("ds_abc123");
 * const all = await client.datasets.list({ limit: 20 });
 *
 * // Tracks
 * const track = await client.tracks.get("trk_xyz");
 * const url = await client.tracks.download("trk_xyz", "wav", "di");
 *
 * // Licenses
 * const license = await client.licenses.create({
 *   datasetId: "ds_abc123",
 *   type: "ai-training",
 *   company: "Example AI Corp",
 * });
 * \`\`\`
 */
export class WallStackClient {
  /** Datasets API. */
  public readonly datasets: DatasetsClient;

  /** Tracks API. */
  public readonly tracks: TracksClient;

  /** Licenses API. */
  public readonly licenses: LicensesClient;

  /**
   * Creates a new WallStack client.
   *
   * @param options - Client configuration.
   * @throws {AuthenticationError} When \`apiKey\` is missing.
   */
  constructor(options: WallStackClientOptions) {
    const http = new HttpClient(options);
    this.datasets = new DatasetsClient(http);
    this.tracks = new TracksClient(http);
    this.licenses = new LicensesClient(http);
  }
}

// ─────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────

// Error classes
export {
  WallStackError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  TimeoutError,
  NetworkError,
} from "./errors.js";

// Types
export type {
  WallStackClientOptions,
  Dataset,
  Track,
  License,
  LicenseType,
  CreateLicenseParams,
  PaginatedResponse,
  ListParams,
} from "./types.js";

// Sub-clients
export { DatasetsClient } from "./endpoints/datasets.js";
export { TracksClient } from "./endpoints/tracks.js";
export { LicensesClient } from "./endpoints/licenses.js";
export type { TrackFormat } from "./endpoints/tracks.js";
