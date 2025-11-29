import { OpenAPI } from "../client";
import { getAccessToken } from "../auth/client";

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

  // Set token retrieval logic using Authentik OIDC
  OpenAPI.TOKEN = async () => {
    try {
      // Get the access token from Authentik
      const token = await getAccessToken();
      
      if (!token) {
        console.warn("⚠️ No Authentik token found - user may not be signed in yet");
        throw new Error(
          "You must be signed in to access this feature. Please sign in and try again."
        );
      }

      console.log(
        "✅ Using Authentik access token (first 20 chars):",
        token.substring(0, 20) + "..."
      );
      return token;
    } catch (error) {
      console.error("❌ Authentication error in TOKEN retrieval:", error);
      throw error;
    }
  };
};
