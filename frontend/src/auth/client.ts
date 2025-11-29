import { UserManager, WebStorageStateStore, User as OidcUser } from "oidc-client-ts";

// Authentik OIDC configuration
const AUTHENTIK_URL = import.meta.env.VITE_AUTHENTIK_URL || "http://localhost:9000";
const AUTHENTIK_CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || "";
const REDIRECT_URI = `${window.location.origin}/callback`;
const POST_LOGOUT_REDIRECT_URI = window.location.origin;

// OIDC configuration for Authentik
export const oidcConfig = {
  authority: `${AUTHENTIK_URL}/application/o/trailhead/`,
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
  const user = await userManager.getUser();
  return user?.access_token || null;
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
