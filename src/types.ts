/* ==========================================================================
   PROJECT:   WallStack · B2B CaaS Audio
   PACKAGE:   @wallstack-aa-caas/sdk
   FILE:      src/types.ts
   VERSION:   0.2.0 (SDK · Types from OpenAPI v1.0.2)
   DATE:      2026-10-04
   AUTHOR:    Andrey S. Yarovenko (WallStack)

   DESCRIPTION:
   TypeScript types for the WallStack SDK, synchronized with the real
   OpenAPI 3.1 spec of the REST v2 API. Source of truth:
   https://wallstackaudio.com/api/v2/openapi

   ARCHITECTURAL ROLE:
   This file is the single source of types for all SDK endpoints.
   Every API response follows { data, meta } wrapper; every error follows
   Stripe-style { error: { type, code, message, ... } }.

   DEPENDENCIES:
   - none
   ========================================================================== */

/* ==========================================================================
   HIERARCHY TREE (FILE STRUCTURE)
   --------------------------------------------------------------------------
   types.ts
   ├── RESPONSE WRAPPERS (3)
   ├── ERRORS (3)
   ├── AUTH (4)
   ├── RELEASES (4)
   ├── TRACKS (2)
   ├── ASSETS (5)
   ├── USER — Usage & Subscription (5)
   ├── DOWNLOADS (2)
   ├── REQUEST BODIES (3)
   ├── PARAMS (1)
   └── CLIENT OPTIONS (1)
   ========================================================================== */

/* ==========================================================================
   FLOW DIAGRAM (TYPE ARCHITECTURE)
   --------------------------------------------------------------------------

   API RESPONSE:  { data: T, meta: ResponseMeta }
   API ERROR:     { error: { type, code, message, ... } }

   AUTH FLOW:
   Register → Login (JWT cookie) → Create API Key (Bearer)

   DOMAIN:
   Release → Track → Asset → Download Response
   ========================================================================== */

/* ==========================================================================
   LAST CHANGES TABLE
   --------------------------------------------------------------------------
   | Version | Date       | Change                                              |
   |---------|------------|-----------------------------------------------------|
   | 0.1.0   | 2026-10-02 | Initial release (fictional types).                  |
   | 0.2.0   | 2026-10-04 | FULL REWRITE FROM OPENAPI v1.0.2:                   |
   |         |            | • Release (was Dataset).                            |
   |         |            | • Track + Asset.                                    |
   |         |            | • ApiResponse<T> = { data, meta }.                  |
   |         |            | • ApiErrorBody (Stripe-style).                      |
   |         |            | • User, Workspace, ApiKey, Usage, Subscription.     |
   |         |            | • DownloadRequest, DownloadResponse.                |
   |         |            | • 7 AssetType, 5 StemType.                          |
   |         |            | • Dual auth (apiKey + jwtCookie).                   |
   ========================================================================== */

/* ==========================================================================
   RESPONSE WRAPPERS
   ========================================================================== */

/** API response metadata. */
export interface ResponseMeta {
  /** Unique request ID (e.g. "req_a1b2c3d4..."). */
  request_id: string;
  /** ISO 8601 timestamp of the response. */
  timestamp: string;
  /** Optional rate limit information. */
  rate_limit?: RateLimitMeta;
}

/** Rate limit info embedded in meta. */
export interface RateLimitMeta {
  /** Maximum requests in the window. */
  limit: number;
  /** Remaining requests in the window. */
  remaining: number;
  /** Unix timestamp of reset. */
  reset_at: number;
}

/** Universal API response wrapper: { data, meta }. */
export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/* ==========================================================================
   ERRORS (Stripe-style)
   ========================================================================== */

/** 7 error types returned by the API. */
export type ErrorType =
  | "invalid_request_error"
  | "authentication_error"
  | "permission_error"
  | "not_found_error"
  | "conflict_error"
  | "rate_limit_error"
  | "api_error";

/** API error body. */
export interface ApiErrorBody {
  type: ErrorType;
  code: string;
  message: string;
  param?: string;
  doc_url?: string;
  request_id?: string;
  retry_after?: number;
}

/** Response containing an error. */
export interface ApiErrorResponse {
  error: ApiErrorBody;
}

/* ==========================================================================
   AUTH
   ========================================================================== */

/** User role. */
export type UserRole = "USER" | "ADMIN";

/** Subscription tier. */
export type PlanTier = "SINGLE_RELEASE" | "CAAS" | "ENTERPRISE";

/** User workspace. */
export interface Workspace {
  id: string;
  name: string;
  planTier: PlanTier | null;
}

