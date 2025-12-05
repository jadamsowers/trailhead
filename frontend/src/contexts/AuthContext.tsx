import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authAPI } from "../services/api";
import { getApiBase } from "../utils/apiBase";
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
  // Backwards-compat: some components expect `isLoading` and `error` from
  // the previous OIDC client context. Provide aliases to avoid runtime errors
  // during migration.
  isLoading: boolean;
  error?: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    // Check for existing token or session
    const checkAuth = async () => {
      try {
        const resp = await fetch(`${getApiBase()}/auth/me`, {
          credentials: "include",
        });
        if (resp.ok) {
          const userData = await resp.json();
          const normalized = normalizeUserResponse(userData);
          const withProfile = augmentWithLegacyProfile(normalized);
          setUser(withProfile as any);
          localStorage.setItem("cached_user", JSON.stringify(withProfile));
          setError(null);
        } else {
          const cachedUser = localStorage.getItem("cached_user");
          if (cachedUser) setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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

  const login = async (email: string, password: string) => {
    // Legacy login for admin accounts
    const response = await authAPI.login({ email, password });
    localStorage.setItem("access_token", response.access_token);
    if (response.refresh_token) {
      localStorage.setItem("refresh_token", response.refresh_token);
    }

    const userData = await authAPI.getCurrentUser(response.access_token);
    // authAPI may return the backend user shape; normalize and augment for legacy components
    const normalized = normalizeUserResponse(userData as any);
    const withProfile = augmentWithLegacyProfile(normalized);
    setUser(withProfile as any);
    localStorage.setItem("cached_user", JSON.stringify(withProfile));
  };

  const loginWithOAuth = () => {
    // Redirect to backend login endpoint which starts the OIDC flow
    window.location.href = `${getApiBase()}/auth/login`;
  };

  const logout = async () => {
    try {
      await fetch(`${getApiBase()}/auth/logout`, { credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
    }
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
        isLoading: loading,
        error,
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

// Provide a helper that returns a user object compatible with older
// components that expect an OIDC-style `user.profile` shape. This keeps the
// migration incremental: components can keep using `user.profile.name` and
// `user.profile.email` until we update them to the normalized fields.
export const augmentWithLegacyProfile = (u: User) => {
  return {
    ...u,
    profile: {
      name: u.full_name || u.email,
      email: u.email,
    },
  } as User & { profile: { name?: string; email?: string } };
};
