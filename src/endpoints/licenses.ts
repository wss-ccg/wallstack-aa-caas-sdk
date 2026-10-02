/**
 * WallStack AA-CaaS™ SDK — Licenses endpoint
 *
 * @packageDocumentation
 * @module @wallstack-aa-caas/sdk/endpoints/licenses
 */

import type { HttpClient } from "../client.js";
import type {
  CreateLicenseParams,
  License,
  ListParams,
  PaginatedResponse,
} from "../types.js";

export class LicensesClient {
  constructor(private readonly http: HttpClient) {}

  public async create(params: CreateLicenseParams): Promise<License> {
    if (!params.datasetId) {
      throw new Error("datasetId is required");
    }
    if (!params.company) {
      throw new Error("company is required");
    }
    return this.http.request<License>("POST", "/licenses", params);
  }

  public async get(key: string): Promise<License> {
    if (!key) {
      throw new Error("License key is required");
    }
    return this.http.request<License>("GET", "/licenses/" + encodeURIComponent(key));
  }

  public async validate(key: string): Promise<boolean> {
    if (!key) {
      throw new Error("License key is required");
    }
    try {
      const result = await this.http.request<{ valid: boolean }>(
        "GET",
        "/licenses/" + encodeURIComponent(key) + "/validate"
      );
      return result.valid === true;
    } catch {
      return false;
    }
  }

  public async list(params?: ListParams): Promise<PaginatedResponse<License>> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set("limit", String(params.limit));
    if (params?.offset !== undefined) query.set("offset", String(params.offset));

    const qs = query.toString();
    const path = qs ? "/licenses?" + qs : "/licenses";

    return this.http.request<PaginatedResponse<License>>("GET", path);
  }
}