/** Authenticated user. */
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  company: string | null;
  role: UserRole;
  workspace: Workspace;
}

/** API key. */
export interface ApiKey {
  id: string;
  name: string | null;
  /** Key prefix (e.g. "ws_live_a1b2"). */
  keyPrefix: string;
  /** Full key — shown ONLY on creation. */
  rawKey?: string;
  tier: PlanTier;
  isSandbox: boolean;
  createdAt: string;
  expiresAt: string | null;
}

/* ==========================================================================
   RELEASES
   ========================================================================== */

/** Release status. */
export type ReleaseStatus = "available" | "upcoming";

/** Edition type. */
export type EditionType = "full_mix" | "producer";

/** A WallStack release. */
export interface Release {
  id: string;
  slug: string;
  release_number: number;
  title: string;
  description: string;
  status: ReleaseStatus;
  bpm: number;
  key: string;
  genre: string | null;
  keywords: string[];
  price: number | null;
  currency: string;
  cover_url: string;
  edition_type: EditionType;
  track_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Preview of a track inside a release. */
export interface ReleaseTrackPreview {
  title: string;
  duration: number;
  previewUrl: string | null;
}

/** Release with full track list. */
export interface ReleaseDetail extends Release {
  tracks: Track[];
}

/* ==========================================================================
   TRACKS
   ========================================================================== */

/** Stem type. */
export type StemType = "solo" | "rhythm" | "arpeggio" | "bass" | "other";

/** A track. */
export interface Track {
  id: string;
  slug: string;
  title: string;
  display_name: string;
  duration_seconds: number;
  duration_formatted: string;
  track_number: number;
  bpm: number;
  key: string;
  format: string;
  stems_available: StemType[];
  di_available: boolean;
  assets: Asset[];
}

/* ==========================================================================
   ASSETS
   ========================================================================== */

/** 7 asset types. */
export type AssetType =
  | "FULL_MIX"
  | "STEM_RHYTHM"
  | "STEM_ARPEGGIO"
  | "STEM_SOLO"
  | "DI_RHYTHM"
  | "DI_ARPEGGIO"
  | "DI_SOLO";

/** Asset content type. */
export type AssetContentType = "MIX" | "STEMS" | "DI" | "BED";

/** Asset channel. */
export type AssetChannel = "LEFT" | "RIGHT" | "DUAL" | "MONO";

/** Asset status. */
export type AssetStatus = "PLANNED" | "UPLOADED" | "PUBLISHED";

/** A track asset (file). */
export interface Asset {
  id: string;
  type: AssetType;
  content_type: AssetContentType | null;
  rhythm_type: string | null;
  channel: AssetChannel | null;
  file_name: string | null;
  display_name: string;
  download_url: string | null;
  r2_key: string;
  size_bytes: number;
  format: string;
  sample_rate: number;
  bit_depth: number;
  key: string | null;
  genre: string | null;
  bitrate: string | null;
  status: AssetStatus;
}

/* ==========================================================================
   USER — Usage & Subscription
   ========================================================================== */

/** Billing period. */
export interface Period {
  start: string;
  end: string;
}

/** Request counter. */
export interface RequestCounter {
  total: number;
  limit: number;
  remaining: number;
}

/** API usage stats. */
export interface Usage {
  api_key_id: string;
  key_prefix: string;
  period: Period;
  requests: RequestCounter;
  last_used_at: string | null;
}

/** Subscription features. */
export interface SubscriptionFeatures {
  monthlyRequests: number;
  dailyTokens?: number;
  rolling30Days?: number;
  reaperScriptAccess: boolean;
  apiAccess: boolean;
}

/** Subscription. */
export interface Subscription {
  tier: PlanTier;
  isActive: boolean;
  expiresAt: string | null;
  autoRenew: boolean;
  features: SubscriptionFeatures;
}

/* ==========================================================================
   DOWNLOADS
   ========================================================================== */

/** Download request. */
export interface DownloadRequest {
  trackSlug: string;
  assetType: AssetType;
}

/** Download response. */
export interface DownloadResponse {
  download_url: string;
  license_id: string;
  /** TTL in seconds. */
  expires_in: number;
  track_title: string;
  asset_type: AssetType;
}

/* ==========================================================================
   REQUEST BODIES
   ========================================================================== */

/** Registration request. */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  company?: string;
}

/** Login request. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Create API key request. */
export interface TokenRequest {
  name?: string;
  sandbox?: boolean;
}

/* ==========================================================================
   PARAMS
   ========================================================================== */

/** Params for listing releases. */
export interface ListReleasesParams {
  status?: ReleaseStatus;
  limit?: number;
  offset?: number;
}

