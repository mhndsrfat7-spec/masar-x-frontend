"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";

interface LanguageState {
  locale: Locale;
  dir: Direction;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      locale: "ar",
      dir: "rtl",
      hydrated: false,

      setLocale: (locale) => {
        const dir: Direction = locale === "ar" ? "rtl" : "ltr";
        if (typeof document !== "undefined") {
          document.documentElement.lang = locale;
          document.documentElement.dir = dir;
        }
        set({ locale, dir });
      },

      toggleLocale: () => {
        const nextLocale: Locale = get().locale === "ar" ? "en" : "ar";
        get().setLocale(nextLocale);
      },
    }),
    {
      name: "masarx-language",
      partialize: (s) => ({ locale: s.locale, dir: s.dir }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          const dir: Direction = state.locale === "ar" ? "rtl" : "ltr";
          state.dir = dir;
          if (typeof document !== "undefined") {
            document.documentElement.lang = state.locale;
            document.documentElement.dir = dir;
          }
        }
      },
    }
  )
);

/** Non-React helper to read the active locale anywhere (e.g. formatters). */
export function getCurrentLocale(): Locale {
  try {
    return useLanguageStore.getState().locale ?? "ar";
  } catch {
    return "ar";
  }
}

export function getCurrentDir(): Direction {
  return getCurrentLocale() === "ar" ? "rtl" : "ltr";
}
