import { UserManager, WebStorageStateStore, User as OidcUser } from "oidc-client-ts";

// Authentik OIDC configuration - values MUST come from environment (Vite) at build/runtime.
// Do NOT fall back to a hard-coded localhost value; leave empty to force explicit configuration.
const AUTHENTIK_URL = import.meta.env.VITE_AUTHENTIK_URL || "";
const AUTHENTIK_CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || "";
// Prefer explicit issuer from environment to avoid discovery issues
const AUTHENTIK_ISSUER = import.meta.env.VITE_AUTHENTIK_ISSUER || "";
// Optional explicit metadata discovery URL to bypass misconfigured issuers
const AUTHENTIK_METADATA_URL = import.meta.env.VITE_AUTHENTIK_METADATA_URL || "";
const REDIRECT_URI = `${window.location.origin}/callback`;
const POST_LOGOUT_REDIRECT_URI = window.location.origin;

// Derive authoritative values and compute an explicit metadata URL to
// avoid any ambiguity about which origin the client will request.
const authority = AUTHENTIK_ISSUER || `${AUTHENTIK_URL.replace(/\/$/, '')}/application/o/trailhead/`;
// If a metadata URL is provided, use it; otherwise compute the well-known URL
export const metadataUrl = AUTHENTIK_METADATA_URL
  ? AUTHENTIK_METADATA_URL
  : authority
      ? `${authority.replace(/\/$/, '')}/.well-known/openid-configuration`
      : "";

// Log what we'll use so we can debug requests that end up hitting the
// frontend dev server (index.html) instead of Authentik.
console.debug('[OIDC-CONFIG] authority:', authority);
console.debug('[OIDC-CONFIG] metadataUrl:', metadataUrl);

// OIDC configuration for Authentik
export const oidcConfig = {
  // Use provided issuer URL when available; fallback to legacy app path
  authority,
  // Provide an explicit metadataUrl so discovery is absolute
  metadataUrl,
  client_id: AUTHENTIK_CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  post_logout_redirect_uri: POST_LOGOUT_REDIRECT_URI,
  response_type: "code",
  scope: "openid profile email",
  automaticSilentRenew: true,
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

// Create UserManager instance
export const userManager = new UserManager(oidcConfig);

// Helper functions
export const signIn = () => {
  return userManager.signinRedirect();
};

export const signOut = () => {
  return userManager.signoutRedirect();
};

export const getUser = (): Promise<OidcUser | null> => {
  return userManager.getUser();
};

export const getAccessToken = async (): Promise<string | null> => {
  // Compatibility shim: request token from backend when using server-driven auth
  try {
    // Use the runtime API base helper if available, otherwise default to same-origin
    const { getApiBase } = await import("../utils/apiBase");
    const apiBase = getApiBase() || window.location.origin;
    const resp = await fetch(`${apiBase}/auth/token`, { credentials: "include" });
    
    if (resp.ok) {
      const data = await resp.json();
      if (data.access_token) {
        return data.access_token;
      }
    }
  } catch (e) {
    // Ignore network errors and fall through to client-side manager
    console.debug("Failed to fetch server-side token, falling back to client storage", e);
  }

  // Fallback to client-side manager if configured or if server fetch failed
  try {
    const user = await userManager.getUser();
    return user?.access_token || null;
  } catch (e) {
    console.error("Failed to get client-side token", e);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await userManager.getUser();
  return !!user && !user.expired;
};

// Handle callback after authentication
export const handleCallback = async (): Promise<OidcUser> => {
  return userManager.signinRedirectCallback();
};

// Handle silent callback (for token refresh)
export const handleSilentCallback = async (): Promise<void> => {
  await userManager.signinSilentCallback();
};

// Export types
export type { OidcUser };