/* ==========================================================================
   DATASET CENTRIC 2.0 (AI Training datasets)
   ========================================================================== */

/** Dataset Centric standard version. */
export type DatasetStandardVersion = "wss-ccg-ds-2.0";

/** Preamp output (MAIN / RECORD, L / R). */
export type PreampOutput = "MAIN_L" | "MAIN_R" | "REC_L" | "REC_R";

/** Dataset part (guitar). */
export type DatasetPart = "RHYTHM" | "ARPEGGIO" | "SOLO";

/** Capture method. */
export type CaptureMethod = "PARALLEL" | "REAMP";

/** Knob vector source. */
export type KnobSource = "PRESET" | "CUSTOM";

/** Dataset file (DI or Wet, or Mix). */
export interface DatasetAsset {
  file: string;
  sha256: string;
}

/** Knob vector (0–10). */
export interface DatasetKnobVector {
  gain: number;
  treble: number;
  mid: number;
  bass: number;
  master: number;
  presence?: number;
}

/** Dataset item (one DI+Wet pair). */
export interface DatasetItem {
  id: string;
  position: number;
  part: DatasetPart;
  takeGroupId?: string | null;
  stereoGroupId?: string | null;
  channelLabel: string;
  level?: number;
  presence?: number;
  captureMethod: CaptureMethod;
  knobSource: KnobSource;
  preampChannel: string;
  preampMode: string;
  recordVoicing: "LO_GAIN" | "HI_GAIN";
  preampOutput?: PreampOutput;
  powerAmpMode?: "DEEP" | "HALF_DRIVE" | "MODERN";
  powerAmpChannel?: "A" | "B";
  presetId: string;
  knobVector: DatasetKnobVector;
  provenance: { source: string };
  di: DatasetAsset;
  wet: DatasetAsset;
}

/** Dataset track. */
export interface DatasetTrack {
  name: string;
  key: string;
  bpm: number;
  harmony: string;
  mix: DatasetAsset;
  items: DatasetItem[];
}

/** Dataset license. */
export interface DatasetLicense {
  type: "WSS-LIC-AI";
  verifyUrl: string;
  sha256: string;
}

/** Full Dataset Centric 2.0 manifest. */
export interface DatasetManifest {
  dataset: {
    id: string;
    standardVersion: DatasetStandardVersion;
    title: string;
    description?: string;
    createdAt?: string;
    licenseId?: string;
  };
  format: {
    codec: "WAV";
    bitDepth: number;
    sampleRate: number;
  };
  alignment: {
    method: string;
    tolerance: 0;
  };
  signal: {
    noDigitalClipping: true;
    measuredNoiseFloorDb: number;
  };
  chain: {
    id: string;
    preamp: string;
    powerAmp: string;
    irBank?: string;
    capabilities: {
      maxChannels: number;
      stereoReady: boolean;
      preampOutputs: PreampOutput[];
      powerAmpChannels: ("A" | "B")[];
    };
  };
  tracks: DatasetTrack[];
  license: DatasetLicense;
  contentIdCleared: true;
}

/** Chain state (form options for dataset request). */
export interface ChainStateResponse {
  data: {
    channels: Array<{ label: string; preampOutput: PreampOutput }>;
    presets: Array<{ id: string; name: string }>;
    parts: DatasetPart[];
  };
  meta: ResponseMeta;
}

/** Dataset request body. */
export interface DatasetRequest {
  datasetName: string;
  tracks: Array<{
    name: string;
    key: string;
    bpm: number;
    harmony: string;
    items: Array<{
      part: DatasetPart;
      presetId: string;
      preampOutput?: PreampOutput;
    }>;
  }>;
  email: string;
  password?: string;
  isDemo?: boolean;
}

/** Dataset request response. */
export interface DatasetRequestResponse {
  data: {
    inquiryId: string;
    datasetName: string;
    isDemo: boolean;
    licenseId?: string;
  };
  meta: ResponseMeta;
}

/* ==========================================================================
   CLIENT OPTIONS
   ========================================================================== */

/** SDK client options. */
export interface WallStackClientOptions {
  /** API key (ws_live_* or ws_sandbox_*). Used as Bearer. */
  apiKey?: string;
  /** JWT cookie (ws_session) for dashboard/admin endpoints. */
  jwtCookie?: string;
  /** Base URL. Default: "https://wallstackaudio.com/api/v2". */
  baseUrl?: string;
  /** Timeout in ms. Default: 30000. */
  timeout?: number;
  /** Max retry attempts. Default: 3. */
  maxRetries?: number;
  /** Custom fetch (for edge / tests). */
  fetch?: typeof fetch;
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
