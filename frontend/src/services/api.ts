// Nominatim (OpenStreetMap) API for address autocomplete
export const nominatimAPI = {
  /**
   * Search for places using Nominatim (OpenStreetMap)
   * @param query - The search string (address or place name)
   * @param limit - Max number of results
   * @returns Array of { display_name, lat, lon, address, ... }
   */
  async search(query: string, limit: number = 5): Promise<NominatimResult[]> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      query
    )}&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("Nominatim search failed");
    }
    return response.json();
  },
};

export interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  name?: string; // Optional name of the place
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    amenity?: string; // e.g., "restaurant", "park", etc.
    [key: string]: string | undefined;
  };
}
import {
  Outing,
  OutingCreate,
  OutingUpdateResponse,
  SignupCreate,
  SignupResponse,
  SignupWithDetails,
  LoginRequest,
  TokenResponse,
  User,
  APIError as APIErrorResponse,
  FamilyMember,
  FamilyMemberCreate,
  FamilyMemberUpdate,
  FamilyMemberSummary,
  FamilyMemberListResponse,
} from "../types";

import { getApiBase } from "../utils/apiBase";
import { getAccessToken, signOut } from "../auth/client";

// Ensure same-origin API requests include credentials and standard JSON headers.
// This wrapper is defensive: it only mutates requests that target the configured
// API base path on the same origin. External services (e.g. Nominatim) are left
// untouched.
(() => {
  try {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input.url;
        const basePath = (() => {
          try {
            return new URL(getApiBase(), window.location.origin).pathname;
          } catch (e) {
            return getApiBase();
          }
        })();

        const parsed = new URL(url, window.location.origin);
        const isSameOrigin = parsed.origin === window.location.origin;
        if (isSameOrigin && parsed.pathname.startsWith(basePath)) {
          // Merge headers from getAuthHeaders() and any provided headers.
          const helperHeaders = await (async () => {
            try {
              return (await (await import("./api")).getAuthHeaders()) as Record<
                string,
                string
              >;
            } catch (e) {
              // If importing self fails (circular), fall back to default JSON header
              return { "Content-Type": "application/json" };
            }
          })();

          const providedHeaders = (init && init.headers) || {};
          const mergedHeaders = {
            ...(helperHeaders || {}),
            ...(providedHeaders as Record<string, string>),
          };

          const finalInit: RequestInit = {
            credentials: "include",
            ...init,
            headers: mergedHeaders,
          };
          return originalFetch(input, finalInit);
        }
      } catch (e) {
        // If anything goes wrong, fall back to original fetch for safety.
        // Do not block the app on the wrapper.
        console.debug("api fetch wrapper error", e);
      }
      return originalFetch(input, init);
    };
  } catch (e) {
    // If even binding fetch fails, do nothing.
    // This should be very rare in modern browsers.
    // Keep the original behavior.
    // eslint-disable-next-line no-console
    console.debug("Failed to install fetch wrapper for API credentials", e);
  }
})();

// API base is computed from the generated OpenAPI.BASE via `getApiBase()`.
// We compute it lazily using the helper so that init order (initApiClient())
// can set OpenAPI.BASE before fetches are performed and to avoid '/api/api'.

// Log API configuration on load
console.log("🔧 API Configuration:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: getApiBase(),
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
});

