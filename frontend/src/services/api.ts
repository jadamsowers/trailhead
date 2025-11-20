import {
    Trip,
    TripCreate,
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
    ParentRegistrationRequest,
    RegistrationResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Log API configuration on load
console.log('🔧 API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_BASE_URL,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
});

// Health check API
export const healthAPI = {
    async check(): Promise<{ status: string; message: string }> {
        const healthUrl = `${API_BASE_URL}/health`;
        console.log('🏥 Health Check:', {
            url: healthUrl,
            timestamp: new Date().toISOString(),
        });
        
        try {
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            console.log('✅ Health Check Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                url: response.url,
            });
            
            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Health Check Data:', data);
            return data;
        } catch (error) {
            console.error('❌ Health Check Error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                url: healthUrl,
                timestamp: new Date().toISOString(),
            });
            throw new Error('Unable to connect to backend server');
        }
    },
};

export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    console.log('📨 API Response:', {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
    });
    
    if (!response.ok) {
        const error: APIErrorResponse = await response.json().catch(() => ({
            detail: `HTTP ${response.status}: ${response.statusText}`
        }));
        console.error('❌ API Error:', {
            url: response.url,
            status: response.status,
            error: error.detail,
        });
        throw new APIError(response.status, error.detail);
    }
    return response.json();
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Trip API
export const tripAPI = {
    async getAll(): Promise<Trip[]> {
        const url = `${API_BASE_URL}/trips`;
        console.log('🚀 API Request: GET', url);
        const response = await fetch(url);
        const data = await handleResponse<{ trips: Trip[]; total: number }>(response);
        return data.trips;
    },

    async getAvailable(): Promise<Trip[]> {
        const url = `${API_BASE_URL}/trips/available`;
        console.log('🚀 API Request: GET', url);
        const response = await fetch(url);
        const data = await handleResponse<{ trips: Trip[]; total: number }>(response);
        return data.trips;
    },

    async getById(id: string): Promise<Trip> {
        const url = `${API_BASE_URL}/trips/${id}`;
        console.log('🚀 API Request: GET', url);
        const token = localStorage.getItem('access_token');
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse<Trip>(response);
    },

    async create(trip: TripCreate): Promise<Trip> {
        const url = `${API_BASE_URL}/trips`;
        console.log('🚀 API Request: POST', url, trip);
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(trip),
        });
        return handleResponse<Trip>(response);
    },

    async update(id: string, trip: Partial<TripCreate>): Promise<Trip> {
        const url = `${API_BASE_URL}/trips/${id}`;
        console.log('🚀 API Request: PUT', url, trip);
        const response = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(trip),
        });
        return handleResponse<Trip>(response);
    },

    async delete(id: string): Promise<void> {
        const url = `${API_BASE_URL}/trips/${id}`;
        console.log('🚀 API Request: DELETE', url);
        const token = localStorage.getItem('access_token');
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to delete trip');
        }
    },
};

// Signup API
export const signupAPI = {
    async create(signup: SignupCreate): Promise<SignupResponse> {
        const response = await fetch(`${API_BASE_URL}/signups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signup),
        });
        return handleResponse<SignupResponse>(response);
    },

    async getById(id: string): Promise<SignupWithDetails> {
        const response = await fetch(`${API_BASE_URL}/signups/${id}`);
        return handleResponse<SignupWithDetails>(response);
    },

    async getByTrip(tripId: string): Promise<SignupResponse[]> {
        const response = await fetch(`${API_BASE_URL}/trips/${tripId}/signups`, {
            headers: getAuthHeaders(),
        });
        const data = await handleResponse<{ signups: SignupResponse[]; total: number }>(response);
        return data.signups;
    },
};

// CSV API
export const csvAPI = {
    async importRoster(tripId: string, file: File): Promise<{ message: string; imported_count: number }> {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/csv/import?trip_id=${tripId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });
        return handleResponse<{ message: string; imported_count: number }>(response);
    },

    async exportRoster(tripId: string): Promise<Blob> {
        const response = await fetch(`${API_BASE_URL}/csv/trips/${tripId}/export-roster`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to export roster');
        }
        return response.blob();
    },

    async exportRosterPDF(tripId: string): Promise<Blob> {
        const response = await fetch(`${API_BASE_URL}/csv/trips/${tripId}/export-roster-pdf`, {
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to export roster PDF');
        }
        return response.blob();
    },

    downloadCSV(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    downloadPDF(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
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
     * Initiate OAuth flow - redirects to Keycloak
     */
    initiateLogin(redirectUri: string, state?: string): void {
        const stateParam = state || this.generateState();
        sessionStorage.setItem('oauth_state', stateParam);
        const url = `${API_BASE_URL}/oauth/authorize?redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateParam}`;
        window.location.href = url;
    },

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
        const response = await fetch(`${API_BASE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });
        return handleResponse<TokenResponse>(response);
    },

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const response = await fetch(`${API_BASE_URL}/oauth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        return handleResponse<TokenResponse>(response);
    },

    /**
     * Logout user
     */
    async logout(refreshToken: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/oauth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to logout');
        }
    },

    /**
     * Get current user info
     */
    async getCurrentUser(token: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/oauth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse<User>(response);
    },

    /**
     * Generate random state for CSRF protection
     */
    generateState(): string {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    /**
     * Verify state parameter
     */
    verifyState(state: string): boolean {
        const storedState = sessionStorage.getItem('oauth_state');
        sessionStorage.removeItem('oauth_state');
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
        const response = await fetch(`${API_BASE_URL}/register/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};

// Legacy Auth API (kept for backward compatibility with admin accounts)
export const authAPI = {
    async login(credentials: LoginRequest): Promise<TokenResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        return handleResponse<TokenResponse>(response);
    },

    async getCurrentUser(token: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse<User>(response);
    },

    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        return handleResponse<TokenResponse>(response);
    },

    async logout(token: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to logout');
        }
    },
};

// Family Management API
export const familyAPI = {
    /**
     * Get all family members for the current user
     */
    async getAll(): Promise<FamilyMemberListResponse> {
        const response = await fetch(`${API_BASE_URL}/family/`, {
            headers: getAuthHeaders(),
        });
        return handleResponse<FamilyMemberListResponse>(response);
    },

    /**
     * Get simplified list of family members for signup selection
     */
    async getSummary(): Promise<FamilyMemberSummary[]> {
        const response = await fetch(`${API_BASE_URL}/family/summary`, {
            headers: getAuthHeaders(),
        });
        return handleResponse<FamilyMemberSummary[]>(response);
    },

    /**
     * Get a specific family member by ID
     */
    async getById(id: string): Promise<FamilyMember> {
        const response = await fetch(`${API_BASE_URL}/family/${id}`, {
            headers: getAuthHeaders(),
        });
        return handleResponse<FamilyMember>(response);
    },

    /**
     * Create a new family member
     */
    async create(member: FamilyMemberCreate): Promise<FamilyMember> {
        const response = await fetch(`${API_BASE_URL}/family/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(member),
        });
        return handleResponse<FamilyMember>(response);
    },

    /**
     * Update an existing family member
     */
    async update(id: string, member: FamilyMemberUpdate): Promise<FamilyMember> {
        const response = await fetch(`${API_BASE_URL}/family/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(member),
        });
        return handleResponse<FamilyMember>(response);
    },

    /**
     * Delete a family member
     */
    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/family/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to delete family member');
        }
    },
};
