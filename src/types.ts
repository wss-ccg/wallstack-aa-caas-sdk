/**
 * WallStack AA-CaaS™ SDK — Type definitions
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk/types
 */

// ─────────────────────────────────────────────────────────────
// Client Configuration
// ─────────────────────────────────────────────────────────────

/**
 * Configuration options for the WallStack client.
 */
export interface WallStackClientOptions {
  /** WallStack API key (required). */
  apiKey: string;

  /** API base URL. Default: "https://wallstackaudio.com/api/v2". */
  baseUrl?: string;

  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;

  /** Maximum number of retries on failure. Default: 3. */
  maxRetries?: number;

  /** Custom fetch implementation (for edge runtimes / testing). */
  fetch?: typeof fetch;
}

// ─────────────────────────────────────────────────────────────
// Datasets
// ─────────────────────────────────────────────────────────────

/**
 * A WallStack dataset — a collection of paired DI + Wet audio tracks.
 */
export interface Dataset {
  /** Unique dataset ID (e.g. "ds_abc123"). */
  id: string;

  /** Human-readable dataset name. */
  name: string;

  /** Dataset description. */
  description?: string;

  /** Total number of tracks in the dataset. */
  trackCount: number;

  /** Total size in bytes. */
  sizeBytes: number;

  /** Sample rate in Hz (e.g. 48000). */
  sampleRate: number;

  /** Bit depth (e.g. 24). */
  bitDepth: number;

  /** Licensing tier for this dataset. */
  license: LicenseType;

  /** ISO 8601 creation timestamp. */
  createdAt: string;

  /** ISO 8601 last update timestamp. */
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Tracks
// ─────────────────────────────────────────────────────────────

/**
 * A single track — one DI signal + one Wet (reamped) signal.
 */
export interface Track {
  /** Unique track ID. */
  id: string;

  /** Parent dataset ID. */
  datasetId: string;

  /** Track name. */
  name: string;

  /** Duration in seconds. */
  duration: number;

  /** Instrument type (guitar, bass, synth, etc.). */
  instrument: string;

  /** Amp / signal chain description. */
  signalChain: string;

  /** DI file URL (dry signal). */
  diUrl: string;

  /** Wet file URL (reamped signal). */
  wetUrl: string;

  /** Sample rate in Hz. */
  sampleRate: number;

  /** Bit depth. */
  bitDepth: number;

  /** ISO 8601 creation timestamp. */
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Licenses
// ─────────────────────────────────────────────────────────────

/**
 * License type — determines usage rights.
 */
export type LicenseType =
  | "personal"
  | "commercial"
  | "ai-training"
  | "enterprise"
  | "custom";

/**
 * A license key granting usage rights to a dataset.
 */
export interface License {
  /** Unique license key. */
  key: string;

  /** Dataset ID this license applies to. */
  datasetId: string;

  /** License type. */
  type: LicenseType;

  /** Company / licensee name. */
  company: string;

  /** Contact email. */
  email?: string;

  /** ISO 8601 issue timestamp. */
  issuedAt: string;

  /** ISO 8601 expiration timestamp (null = perpetual). */
  expiresAt: string | null;

  /** Whether the license is currently active. */
  active: boolean;
}

/**
 * Parameters for creating a new license.
 */
export interface CreateLicenseParams {
  datasetId: string;
  type: LicenseType;
  company: string;
  email?: string;
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

/**
 * Generic paginated response.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * List parameters for paginated endpoints.
 */
export interface ListParams {
  limit?: number;
  offset?: number;
}
