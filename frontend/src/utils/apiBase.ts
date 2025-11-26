import { OpenAPI } from "../client";

/**
 * Compute the API base used by handwritten fetches.
 *
 * The generated OpenAPI client sets paths like '/api/places' on each operation.
 * To avoid double '/api/api' we use the OpenAPI.BASE (which should be the
 * server root without a trailing '/api') and append '/api' here. We compute
 * this lazily at runtime so init order (initApiClient called during app
 * startup) is respected.
 */
export function getApiBase(): string {
  const base = OpenAPI.BASE ?? "";
  const apiRoot = base.replace(/\/api\/?$/i, "");
  return apiRoot + "/api";
}

export default getApiBase;
