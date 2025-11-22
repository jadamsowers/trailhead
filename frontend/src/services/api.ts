import {
    Outing,
    OutingCreate,
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
} from '../types';

// Extend Window interface for Clerk
declare global {
    interface Window {
        Clerk?: any;
    }
}

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

// Helper function to get auth headers with Clerk token
async function getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    
    try {
        // Wait for Clerk to be loaded with retry logic
        let retries = 0;
        const maxRetries = 10;
        while (!window.Clerk && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }
        
        if (!window.Clerk) {
            console.error('❌ Clerk is not loaded after retries');
            throw new Error('Authentication system not initialized. Please refresh the page.');
        }
        
        // Check if user is signed in
        if (!window.Clerk.session) {
            console.error('❌ No Clerk session found');
            throw new Error('You must be signed in to access this feature. Please sign in and try again.');
        }
        
        // Get the session token from Clerk
        const token = await window.Clerk.session.getToken();
        if (!token) {
            console.error('❌ Failed to get Clerk session token');
            throw new Error('Failed to get authentication token. Please sign out and sign in again.');
        }
        
        console.log('✅ Using Clerk session token');
        headers['Authorization'] = `Bearer ${token}`;
        return headers;
        
    } catch (error) {
        console.error('❌ Authentication error:', error);
        throw error;
    }
}

// Outing API
export const outingAPI = {
    async getAll(): Promise<Outing[]> {
        const url = `${API_BASE_URL}/outings`;
        console.log('🚀 API Request: GET', url);
        const response = await fetch(url);
        const data = await handleResponse<{ outings: Outing[]; total: number }>(response);
        return data.outings;
    },

    async getAvailable(): Promise<Outing[]> {
        const url = `${API_BASE_URL}/outings/available`;
        console.log('🚀 API Request: GET', url);
        const response = await fetch(url);
        const data = await handleResponse<{ outings: Outing[]; total: number }>(response);
        return data.outings;
    },

    async getById(id: string): Promise<Outing> {
        const url = `${API_BASE_URL}/outings/${id}`;
        console.log('🚀 API Request: GET', url);
        const response = await fetch(url, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<Outing>(response);
    },

    async create(outing: OutingCreate): Promise<Outing> {
        const url = `${API_BASE_URL}/outings`;
        console.log('🚀 API Request: POST', url, outing);
        const response = await fetch(url, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(outing),
        });
        return handleResponse<Outing>(response);
    },

    async update(id: string, outing: Partial<OutingCreate>): Promise<Outing> {
        const url = `${API_BASE_URL}/outings/${id}`;
        console.log('🚀 API Request: PUT', url, outing);
        const response = await fetch(url, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(outing),
        });
        return handleResponse<Outing>(response);
    },

    async delete(id: string): Promise<void> {
        const url = `${API_BASE_URL}/outings/${id}`;
        console.log('🚀 API Request: DELETE', url);
        const response = await fetch(url, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to delete outing');
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

    async getByOuting(outingId: string): Promise<SignupResponse[]> {
        const response = await fetch(`${API_BASE_URL}/outings/${outingId}/signups`, {
            headers: await getAuthHeaders(),
        });
        const data = await handleResponse<{ signups: SignupResponse[]; total: number }>(response);
        return data.signups;
    },
    async getEmails(outingId: string): Promise<{ emails: string[]; count: number }> {
        const response = await fetch(`${API_BASE_URL}/signups/outings/${outingId}/emails`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<{ emails: string[]; count: number }>(response);
    },

    async sendEmail(outingId: string, emailData: {
        subject: string;
        message: string;
        from_email: string;
    }): Promise<{
        message: string;
        recipient_count: number;
        recipients: string[];
        subject: string;
        body: string;
        from: string;
        outing_name: string;
        note: string;
    }> {
        const response = await fetch(`${API_BASE_URL}/signups/outings/${outingId}/send-email`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(emailData),
        });
        return handleResponse(response);
    },
};

// PDF Export API
export const pdfAPI = {
    async exportRosterPDF(outingId: string): Promise<Blob> {
        const response = await fetch(`${API_BASE_URL}/signups/outings/${outingId}/export-pdf`, {
            headers: await getAuthHeaders(),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to export roster PDF');
        }
        return response.blob();
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
     * Initiate OAuth flow
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

    async checkSetupStatus(): Promise<{ setup_complete: boolean }> {
        const response = await fetch(`${API_BASE_URL}/auth/setup-status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return handleResponse<{ setup_complete: boolean }>(response);
    },

    async setupAdmin(data: {
        email: string;
        password: string;
        full_name: string;
    }): Promise<{ message: string; user_id: string }> {
        const response = await fetch(`${API_BASE_URL}/auth/setup-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        return handleResponse<{ message: string; user_id: string }>(response);
    },
};

// Family Management API
export const familyAPI = {
    /**
     * Get all family members for the current user
     */
    async getAll(): Promise<FamilyMemberListResponse> {
        const url = `${API_BASE_URL}/family/`;
        console.log('🚀 API Request: GET', url);
        
        const headers = await getAuthHeaders();
        const authHeader = (headers as Record<string, string>)['Authorization'];
        console.log('🔑 Auth headers:', {
            hasAuth: !!authHeader,
            authType: authHeader?.split(' ')[0]
        });
        
        const response = await fetch(url, { headers });
        return handleResponse<FamilyMemberListResponse>(response);
    },

    /**
     * Get simplified list of family members for signup selection
     */
    async getSummary(): Promise<FamilyMemberSummary[]> {
        const response = await fetch(`${API_BASE_URL}/family/summary`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<FamilyMemberSummary[]>(response);
    },

    /**
     * Get a specific family member by ID
     */
    async getById(id: string): Promise<FamilyMember> {
        const response = await fetch(`${API_BASE_URL}/family/${id}`, {
            headers: await getAuthHeaders(),
        });
        return handleResponse<FamilyMember>(response);
    },

    /**
     * Create a new family member
     */
    async create(member: FamilyMemberCreate): Promise<FamilyMember> {
        const response = await fetch(`${API_BASE_URL}/family/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
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
            headers: await getAuthHeaders(),
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
            headers: await getAuthHeaders(),
        });
        if (!response.ok) {
            throw new APIError(response.status, 'Failed to delete family member');
        }
    },
};

// User API (Clerk-based)
export const userAPI = {
    /**
     * Get current user information including contact details
     */
    async getCurrentUser(): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
        const response = await fetch(`${API_BASE_URL}/auth/me/contact`, {
            method: 'PATCH',
            headers: await getAuthHeaders(),
            body: JSON.stringify(contactInfo),
        });
        return handleResponse<User>(response);
    },
};
