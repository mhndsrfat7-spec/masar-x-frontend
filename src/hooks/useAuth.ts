"use client";

import { useCallback, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/services";
import type { AccountType, UserProfile } from "@/types/api";
import { ApiClientError } from "@/lib/api/client";
import { useRouterStore } from "@/store/routerStore";
import { isDemoMode } from "@/lib/api/services";

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

  const verifyOtp = useCallback(
    async (phone: string, code: string, accountType: UiAccountType) => {
      const resp = await authApi.verifyOtp(phone, code, toApiType(accountType));
      const accessToken = (resp as { accessToken?: string }).accessToken;
      if (!accessToken) {
        throw new ApiClientError({
          status: 500,
          code: "no_token",
          message: "لم يتم استلام رمز الوصول من الخادم",
        });
      }
      const newSession = {
        accessToken,
        refreshToken: (resp as { refreshToken?: string }).refreshToken,
        accountType: toApiType(accountType),
        phone,
      };
      setSession(newSession);
      const me: UserProfile = {
        id: (resp as { id?: string }).id,
        name: (resp as { name?: string }).name,
        fullName: (resp as { fullName?: string }).fullName,
        phone,
        email: (resp as { email?: string }).email,
        accountType: toApiType(accountType),
      };
      setUser(me);
      navigate("dashboard");
      return resp;
    },
    [setSession, setUser, navigate]
  );

  /**
   * Demo-mode login helper — accepts phone + any password and
   * short-circuits to the mock verifyOtp with code "1234".
   *
   * NOTE: In real mode, the backend does NOT expose a password
   * login endpoint for merchants yet (only OTP). When a password
   * endpoint is added (see BACKEND_NOTES.md), swap this for a
   * direct password call.
   */
  const loginWithPassword = useCallback(
    async (phone: string, _password: string, accountType: UiAccountType) => {
      if (isDemoMode()) {
        // Demo: skip OTP, go straight to verify with 1234
        return verifyOtp(phone, "1234", accountType);
      }
      // Real: send OTP first, let UI prompt for the code.
      // This is a fallback until the backend exposes a password endpoint.
      await authApi.requestOtp(phone, toApiType(accountType));
      throw new ApiClientError({
        status: 202,
        code: "OTP_REQUIRED",
        message: "تم إرسال رمز تحقق إلى رقم جوالك. الرجاء إدخاله.",
      });
    },
    [verifyOtp]
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
