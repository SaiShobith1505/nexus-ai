"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_RETURN_KEY } from "@/lib/auth/constants";
import { authDebug } from "@/lib/auth/debug";
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken
} from "@/lib/auth/token";
import type { AuthUser } from "@/lib/api-types";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  consumeReturnPath: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();
    setTokenState(storedToken);
    setUser(storedUser);
    setIsHydrated(true);
    authDebug("provider", "hydrated", {
      tokenPresent: Boolean(storedToken),
      tokenLength: storedToken?.length ?? 0,
      userPresent: Boolean(storedUser)
    });
  }, []);

  const setSession = useCallback((accessToken: string, nextUser: AuthUser) => {
    setToken(accessToken);
    setStoredUser(nextUser);
    setTokenState(accessToken.trim());
    setUser(nextUser);
    authDebug("provider", "setSession", { tokenPresent: true });
  }, []);

  const clearSession = useCallback(() => {
    clearAuthStorage();
    setTokenState(null);
    setUser(null);
    authDebug("provider", "clearSession");
  }, []);

  const consumeReturnPath = useCallback(() => {
    if (typeof window === "undefined") return null;
    const fromQuery = new URLSearchParams(window.location.search).get("return");
    const fromStorage = sessionStorage.getItem(AUTH_RETURN_KEY);
    const path = fromQuery ?? fromStorage;
    sessionStorage.removeItem(AUTH_RETURN_KEY);
    return path;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isHydrated,
      setSession,
      clearSession,
      consumeReturnPath
    }),
    [token, user, isHydrated, setSession, clearSession, consumeReturnPath]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
