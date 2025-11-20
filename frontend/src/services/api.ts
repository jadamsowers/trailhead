import {
    Trip,
    TripCreate,
    SignupCreate,
    SignupResponse,
    SignupWithDetails,
    LoginRequest,
    TokenResponse,
    User,
    APIError as APIErrorResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error: APIErrorResponse = await response.json().catch(() => ({
            detail: `HTTP ${response.status}: ${response.statusText}`
        }));
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
        const response = await fetch(`${API_BASE_URL}/trips`);
        const data = await handleResponse<{ trips: Trip[]; total: number }>(response);
        return data.trips;
    },

    async getAvailable(): Promise<Trip[]> {
        const response = await fetch(`${API_BASE_URL}/trips/available`);
        const data = await handleResponse<{ trips: Trip[]; total: number }>(response);
        return data.trips;
    },

    async getById(id: string): Promise<Trip> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse<Trip>(response);
    },

    async create(trip: TripCreate): Promise<Trip> {
        const response = await fetch(`${API_BASE_URL}/trips`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(trip),
        });
        return handleResponse<Trip>(response);
    },

    async update(id: string, trip: Partial<TripCreate>): Promise<Trip> {
        const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(trip),
        });
        return handleResponse<Trip>(response);
    },

    async delete(id: string): Promise<void> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
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
};

// Auth API (placeholder - will be implemented when backend auth endpoints are ready)
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
