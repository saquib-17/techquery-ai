import * as React from "react";
import { api, setAccessToken } from "@/lib/api";
import {
  loginApi,
  registerApi,
  verifyEmailApi,
  resendVerificationApi,
  refreshApi,
  logoutApi,
  logoutAllApi,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResponse,
  type VerifyEmailResponse,
  type MessageResponse,
} from "./auth.api";

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  verifyEmail: (token: string) => Promise<VerifyEmailResponse>;
  resendVerification: (email: string) => Promise<MessageResponse>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function decodeJwtClaims(token: string): {
  userId?: string;
  role?: "CANDIDATE" | "ADMIN";
  tier?: "FREE" | "PRO";
} {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const parsed = JSON.parse(json) as {
      sub?: string;
      userId?: string;
      role?: "CANDIDATE" | "ADMIN";
      tier?: "FREE" | "PRO";
    };
    return {
      userId: parsed.sub || parsed.userId,
      role: parsed.role,
      tier: parsed.tier,
    };
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [accessToken, setTokenState] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState<boolean>(true);

  const applyAccessToken = React.useCallback((token: string | null) => {
    setAccessToken(token);
    setTokenState(token);
  }, []);

  // Silent session restoration via HttpOnly refresh cookie on initial mount
  React.useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { accessToken: refreshedToken } = await refreshApi();
        if (cancelled) return;

        applyAccessToken(refreshedToken);
        const claims = decodeJwtClaims(refreshedToken);

        let restoredName = "Candidate";
        try {
          const profileRes = await api.get<{
            success: boolean;
            data: { profile?: { fullName?: string } };
          }>("/profile");
          if (profileRes.data?.data?.profile?.fullName) {
            restoredName = profileRes.data.data.profile.fullName;
          }
        } catch {
          // Profile may not be created yet (pre-onboarding); fallback safely
        }

        if (!cancelled) {
          setUser({
            id: claims.userId ?? "",
            name: restoredName,
            email: "",
            role: claims.role ?? "CANDIDATE",
            tier: claims.tier ?? "FREE",
            isVerified: true,
          });
        }
      } catch {
        if (!cancelled) {
          applyAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [applyAccessToken]);

  // Listen for forced session expiration events from Axios interceptor
  React.useEffect(() => {
    const handleSessionExpired = () => {
      applyAccessToken(null);
      setUser(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, [applyAccessToken]);

  const login = React.useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      const data = await loginApi(payload);
      applyAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [applyAccessToken]
  );

  const register = React.useCallback(
    async (payload: RegisterPayload): Promise<RegisterResponse> => {
      return registerApi(payload);
    },
    []
  );

  const verifyEmail = React.useCallback(
    async (token: string): Promise<VerifyEmailResponse> => {
      return verifyEmailApi({ token });
    },
    []
  );

  const resendVerification = React.useCallback(
    async (email: string): Promise<MessageResponse> => {
      return resendVerificationApi({ email });
    },
    []
  );

  const logout = React.useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      applyAccessToken(null);
      setUser(null);
    }
  }, [applyAccessToken]);

  const logoutAll = React.useCallback(async () => {
    try {
      await logoutAllApi();
    } finally {
      applyAccessToken(null);
      setUser(null);
    }
  }, [applyAccessToken]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      logoutAll,
    }),
    [
      user,
      accessToken,
      isInitializing,
      login,
      register,
      verifyEmail,
      resendVerification,
      logout,
      logoutAll,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
