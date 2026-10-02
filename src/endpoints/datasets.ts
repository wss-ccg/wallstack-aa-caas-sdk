/**
 * WallStack AA-CaaS™ SDK — Datasets endpoint
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk/endpoints/datasets
 */

import type { HttpClient } from "../client.js";
import type { Dataset, ListParams, PaginatedResponse, Track } from "../types.js";

/**
 * Client for the `/datasets` endpoints of the WallStack REST v2 API.
 *
 * Access via \`client.datasets\`.
 */
export class DatasetsClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches a single dataset by ID.
   *
   * @param id - Dataset ID (e.g. "ds_abc123").
   * @returns The dataset.
   * @throws {NotFoundError} When the dataset does not exist.
   *
   * @example
   * \`\`\`typescript
   * const dataset = await client.datasets.get("ds_abc123");
   * console.log(dataset.name, dataset.trackCount);
   * \`\`\`
   */
  public async get(id: string): Promise<Dataset> {
    if (!id) {
      throw new Error("Dataset ID is required");
    }
    return this.http.request<Dataset>("GET", `/datasets/${encodeURIComponent(id)}`);
  }

  /**
   * Lists datasets with optional pagination.
   *
   * @param params - Pagination parameters.
   * @returns Paginated list of datasets.
   *
   * @example
   * \`\`\`typescript
   * const page = await client.datasets.list({ limit: 20, offset: 0 });
   * for (const ds of page.data) {
   *   console.log(ds.name);
   * }
   * \`\`\`
   */
  public async list(params?: ListParams): Promise<PaginatedResponse<Dataset>> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));

    const qs = query.toString();
    const path = qs ? `/datasets?${qs}` : "/datasets";

    return this.http.request<PaginatedResponse<Dataset>>("GET", path);
  }

  /**
   * Lists all tracks belonging to a dataset.
   *
   * @param id - Dataset ID.
   * @param params - Optional pagination parameters.
   * @returns Paginated list of tracks.
   *
   * @example
   * \`\`\`typescript
   * const tracks = await client.datasets.tracks("ds_abc123");
   * console.log(`${tracks.total} tracks total`);
   * \`\`\`
   */
  public async tracks(
    id: string,
    params?: ListParams
  ): Promise<PaginatedResponse<Track>> {
    if (!id) {
      throw new Error("Dataset ID is required");
    }

    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));

    const qs = query.toString();
    const basePath = `/datasets/${encodeURIComponent(id)}/tracks`;
    const path = qs ? `${basePath}?${qs}` : basePath;

    return this.http.request<PaginatedResponse<Track>>("GET", path);
  }
}