// Health check API
export const healthAPI = {
  async check(): Promise<{ status: string; message: string }> {
    const healthUrl = `${getApiBase()}/health`;
    console.log("🏥 Health Check:", {
      url: healthUrl,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Health Check Response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      if (!response.ok) {
        throw new Error(
          `Health check failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("📦 Health Check Data:", data);
      return data;
    } catch (error) {
      console.error("❌ Health Check Error:", {
        error: error instanceof Error ? error.message : "Unknown error",
        url: healthUrl,
        timestamp: new Date().toISOString(),
      });
      throw new Error("Unable to connect to backend server");
    }
  },
};

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "APIError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  console.log("📨 API Response:", {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: {
      "content-type": response.headers.get("content-type"),
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin"
      ),
    },
  });

  if (!response.ok) {
    let errorDetail: string;

    try {
      const errorData: APIErrorResponse & {
        error_type?: string;
        error_message?: string;
      } = await response.json();

      // Handle different error response formats
      if (errorData.error_type && errorData.error_message) {
        // Backend 500 error with detailed info
        errorDetail = `${errorData.error_type}: ${errorData.error_message}`;
        console.error("❌ Backend Error:", {
          url: response.url,
          status: response.status,
          type: errorData.error_type,
          message: errorData.error_message,
          detail: errorData.detail,
        });
      } else if (errorData.detail) {
        // Standard FastAPI error
        errorDetail =
          typeof errorData.detail === "string"
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        console.error("❌ API Error:", {
          url: response.url,
          status: response.status,
          detail: errorData.detail,
        });
      } else {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (parseError) {
      // If JSON parsing fails, use status text
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      console.error("❌ Failed to parse error response:", parseError);
    }

    throw new APIError(response.status, errorDetail);
  }

  try {
    const jsonText = await response.text();
    console.log("📝 Raw JSON response:", jsonText.substring(0, 500));
    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error("❌ JSON Parse Error:", {
      error: parseError,
      message: parseError instanceof Error ? parseError.message : "Unknown",
      url: response.url,
    });
    throw new Error(
      `Failed to parse JSON response: ${
        parseError instanceof Error ? parseError.message : "Unknown error"
      }`
    );
  }
}

// Helper function to get auth headers with Stack Auth token
async function getAuthHeaders(): Promise<HeadersInit> {
  // With server-driven authentication we rely on cookies. Return the
  // standard JSON headers; credentials are attached automatically by
  // the generated client (OpenAPI.WITH_CREDENTIALS) or by the global
  // fetch wrapper (initClient).
  return {
    "Content-Type": "application/json",
  };
}

// Outing API
export const outingAPI = {
  async getAll(): Promise<Outing[]> {
    const url = `${getApiBase()}/outings`;
    console.log("🚀 API Request: GET", url);
    const response = await fetch(url);
    const data = await handleResponse<{ outings: Outing[]; total: number }>(
      response
    );
    return data.outings;
  },

  async getAvailable(): Promise<Outing[]> {
    const url = `${getApiBase()}/outings/available`;
    console.log("🚀 API Request: GET", url);
    const response = await fetch(url);
    const data = await handleResponse<{ outings: Outing[]; total: number }>(
      response
    );
    return data.outings;
  },

  async getById(id: string): Promise<Outing> {
    const url = `${getApiBase()}/outings/${id}`;
    console.log("🚀 API Request: GET", url);
    const response = await fetch(url, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<Outing>(response);
  },

  async create(outing: OutingCreate): Promise<Outing> {
    const url = `${getApiBase()}/outings`;
    console.log("🚀 API Request: POST", url, outing);
    const response = await fetch(url, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(outing),
    });
    return handleResponse<Outing>(response);
  },

  async update(
    id: string,
    outing: Partial<OutingCreate>
  ): Promise<OutingUpdateResponse> {
    const url = `${getApiBase()}/outings/${id}`;
    console.log("🚀 API Request: PUT", url, outing);
    const response = await fetch(url, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(outing),
    });
    return handleResponse<OutingUpdateResponse>(response);
  },

  async delete(id: string): Promise<void> {
    const url = `${getApiBase()}/outings/${id}`;
    console.log("🚀 API Request: DELETE", url);
    const response = await fetch(url, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete outing");
    }
  },

  async getOutingHandout(id: string): Promise<Blob> {
    const url = `${getApiBase()}/outings/${id}/handout`;
    console.log("🚀 API Request: GET", url);
    const response = await fetch(url, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to download handout");
    }
    return response.blob();
  },
};

// Signup API
export const signupAPI = {
  async create(signup: SignupCreate): Promise<SignupResponse> {
    const response = await fetch(`${getApiBase()}/signups`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(signup),
    });
    return handleResponse<SignupResponse>(response);
  },

  async getById(id: string): Promise<SignupWithDetails> {
    const response = await fetch(`${getApiBase()}/signups/${id}`);
    return handleResponse<SignupWithDetails>(response);
  },

  async getByOuting(outingId: string): Promise<SignupResponse[]> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/signups`,
      {
        headers: await getAuthHeaders(),
      }
    );
    const data = await handleResponse<{
      signups: SignupResponse[];
      total: number;
    }>(response);
    return data.signups;
  },

  async getMySignups(): Promise<SignupResponse[]> {
    const response = await fetch(`${getApiBase()}/signups/my-signups`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<SignupResponse[]>(response);
  },

  async updateSignup(
    signupId: string,
    updateData: {
      family_contact?: {
        email: string;
        phone: string;
        emergency_contact_name: string;
        emergency_contact_phone: string;
      };
      family_member_ids?: string[];
    }
  ): Promise<SignupResponse> {
    const response = await fetch(`${getApiBase()}/signups/${signupId}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse<SignupResponse>(response);
  },

  async cancelSignup(signupId: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/signups/${signupId}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to cancel signup");
    }
  },
  async getEmails(
    outingId: string
  ): Promise<{ emails: string[]; count: number }> {
    const response = await fetch(
      `${getApiBase()}/signups/outings/${outingId}/emails`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<{ emails: string[]; count: number }>(response);
  },

  async sendEmail(
    outingId: string,
    emailData: {
      subject: string;
      message: string;
      from_email: string;
    }
  ): Promise<{
    message: string;
    recipient_count: number;
    recipients: string[];
    subject: string;
    body: string;
    from: string;
    outing_name: string;
    note: string;
  }> {
    const response = await fetch(
      `${getApiBase()}/signups/outings/${outingId}/send-email`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(emailData),
      }
    );
    return handleResponse(response);
  },
};

// PDF Export API
export const pdfAPI = {
  async exportRosterPDF(outingId: string): Promise<Blob> {
    const response = await fetch(
      `${getApiBase()}/signups/outings/${outingId}/export-pdf`,
      {
        headers: await getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new APIError(response.status, "Failed to export roster PDF");
    }
    return response.blob();
  },

  downloadPDF(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// OAuth API
export const oauthAPI = {
  /**
   * Initiate OAuth flow
   */
  initiateLogin(_redirectUri: string, _state?: string): void {
    // Use Stack Auth's sign-in flow - redirect to handler
    window.location.href = "/handler/sign-in";
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    _code: string,
    _redirectUri: string
  ): Promise<TokenResponse> {
    // Legacy OAuth code exchange is no longer supported.
    // Authentication is handled by Stack Auth on the client.
    throw new APIError(
      501,
      "OAuth code exchange not supported; use Stack Auth login."
    );
  },

  /**
   * Refresh access token
   */
  async refreshToken(_refreshToken: string): Promise<TokenResponse> {
    // Obtain a fresh session token from Authentik
    const token = await getAccessToken();
    if (token) {
      return {
        access_token: token,
        refresh_token: "",
        token_type: "bearer",
      };
    }
    throw new APIError(401, "Unable to refresh token via Authentik session");
  },

  /**
   * Logout user
   */
  async logout(_refreshToken: string): Promise<void> {
    // Sign out via Authentik
    await signOut();
  },

  /**
   * Get current user info
   */
  async getCurrentUser(_token?: string): Promise<User> {
    const response = await fetch(`${getApiBase()}/auth/me`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<User>(response);
  },

  /**
   * Generate random state for CSRF protection
   */
  generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  },

  /**
   * Verify state parameter
   */
  verifyState(state: string): boolean {
    const storedState = sessionStorage.getItem("oauth_state");
    sessionStorage.removeItem("oauth_state");
    return storedState === state;
  },
};

// Registration API
export const registrationAPI = {
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<{ message: string; user_id: string; email: string }> {
    const response = await fetch(`${getApiBase()}/register/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Legacy Auth API (kept for backward compatibility with admin accounts)
export const authAPI = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${getApiBase()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse<TokenResponse>(response);
  },

  async getCurrentUser(_token?: string): Promise<User> {
    const response = await fetch(`${getApiBase()}/auth/me`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<User>(response);
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${getApiBase()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return handleResponse<TokenResponse>(response);
  },

  async logout(_token?: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/auth/logout`, {
      method: "POST",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to logout");
    }
  },

  async checkSetupStatus(): Promise<{ setup_complete: boolean }> {
    const response = await fetch(`${getApiBase()}/auth/setup-status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<{ setup_complete: boolean }>(response);
  },

  async setupAdmin(data: {
    email: string;
    password: string;
    full_name: string;
  }): Promise<{ message: string; user_id: string }> {
    const response = await fetch(`${getApiBase()}/auth/setup-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string; user_id: string }>(response);
  },
};

// Family Management API
const FAMILY_STORAGE_KEY = "family_members_cache";
const FAMILY_SUMMARY_STORAGE_KEY = "family_summary_cache";

export const familyAPI = {
  /**
   * Get all family members for the current user
   */
  async getAll(): Promise<FamilyMemberListResponse> {
    const url = `${getApiBase()}/family/`;
    console.log("🚀 API Request: GET", url);

    try {
      const headers = await getAuthHeaders();
      const authHeader = (headers as Record<string, string>)["Authorization"];
      console.log("🔑 Auth headers:", {
        hasAuth: !!authHeader,
        authType: authHeader?.split(" ")[0],
      });

      const response = await fetch(url, { headers });
      const data = await handleResponse<FamilyMemberListResponse>(response);

      // Cache the data when online
      try {
        localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to cache family data:", e);
      }

      return data;
    } catch (error) {
      // If offline or auth error, try cache
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes("Failed to fetch")) ||
        (error instanceof Error && error.message.includes("Authentication"))
      ) {
        const cached = localStorage.getItem(FAMILY_STORAGE_KEY);
        if (cached) {
          console.log("📱 Serving cached family data (offline mode)");
          return JSON.parse(cached);
        }
      }
      throw error;
    }
  },

  /**
   * Get simplified list of family members for signup selection
   * @param outingId - Optional outing ID to check youth protection expiration against outing end date
   */
  async getSummary(outingId?: string): Promise<FamilyMemberSummary[]> {
    let url = `${getApiBase()}/family/summary`;
    if (outingId) {
      url += `?outing_id=${encodeURIComponent(outingId)}`;
    }
    console.log("🚀 API Request: GET", url);

    try {
      const response = await fetch(url, {
        headers: await getAuthHeaders(),
      });
      const data = await handleResponse<FamilyMemberSummary[]>(response);

      // Cache the data when online
      try {
        localStorage.setItem(FAMILY_SUMMARY_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to cache family summary:", e);
      }

      return data;
    } catch (error) {
      // If offline or auth error, try cache
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes("Failed to fetch")) ||
        (error instanceof Error && error.message.includes("Authentication"))
      ) {
        const cached = localStorage.getItem(FAMILY_SUMMARY_STORAGE_KEY);
        if (cached) {
          console.log("📱 Serving cached family summary (offline mode)");
          return JSON.parse(cached);
        }
      }
      throw error;
    }
  },

  /**
   * Get a specific family member by ID
   */
  async getById(id: string): Promise<FamilyMember> {
    const response = await fetch(`${getApiBase()}/family/${id}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<FamilyMember>(response);
  },

  /**
   * Create a new family member
   */
  async create(member: FamilyMemberCreate): Promise<FamilyMember> {
    const response = await fetch(`${getApiBase()}/family/`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(member),
    });
    return handleResponse<FamilyMember>(response);
  },

  /**
   * Update an existing family member
   */
  async update(id: string, member: FamilyMemberUpdate): Promise<FamilyMember> {
    const response = await fetch(`${getApiBase()}/family/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(member),
    });
    return handleResponse<FamilyMember>(response);
  },

  /**
   * Delete a family member
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/family/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete family member");
    }
  },
};

// User API (Stack Auth-based)
export const userAPI = {
  /**
   * Get current user information including contact details
   */
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${getApiBase()}/auth/me`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<User>(response);
  },

  /**
   * Update current user's contact information
   */
  async updateContactInfo(contactInfo: {
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }): Promise<User> {
    const response = await fetch(`${getApiBase()}/auth/me/contact`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(contactInfo),
    });
    return handleResponse<User>(response);
  },
};

// Check-in API
// Check-in API
const CHECKIN_STORAGE_PREFIX = "checkin_data_";
const CHECKIN_QUEUE_KEY = "checkin_queue";

interface QueueItem {
  type: "checkin" | "undo";
  outingId: string;
  data?: import("../types").CheckInCreate;
  participantId?: string;
  timestamp: number;
  id: string;
}

export const checkInAPI = {
  /**
   * Get check-in status for an outing
   */
  async getCheckInStatus(
    outingId: string
  ): Promise<import("../types").CheckInSummary> {
    try {
      const response = await fetch(
        `${getApiBase()}/outings/${outingId}/checkin`,
        {
          headers: await getAuthHeaders(),
        }
      );
      const data = await handleResponse<import("../types").CheckInSummary>(
        response
      );

      // Cache the data
      try {
        localStorage.setItem(
          `${CHECKIN_STORAGE_PREFIX}${outingId}`,
          JSON.stringify(data)
        );
      } catch (e) {
        console.warn("Failed to cache check-in data:", e);
      }

      return data;
    } catch (error) {
      // If network error, try cache
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes("Failed to fetch"))
      ) {
        const cached = localStorage.getItem(
          `${CHECKIN_STORAGE_PREFIX}${outingId}`
        );
        if (cached) {
          console.log("📱 Serving cached check-in data");
          return JSON.parse(cached);
        }
      }
      throw error;
    }
  },

  /**
   * Check in participants
   */
  async checkInParticipants(
    outingId: string,
    data: import("../types").CheckInCreate
  ): Promise<import("../types").CheckInResponse> {
    try {
      const response = await fetch(
        `${getApiBase()}/outings/${outingId}/checkin`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );
      return handleResponse<import("../types").CheckInResponse>(response);
    } catch (error) {
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes("Failed to fetch"))
      ) {
        console.log("📱 Offline: Queuing check-in");

        // 1. Update local cache optimistically
        const cacheKey = `${CHECKIN_STORAGE_PREFIX}${outingId}`;
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(
            cachedStr
          ) as import("../types").CheckInSummary;
          const now = new Date().toISOString();

          cached.participants = cached.participants.map((p) => {
            if (data.participant_ids.includes(p.id)) {
              return {
                ...p,
                is_checked_in: true,
                checked_in_at: now,
                checked_in_by: data.checked_in_by,
              };
            }
            return p;
          });

          cached.checked_in_count = cached.participants.filter(
            (p) => p.is_checked_in
          ).length;
          localStorage.setItem(cacheKey, JSON.stringify(cached));
        }

        // 2. Add to queue
        const queue: QueueItem[] = JSON.parse(
          localStorage.getItem(CHECKIN_QUEUE_KEY) || "[]"
        );
        queue.push({
          type: "checkin",
          outingId,
          data,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(7),
        });
        localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(queue));

        // Return mock response
        return {
          message: "Offline: Check-in queued",
          checked_in_count: data.participant_ids.length,
          participant_ids: data.participant_ids,
          checked_in_at: new Date().toISOString(),
        };
      }
      throw error;
    }
  },

  /**
   * Undo a check-in for a participant
   */
  async undoCheckIn(
    outingId: string,
    participantId: string
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${getApiBase()}/outings/${outingId}/checkin/${participantId}`,
        {
          method: "DELETE",
          headers: await getAuthHeaders(),
        }
      );
      return handleResponse<{ message: string }>(response);
    } catch (error) {
      if (
        error instanceof TypeError ||
        (error instanceof Error && error.message.includes("Failed to fetch"))
      ) {
        console.log("📱 Offline: Queuing undo check-in");

        // 1. Update local cache optimistically
        const cacheKey = `${CHECKIN_STORAGE_PREFIX}${outingId}`;
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cached = JSON.parse(
            cachedStr
          ) as import("../types").CheckInSummary;

          cached.participants = cached.participants.map((p) => {
            if (p.id === participantId) {
              return {
                ...p,
                is_checked_in: false,
                checked_in_at: undefined,
                checked_in_by: undefined,
              };
            }
            return p;
          });

          cached.checked_in_count = cached.participants.filter(
            (p) => p.is_checked_in
          ).length;
          localStorage.setItem(cacheKey, JSON.stringify(cached));
        }

        // 2. Add to queue
        const queue: QueueItem[] = JSON.parse(
          localStorage.getItem(CHECKIN_QUEUE_KEY) || "[]"
        );
        queue.push({
          type: "undo",
          outingId,
          participantId,
          timestamp: Date.now(),
          id: Math.random().toString(36).substring(7),
        });
        localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(queue));

        return { message: "Offline: Undo queued" };
      }
      throw error;
    }
  },

  /**
   * Sync offline data
   */
  async syncOfflineData(): Promise<{ synced: number; errors: number }> {
    const queueStr = localStorage.getItem(CHECKIN_QUEUE_KEY);
    if (!queueStr) return { synced: 0, errors: 0 };

    const queue: QueueItem[] = JSON.parse(queueStr);
    if (queue.length === 0) return { synced: 0, errors: 0 };

    console.log(`🔄 Syncing ${queue.length} offline actions...`);
    let synced = 0;
    let errors = 0;
    const remainingQueue: QueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === "checkin" && item.data) {
          await fetch(`${getApiBase()}/outings/${item.outingId}/checkin`, {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify(item.data),
          });
        } else if (item.type === "undo" && item.participantId) {
          await fetch(
            `${getApiBase()}/outings/${item.outingId}/checkin/${
              item.participantId
            }`,
            {
              method: "DELETE",
              headers: await getAuthHeaders(),
            }
          );
        }
        synced++;
      } catch (error) {
        console.error("Failed to sync item:", item, error);
        errors++;
        remainingQueue.push(item); // Keep failed items in queue
      }
    }

    localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(remainingQueue));
    return { synced, errors };
  },

  /**
   * Reset all check-ins for an outing
   */
  async resetAllCheckIns(
    outingId: string
  ): Promise<{ message: string; count: number }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/checkin`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<{ message: string; count: number }>(response);
  },

  /**
   * Export check-in data as CSV
   */
  async exportCheckInCSV(outingId: string): Promise<Blob> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/checkin/export`,
      {
        headers: await getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new APIError(response.status, "Failed to export check-in data");
    }
    return response.blob();
  },

  /**
   * Download CSV file
   */
  downloadCSV(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Requirements API
import type {
  OutingSuggestions,
  OutingRequirementCreate,
  OutingMeritBadgeCreate,
  OutingRequirement,
  OutingMeritBadge,
  RankRequirement,
  MeritBadge,
  PlaceCreate,
} from "../types";
import { PlacesService } from "../client/services/PlacesService";
import type { PlaceResponse } from "../client/models/PlaceResponse";

// Wrap generated PlacesService for consistency
export const placesAPI = {
  /**
   * Get all places with optional search filter
   */
  async getPlaces(search?: string): Promise<PlaceResponse[]> {
    return PlacesService.listPlacesApiPlacesGet(undefined, 100, search);
  },

  /**
   * Search places by name or address (for autocomplete)
   * Uses the general list endpoint with search param, which matches both fields.
   */
  async searchPlaces(
    query: string,
    limit: number = 10
  ): Promise<PlaceResponse[]> {
    // The listPlaces endpoint supports a search param that matches both name and address
    return PlacesService.listPlacesApiPlacesGet(undefined, limit, query);
  },

  /**
   * Get a specific place by ID
   */
  async getPlace(placeId: string): Promise<PlaceResponse> {
    return PlacesService.getPlaceApiPlacesPlaceIdGet(placeId);
  },

  /**
   * Create a new place
   */
  async createPlace(data: PlaceCreate): Promise<PlaceResponse> {
    return PlacesService.createPlaceApiPlacesPost(data as any);
  },

  /**
   * Update a place
   */
  async updatePlace(
    placeId: string,
    data: Partial<PlaceCreate>
  ): Promise<PlaceResponse> {
    return PlacesService.updatePlaceApiPlacesPlaceIdPut(placeId, data as any);
  },

  /**
   * Delete a place
   */
  async deletePlace(placeId: string): Promise<void> {
    return PlacesService.deletePlaceApiPlacesPlaceIdDelete(placeId);
  },
};

// Troops & Patrols API
export interface TroopCreate {
  number: string;
  charter_org?: string | null;
  meeting_location?: string | null;
  meeting_day?: string | null;
  notes?: string | null;
  treasurer_email?: string | null;
}
export interface TroopUpdate {
  charter_org?: string | null;
  meeting_location?: string | null;
  meeting_day?: string | null;
  notes?: string | null;
  treasurer_email?: string | null;
}
export interface PatrolCreate {
  troop_id: string;
  name: string;
  is_active?: boolean;
}
export interface PatrolUpdate {
  name?: string;
  is_active?: boolean;
}
export interface PatrolResponse {
  id: string;
  troop_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface TroopResponse {
  id: string;
  number: string;
  charter_org?: string | null;
  meeting_location?: string | null;
  meeting_day?: string | null;
  notes?: string | null;
  treasurer_email?: string | null;
  created_at: string;
  updated_at: string;
  patrols: PatrolResponse[];
}

export const troopAPI = {
  async getAll(): Promise<TroopResponse[]> {
    const response = await fetch(`${getApiBase()}/troops`, {
      headers: await getAuthHeaders(),
    });
    const data = await handleResponse<{
      troops: TroopResponse[];
      total: number;
    }>(response);
    return data.troops;
  },
  async getById(id: string): Promise<TroopResponse> {
    const response = await fetch(`${getApiBase()}/troops/${id}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<TroopResponse>(response);
  },
  async create(troop: TroopCreate): Promise<TroopResponse> {
    const response = await fetch(`${getApiBase()}/troops`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(troop),
    });
    return handleResponse<TroopResponse>(response);
  },
  async update(id: string, troop: TroopUpdate): Promise<TroopResponse> {
    const response = await fetch(`${getApiBase()}/troops/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(troop),
    });
    return handleResponse<TroopResponse>(response);
  },
  async delete(id: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/troops/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete troop");
    }
  },
};

export const patrolAPI = {
  async getByTroop(troopId: string): Promise<PatrolResponse[]> {
    const response = await fetch(`${getApiBase()}/troops/${troopId}/patrols`);
    const data = await handleResponse<{
      patrols: PatrolResponse[];
      total: number;
    }>(response);
    return data.patrols;
  },
  async create(patrol: PatrolCreate): Promise<PatrolResponse> {
    const response = await fetch(`${getApiBase()}/patrols`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(patrol),
    });
    return handleResponse<PatrolResponse>(response);
  },
  async update(id: string, patrol: PatrolUpdate): Promise<PatrolResponse> {
    const response = await fetch(`${getApiBase()}/patrols/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(patrol),
    });
    return handleResponse<PatrolResponse>(response);
  },
  async delete(id: string): Promise<void> {
    const response = await fetch(`${getApiBase()}/patrols/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete patrol");
    }
  },
};

export const requirementsAPI = {
  /**
   * Get suggestions for an outing based on keywords
   */
  async getSuggestions(
    outingId: string,
    minScore: number = 0.1,
    maxRequirements: number = 10,
    maxMeritBadges: number = 10
  ): Promise<OutingSuggestions> {
    const params = new URLSearchParams({
      min_score: minScore.toString(),
      max_requirements: maxRequirements.toString(),
      max_merit_badges: maxMeritBadges.toString(),
    });
    const response = await fetch(
      `${getApiBase()}/requirements/outings/${outingId}/suggestions?${params}`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<OutingSuggestions>(response);
  },

  /**
   * Get suggestions based on outing name and description (before creating outing)
   */
  async getPreviewSuggestions(
    outingName: string,
    description: string = ""
  ): Promise<OutingSuggestions> {
    let headers: HeadersInit | undefined;
    try {
      headers = await getAuthHeaders();
    } catch (authErr) {
      console.warn("Preview suggestions: auth unavailable", authErr);
      // Return empty suggestions so the UI shows the 'Suggestions
      // unavailable' fallback instead of a hard error (403).
      return {
        requirements: [],
        merit_badges: [],
      } as OutingSuggestions;
    }

    const response = await fetch(
      `${getApiBase()}/requirements/requirements/preview-suggestions`,
      {
        method: "POST",
        headers: {
          ...(headers as Record<string, string>),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: outingName,
          description: description,
        }),
      }
    );
    return handleResponse<OutingSuggestions>(response);
  },

  /**
   * Get all rank requirements
   */
  async getRankRequirements(
    rank?: string,
    category?: string
  ): Promise<RankRequirement[]> {
    const params = new URLSearchParams();
    if (rank) params.append("rank", rank);
    if (category) params.append("category", category);

    const response = await fetch(
      `${getApiBase()}/requirements/rank-requirements${
        params.toString() ? "?" + params : ""
      }`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<RankRequirement[]>(response);
  },

  /**
   * Get all merit badges
   */
  async getMeritBadges(): Promise<MeritBadge[]> {
    const response = await fetch(`${getApiBase()}/requirements/merit-badges`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<MeritBadge[]>(response);
  },

  /**
   * Get requirements for an outing
   */
  async getOutingRequirements(outingId: string): Promise<OutingRequirement[]> {
    const response = await fetch(
      `${getApiBase()}/requirements/outings/${outingId}/requirements`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<OutingRequirement[]>(response);
  },

  /**
   * Get merit badges for an outing
   */
  async getOutingMeritBadges(outingId: string): Promise<OutingMeritBadge[]> {
    const response = await fetch(
      `${getApiBase()}/requirements/outings/${outingId}/merit-badges`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<OutingMeritBadge[]>(response);
  },

  /**
   * Add a requirement to an outing
   */
  async addRequirementToOuting(
    outingId: string,
    data: OutingRequirementCreate
  ): Promise<OutingRequirement> {
    const response = await fetch(
      `${getApiBase()}/requirements/outings/${outingId}/requirements`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<OutingRequirement>(response);
  },

  /**
   * Add a merit badge to an outing
   */
  async addMeritBadgeToOuting(
    outingId: string,
    data: OutingMeritBadgeCreate
  ): Promise<OutingMeritBadge> {
    const response = await fetch(
      `${getApiBase()}/requirements/outings/${outingId}/merit-badges`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<OutingMeritBadge>(response);
  },

  /**
   * Remove a requirement from an outing
   */
  async removeRequirementFromOuting(
    outingRequirementId: string
  ): Promise<void> {
    const response = await fetch(
      `${getApiBase()}/requirements/outings/requirements/${outingRequirementId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<void>(response);
  },

  /**
   * Remove a merit badge from an outing
   */
  async removeMeritBadgeFromOuting(outingMeritBadgeId: string): Promise<void> {
    const response = await fetch(
      `${getApiBase()}/requirements/outings/merit-badges/${outingMeritBadgeId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<void>(response);
  },
};

// Packing List API
export const packingListAPI = {
  /**
   * Get all packing list templates
   */
  async getTemplates(): Promise<
    import("../types").PackingListTemplateListResponse
  > {
    const response = await fetch(`${getApiBase()}/packing-lists/templates`);
    return handleResponse<import("../types").PackingListTemplateListResponse>(
      response
    );
  },

  /**
   * Get a specific template with its items
   */
  async getTemplate(
    templateId: string
  ): Promise<import("../types").PackingListTemplateWithItems> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/templates/${templateId}`
    );
    return handleResponse<import("../types").PackingListTemplateWithItems>(
      response
    );
  },

  /**
   * Add a packing list to an outing (from template or blank)
   */
  async addToOuting(
    outingId: string,
    data: import("../types").OutingPackingListCreate
  ): Promise<import("../types").OutingPackingList> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/outings/${outingId}/packing-lists`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<import("../types").OutingPackingList>(response);
  },

  /**
   * Get all packing lists for an outing
   */
  async getOutingPackingLists(
    outingId: string
  ): Promise<import("../types").OutingPackingList[]> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/outings/${outingId}/packing-lists`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<import("../types").OutingPackingList[]>(response);
  },

  /**
   * Delete a packing list from an outing
   */
  async deleteOutingPackingList(
    outingId: string,
    packingListId: string
  ): Promise<void> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/outings/${outingId}/packing-lists/${packingListId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete packing list");
    }
  },

  /**
   * Add a custom item to a packing list
   */
  async addCustomItem(
    outingId: string,
    packingListId: string,
    item: import("../types").OutingPackingListItemCreate
  ): Promise<import("../types").OutingPackingListItem> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/outings/${outingId}/packing-lists/${packingListId}/items`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(item),
      }
    );
    return handleResponse<import("../types").OutingPackingListItem>(response);
  },

  /**
   * Update a packing list item (quantity, checked status, etc.)
   */
  async updateItem(
    outingId: string,
    itemId: string,
    updates: import("../types").OutingPackingListItemUpdate
  ): Promise<import("../types").OutingPackingListItem> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/outings/${outingId}/packing-lists/items/${itemId}`,
      {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify(updates),
      }
    );
    return handleResponse<import("../types").OutingPackingListItem>(response);
  },

  /**
   * Delete a packing list item
   */
  async deleteItem(outingId: string, itemId: string): Promise<void> {
    const response = await fetch(
      `${getApiBase()}/packing-lists/outings/${outingId}/packing-lists/items/${itemId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete item");
    }
  },
};

// Offline Data API
export const offlineAPI = {
  /**
   * Get all offline data in a single request
   * Returns user, outings, and rosters
   */
  async getBulkData(): Promise<{
    user: User;
    outings: Outing[];
    rosters: Record<string, SignupResponse[]>;
    last_updated: string;
  }> {
    const response = await fetch(`${getApiBase()}/offline/data`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// Grubmaster API
import type {
  EatingGroup,
  EatingGroupCreate,
  EatingGroupUpdate,
  GrubmasterSummaryResponse,
  MoveParticipantRequest,
  AutoAssignRequest,
  EatingGroupEmailRequest,
} from "../types";

export const grubmasterAPI = {
  /**
   * Get grubmaster summary for an outing
   */
  async getSummary(outingId: string): Promise<GrubmasterSummaryResponse> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/grubmaster`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<GrubmasterSummaryResponse>(response);
  },

  /**
   * Get all eating groups for an outing
   */
  async getEatingGroups(
    outingId: string
  ): Promise<{ eating_groups: EatingGroup[]; total: number }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/eating-groups`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<{ eating_groups: EatingGroup[]; total: number }>(
      response
    );
  },

  /**
   * Create a new eating group
   */
  async createEatingGroup(
    outingId: string,
    data: EatingGroupCreate
  ): Promise<EatingGroup> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/eating-groups`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<EatingGroup>(response);
  },

  /**
   * Update an eating group
   */
  async updateEatingGroup(
    outingId: string,
    eatingGroupId: string,
    data: EatingGroupUpdate
  ): Promise<EatingGroup> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/eating-groups/${eatingGroupId}`,
      {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<EatingGroup>(response);
  },

  /**
   * Delete an eating group
   */
  async deleteEatingGroup(
    outingId: string,
    eatingGroupId: string
  ): Promise<void> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/eating-groups/${eatingGroupId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete eating group");
    }
  },

  /**
   * Move a participant to a different eating group
   */
  async moveParticipant(
    outingId: string,
    request: MoveParticipantRequest
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/move-participant`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return handleResponse<{ message: string }>(response);
  },

  /**
   * Set or unset a participant as grubmaster
   */
  async setGrubmaster(
    outingId: string,
    participantId: string,
    isGrubmaster: boolean
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/set-grubmaster?participant_id=${participantId}&is_grubmaster=${isGrubmaster}`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<{ message: string }>(response);
  },

  /**
   * Auto-assign participants to eating groups
   */
  async autoAssign(
    outingId: string,
    request: AutoAssignRequest
  ): Promise<{ eating_groups: EatingGroup[]; total: number }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/auto-assign`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return handleResponse<{ eating_groups: EatingGroup[]; total: number }>(
      response
    );
  },

  /**
   * Generate email content for eating groups
   */
  async sendEatingGroupEmails(
    outingId: string,
    request: EatingGroupEmailRequest
  ): Promise<{
    message: string;
    outing_name: string;
    groups: Array<{
      eating_group_id: string;
      eating_group_name: string;
      grubmaster_emails: string[];
      subject: string;
      body: string;
      member_count: number;
    }>;
    treasurer_email?: string;
  }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/send-eating-group-emails`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return handleResponse(response);
  },
};

// Tenting API
import type {
  TentingGroup,
  TentingGroupCreate,
  TentingGroupUpdate,
  TentingSummaryResponse,
  MoveTentingParticipantRequest,
  AutoAssignTentingRequest,
  TentingValidationIssue,
} from "../types";

export const tentingAPI = {
  /**
   * Get tenting summary for an outing
   */
  async getSummary(outingId: string): Promise<TentingSummaryResponse> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/tenting`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<TentingSummaryResponse>(response);
  },

  /**
   * Validate all tenting assignments for an outing
   */
  async validateTenting(
    outingId: string,
    maxAgeDifference: number = 2
  ): Promise<TentingValidationIssue[]> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/tenting/validate?max_age_difference=${maxAgeDifference}`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<TentingValidationIssue[]>(response);
  },

  /**
   * Get all tenting groups for an outing
   */
  async getTentingGroups(
    outingId: string
  ): Promise<{ tenting_groups: TentingGroup[]; total: number }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/tenting-groups`,
      {
        headers: await getAuthHeaders(),
      }
    );
    return handleResponse<{ tenting_groups: TentingGroup[]; total: number }>(
      response
    );
  },

  /**
   * Create a new tenting group
   */
  async createTentingGroup(
    outingId: string,
    data: TentingGroupCreate
  ): Promise<TentingGroup> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/tenting-groups`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<TentingGroup>(response);
  },

  /**
   * Update a tenting group
   */
  async updateTentingGroup(
    outingId: string,
    tentingGroupId: string,
    data: TentingGroupUpdate
  ): Promise<TentingGroup> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/tenting-groups/${tentingGroupId}`,
      {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data),
      }
    );
    return handleResponse<TentingGroup>(response);
  },

  /**
   * Delete a tenting group
   */
  async deleteTentingGroup(
    outingId: string,
    tentingGroupId: string
  ): Promise<void> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/tenting-groups/${tentingGroupId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
      }
    );
    if (!response.ok) {
      throw new APIError(response.status, "Failed to delete tenting group");
    }
  },

  /**
   * Move a participant to a different tenting group
   */
  async moveParticipant(
    outingId: string,
    request: MoveTentingParticipantRequest
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/move-tenting-participant`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return handleResponse<{ message: string }>(response);
  },

  /**
   * Auto-assign scouts to tenting groups
   */
  async autoAssign(
    outingId: string,
    request: AutoAssignTentingRequest
  ): Promise<{ tenting_groups: TentingGroup[]; total: number }> {
    const response = await fetch(
      `${getApiBase()}/outings/${outingId}/auto-assign-tenting`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(request),
      }
    );
    return handleResponse<{ tenting_groups: TentingGroup[]; total: number }>(
      response
    );
  },
};

