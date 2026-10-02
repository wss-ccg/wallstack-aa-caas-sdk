/**
 * WallStack AA-CaaS™ SDK — Tracks endpoint
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk/endpoints/tracks
 */

import type { HttpClient } from "../client.js";
import type { ListParams, PaginatedResponse, Track } from "../types.js";

export type TrackFormat = "wav" | "flac" | "mp3";

export class TracksClient {
  constructor(private readonly http: HttpClient) {}

  public async get(id: string): Promise<Track> {
    if (!id) {
      throw new Error("Track ID is required");
    }
    return this.http.request<Track>("GET", "/tracks/" + encodeURIComponent(id));
  }

  public async list(
    params?: ListParams & { datasetId?: string }
  ): Promise<PaginatedResponse<Track>> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));
    if (params?.datasetId) query.set("dataset_id", params.datasetId);

    const qs = query.toString();
    const path = qs ? "/tracks?" + qs : "/tracks";

    return this.http.request<PaginatedResponse<Track>>("GET", path);
  }

  public async download(
    id: string,
    format: TrackFormat = "wav",
    variant: "di" | "wet" = "wet"
  ): Promise<string> {
    if (!id) {
      throw new Error("Track ID is required");
    }

    const query = new URLSearchParams({ format, variant });
    const path = "/tracks/" + encodeURIComponent(id) + "/download?" + query.toString();

    const result = await this.http.request<{ url: string }>("GET", path);
    return result.url;
  }
}
