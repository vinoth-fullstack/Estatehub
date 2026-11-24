"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PUBLIC_API_URL } from "@/lib/config";
import { toApiError } from "@/lib/apiError";
import { clientFetch, refreshSession } from "@/lib/clientApi";
import { setAccessToken, setSessionExpiredHandler } from "@/lib/tokenStore";
import type { User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; phone?: string; }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: { name?: string; email?: string; phone?: string | null; currentPassword?: string; }) => Promise<User>;
  updateAvatar: (file: File) => Promise<User>;
  removeAvatar: () => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function authenticate(path: string, body: unknown): Promise<User> {
  const response = await fetch(`${PUBLIC_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await toApiError(response);
  const session = (await response.json()) as { user: User; accessToken: string; };
  setAccessToken(session.accessToken);
  return session.user;
}

export function AuthProvider({ children }: { children: ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    refreshSession().then((session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setStatus(session ? "authenticated" : "anonymous");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await authenticate("/api/auth/login", { email, password }));
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string; phone?: string; }) => {
    setUser(await authenticate("/api/auth/register", input));
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await clientFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const updateProfile = useCallback(async (input: { name?: string; email?: string; phone?: string | null; currentPassword?: string; }) => {
    const response = await clientFetch<{ user: User; }>("/api/auth/me", { method: "PATCH", body: input });
    setUser(response.user);
    return response.user;
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    const formData = new FormData(); formData.append("images", file);
    const response = await clientFetch<{ user: User; }>("/api/auth/me/avatar", { method: "POST", formData });
    setUser(response.user); return response.user;
  }, []);
  const removeAvatar = useCallback(async () => {
    const response = await clientFetch<{ user: User; }>("/api/auth/me/avatar", { method: "DELETE" });
    setUser(response.user); return response.user;
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout, updateProfile, updateAvatar, removeAvatar }), [user, status, login, register, logout, updateProfile, updateAvatar, removeAvatar]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
