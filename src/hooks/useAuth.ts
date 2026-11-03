"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi, isDemoMode } from "@/lib/api/services";
import type { AccountType, AuthSession, UserProfile } from "@/types/api";
import { ApiClientError } from "@/lib/api/client";
import { useRouterStore } from "@/store/routerStore";
import { tStatic } from "@/i18n";

/** UI-friendly alias — convert from MERCHANT/INDIVIDUAL to merchant/customer. */
export type UiAccountType = "merchant" | "customer";

export function toUiType(t?: AccountType | string | null): UiAccountType {
  const v = String(t ?? "").toUpperCase();
  return v === "INDIVIDUAL" || v === "CUSTOMER" ? "customer" : "merchant";
}

export function toApiType(t: UiAccountType): AccountType {
  return t === "customer" ? "INDIVIDUAL" : "MERCHANT";
}

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const update = useAuthStore((s) => s.update);
  const navigate = useRouterStore((s) => s.navigate);

  const token = session?.accessToken ?? null;

  // Fetch current user when token changes.
  useEffect(() => {
    let cancelled = false;
    if (token && !user) {
      authApi
        .me(token)
        .then((u) => {
          if (!cancelled) setUser(u);
        })
        .catch(() => {
          /* ignore on initial hydration */
        });
    }
    return () => {
      cancelled = true;
    };
  }, [token, user, setUser]);

  const requestOtp = useCallback(
    (phone: string, accountType: UiAccountType) => {
      return authApi.requestOtp(phone, toApiType(accountType));
    },
    []
  );

  const acceptSession = useCallback(
    (resp: AuthSession, phone: string, accountType: UiAccountType) => {
      const accessToken = resp.accessToken;
      if (!accessToken) {
        throw new ApiClientError({
          status: 500,
          code: "no_token",
          message: tStatic("auth.errors.noAccessTokenReceived"),
        });
      }
      const apiAccountType = resp.accountType ?? toApiType(accountType);
      setSession({
        accessToken,
        refreshToken: resp.refreshToken,
        accountType: apiAccountType,
        phone: resp.phone ?? phone,
      });
      const legacyResponse = resp as AuthSession & Partial<UserProfile>;
      const profile = resp.user ?? {
        id: legacyResponse.id,
        name: legacyResponse.name,
        fullName: legacyResponse.fullName,
        email: legacyResponse.email,
        role: legacyResponse.role,
        status: legacyResponse.status,
      };
      setUser({
        ...profile,
        phone: profile.phone ?? resp.phone ?? phone,
        accountType: profile.accountType ?? apiAccountType,
      });
      navigate("dashboard");
      return resp;
    },
    [setSession, setUser, navigate]
  );

  const verifyOtp = useCallback(
    async (phone: string, code: string, accountType: UiAccountType) => {
      const resp = await authApi.verifyOtp(phone, code, toApiType(accountType));
      return acceptSession(resp as AuthSession, phone, accountType);
    },
    [acceptSession]
  );

  /**
   * Uses the real password-login contract when the backend has deployed it.
   * For backward compatibility only, an explicitly missing/unavailable route
   * falls back to the existing OTP flow; invalid credentials never do.
   */
  const loginWithPassword = useCallback(
    async (phone: string, password: string, accountType: UiAccountType) => {
      if (isDemoMode()) {
        const resp = await authApi.login({ phone, password, accountType: toApiType(accountType) });
        return acceptSession(resp, phone, accountType);
      }
      try {
        const resp = await authApi.login({ phone, password, accountType: toApiType(accountType) });
        return acceptSession(resp, phone, accountType);
      } catch (error) {
        const missingPasswordEndpoint = error instanceof ApiClientError &&
          (error.status === 404 || error.status === 405 || error.status === 501 || error.code === "PASSWORD_LOGIN_NOT_CONFIGURED");
        if (!missingPasswordEndpoint) throw error;
        await authApi.requestOtp(phone, toApiType(accountType));
        throw new ApiClientError({
          status: 202,
          code: "OTP_REQUIRED",
          message: tStatic("auth.errors.passwordLoginNotEnabledFallback"),
        });
      }
    },
    [acceptSession]
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        /* ignore */
      }
    }
    clear();
    navigate("login");
  }, [token, clear, navigate]);

  const completeProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!token) throw new Error("not_authenticated");
      const updated = await authApi.updateMe(token, patch);
      update(updated);
      return updated;
    },
    [token, update]
  );

  return {
    session,
    user,
    token,
    hydrated,
    isAuthenticated: !!session?.accessToken,
    accountType: toUiType(session?.accountType),
    requestOtp,
    verifyOtp,
    loginWithPassword,
    logout,
    completeProfile,
  };
}
