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
  const raw = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const normalizedRoot = raw.replace(/\/api\/?$/i, "");
  OpenAPI.BASE = normalizedRoot;

  // Set token retrieval logic
  OpenAPI.TOKEN = async () => {
    // Wait for Clerk to load
    let retries = 0;
    const maxRetries = 10;
    while (!window.Clerk && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      return token || "";
    }
    return "";
  };
};
