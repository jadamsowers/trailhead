import { OpenAPI } from "../client";

/**
 * Initialize the generated API client with configuration
 */
export const initApiClient = () => {
  // Set base URL from environment or default
  // Normalize the provided VITE_API_URL so that generated paths which already
  // include a leading '/api' don't get doubled (e.g. '/api/api/...').
  // If VITE_API_URL is something like 'http://localhost:8000/api' or '/api'
  // strip the trailing '/api' and keep the root (or empty string for relative).
  const raw = import.meta.env.VITE_API_URL || window.location.origin;
  const normalizedRoot = raw.replace(/\/api\/?$/i, "");
  OpenAPI.BASE = normalizedRoot;
  // Use cookie-based authentication for API requests
  OpenAPI.WITH_CREDENTIALS = true;
  OpenAPI.CREDENTIALS = "include";
  // No client-side token retrieval
  OpenAPI.TOKEN = undefined;

  // Ensure fetch will include credentials for API requests even when handwritten fetch is used.
  // This wrapper only modifies requests to the configured API base or to paths starting with '/api'.
  try {
    const _originalFetch = (window as any).fetch.bind(window);
    (window as any).fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ) => {
      try {
        const url = typeof input === "string" ? input : (input as Request).url;
        const apiRoot = OpenAPI.BASE || "";
        const shouldInclude =
          (apiRoot && url.startsWith(apiRoot)) || url.startsWith("/api");

        const newInit = Object.assign({}, init || {});
        if (shouldInclude) {
          newInit.credentials = newInit.credentials || "include";
        }
        return await _originalFetch(input, newInit);
      } catch (e) {
        return _originalFetch(input, init);
      }
    };
  } catch (e) {
    // Ignore if fetch cannot be wrapped
    console.warn("Could not wrap window.fetch for credential injection:", e);
  }
};
