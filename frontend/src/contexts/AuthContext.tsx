import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";
import { oauthAPI, authAPI } from "../services/api";
import type { UserResponse as AuthUserResponse } from "../client/models/UserResponse";
import { User } from "../types";

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
  const oidcAuth = useOidcAuth();

  useEffect(() => {
    // Check for existing token or session
    const checkAuth = async () => {
      try {
        const token = oidcAuth.user?.access_token;
        if (token) {
          await verifyToken(token);
        } else {
          // If no token, try to load cached user
          const cachedUser = localStorage.getItem("cached_user");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setLoading(false);
      }
    };

    checkAuth();
  }, [oidcAuth.user]);

  // Always cache user object when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("cached_user", JSON.stringify(user));
      console.debug("Cached user updated:", user);
    } else {
      localStorage.removeItem("cached_user");
      console.debug("Cached user removed");
    }
  }, [user]);

  const verifyToken = async (_token: string) => {
    try {
      // Fetch user from backend using Authentik authenticated endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to verify token");
      }
      
      const userData = await response.json();
      const normalized = normalizeUserResponse(userData);
      setUser(normalized);
      localStorage.setItem("cached_user", JSON.stringify(normalized));
    } catch (error) {
      console.error("Token verification via Authentik failed:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Legacy login for admin accounts
    const response = await authAPI.login({ email, password });
    localStorage.setItem("access_token", response.access_token);
    if (response.refresh_token) {
      localStorage.setItem("refresh_token", response.refresh_token);
    }

    const userData = await authAPI.getCurrentUser(response.access_token);
    setUser(userData);
    localStorage.setItem("cached_user", JSON.stringify(userData));
  };

  const loginWithOAuth = () => {
    // Open Authentik sign-in
    oidcAuth.signinRedirect();
  };

  const logout = async () => {
    try {
      await oidcAuth.signoutRedirect();
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("cached_user");
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
        isAdmin: user?.role === "admin",
        isParent: user?.role === "adult",
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
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Convert user response to app's User type
const normalizeUserResponse = (u: AuthUserResponse): User => {
  const allowedRoles: Array<User["role"]> = [
    "admin",
    "outing-admin",
    "adult",
    "participant",
  ];
  const role = allowedRoles.includes(u.role as User["role"])
    ? (u.role as User["role"])
    : "participant";
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    role,
    is_initial_admin: u.is_initial_admin,
    initial_setup_complete: (u as any).initial_setup_complete ?? false,
    phone: u.phone ?? undefined,
    emergency_contact_name: u.emergency_contact_name ?? undefined,
    emergency_contact_phone: u.emergency_contact_phone ?? undefined,
    youth_protection_expiration: (u as any).youth_protection_expiration
      ? String((u as any).youth_protection_expiration)
      : undefined,
  };
};

