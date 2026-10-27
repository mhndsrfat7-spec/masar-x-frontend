"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccountType, AuthSession, UserProfile } from "@/types/api";

interface AuthState {
  session: AuthSession | null;
  user: UserProfile | null;
  hydrated: boolean;

  setSession: (s: AuthSession | null) => void;
  setUser: (u: UserProfile | null) => void;
  setAccountType: (t: AccountType) => void;
  update: (patch: Partial<UserProfile>) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      hydrated: false,

      setSession: (s) => set({ session: s }),
      setUser: (u) => set({ user: u }),
      setAccountType: (t) =>
        set((st) => ({
          session: st.session
            ? { ...st.session, accountType: t }
            : st.session,
        })),
      update: (patch) =>
        set((st) => ({
          user: st.user ? { ...st.user, ...patch } : st.user,
        })),
      clear: () => set({ session: null, user: null }),
    }),
    {
      name: "masarx-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    }
  )
);

export const selectToken = (s: AuthState) => s.session?.accessToken ?? null;
export const selectIsAuthed = (s: AuthState) => !!s.session?.accessToken;
