import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { oauthAPI, authAPI } from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    loginWithOAuth: () => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isParent: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (code && state) {
            // OAuth callback - exchange code for tokens
            handleOAuthCallback(code, state);
        } else if (accessToken && refreshToken) {
            // Direct token in URL (from backend redirect)
            handleOAuthTokens(accessToken, refreshToken);
        } else {
            // Check for existing token
            const token = localStorage.getItem('access_token');
            if (token && navigator.onLine) {
                verifyToken(token);
            } else {
                // If offline, try to load cached user
                const cachedUser = localStorage.getItem('cached_user');
                if (cachedUser) {
                    setUser(JSON.parse(cachedUser));
                }
                setLoading(false);
            }
        }
    }, []);

    // Always cache user object when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('cached_user', JSON.stringify(user));
            console.debug('Cached user updated:', user);
        } else {
            localStorage.removeItem('cached_user');
            console.debug('Cached user removed');
        }
    }, [user]);

    const verifyToken = async (token: string) => {
        try {
            // Try OAuth endpoint first, fall back to legacy
            try {
                const userData = await oauthAPI.getCurrentUser(token);
                setUser(userData);
                localStorage.setItem('cached_user', JSON.stringify(userData));
            } catch {
                const userData = await authAPI.getCurrentUser(token);
                setUser(userData);
                localStorage.setItem('cached_user', JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            // Try to refresh token
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    await refreshAccessToken(refreshToken);
                } catch {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('cached_user');
                    setLoading(false);
                }
            } else {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('cached_user');
                setLoading(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthCallback = async (code: string, state: string) => {
        if (!oauthAPI.verifyState(state)) {
            console.error('Invalid state parameter');
            setLoading(false);
            return;
        }

        try {
            const redirectUri = `${window.location.origin}${window.location.pathname}`;
            const response = await oauthAPI.exchangeCode(code, redirectUri);
            handleOAuthTokens(response.access_token, response.refresh_token || '');
        } catch (error) {
            console.error('OAuth callback failed:', error);
            setLoading(false);
        }
    };

    const handleOAuthTokens = async (accessToken: string, refreshToken: string) => {
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
        }
        
        // Get user info
        const userData = await oauthAPI.getCurrentUser(accessToken);
        setUser(userData);
        localStorage.setItem('cached_user', JSON.stringify(userData));
        setLoading(false);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    };

    const refreshAccessToken = async (refreshToken: string) => {
        try {
            const response = await oauthAPI.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
            }
            const userData = await oauthAPI.getCurrentUser(response.access_token);
            setUser(userData);
            localStorage.setItem('cached_user', JSON.stringify(userData));
            return response;
        } catch {
            // Try legacy refresh
            const response = await authAPI.refreshToken(refreshToken);
            localStorage.setItem('access_token', response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('refresh_token', response.refresh_token);
            }
            const userData = await authAPI.getCurrentUser(response.access_token);
            setUser(userData);
            localStorage.setItem('cached_user', JSON.stringify(userData));
            return response;
        }
    };

    const login = async (email: string, password: string) => {
        // Legacy login for admin accounts
        const response = await authAPI.login({ email, password });
        localStorage.setItem('access_token', response.access_token);
        if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
        }
        
        const userData = await authAPI.getCurrentUser(response.access_token);
        setUser(userData);
        localStorage.setItem('cached_user', JSON.stringify(userData));
    };

    const loginWithOAuth = () => {
        const redirectUri = `${window.location.origin}/auth/callback`;
        oauthAPI.initiateLogin(redirectUri);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                await oauthAPI.logout(refreshToken);
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('cached_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                loginWithOAuth,
                logout,
                isAuthenticated: !!user,
                isAdmin: user?.role === 'admin',
                isParent: user?.role === 'adult',
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};