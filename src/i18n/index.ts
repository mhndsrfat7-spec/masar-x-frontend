"use client";

import { useCallback, useEffect } from "react";
import { ar, type TranslationDictionary } from "./locales/ar";
import { en } from "./locales/en";
import {
  useLanguageStore,
  getCurrentLocale,
  getCurrentDir,
  type Locale,
  type Direction,
} from "@/store/languageStore";

export const dictionaries: Record<Locale, TranslationDictionary> = {
  ar,
  en,
};

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary> | (string & {});

/**
 * Resolve a dot-separated key from the dictionary and interpolate `{{var}}` placeholders.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number | undefined | null>
): string {
  const dict = dictionaries[locale] ?? ar;
  const fallbackDict = ar;

  const resolvePath = (obj: unknown, path: string): unknown => {
    return path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  let raw = resolvePath(dict, key);
  if (typeof raw !== "string") {
    raw = resolvePath(fallbackDict, key);
  }
  if (typeof raw !== "string") {
    return String(key);
  }

  if (!params) return raw;

  return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => {
    const val = params[k];
    return val !== undefined && val !== null ? String(val) : "";
  });
}

/**
 * Non-React translation helper for utility modules (`format.ts`, etc.).
 */
export function tStatic(
  key: TranslationKey,
  params?: Record<string, string | number | undefined | null>
): string {
  return translate(getCurrentLocale(), key, params);
}

/**
 * Primary React hook for translations and language switching.
 */
export function useTranslation() {
  const locale = useLanguageStore((s) => s.locale);
  const dir = useLanguageStore((s) => s.dir);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const toggleLocale = useLanguageStore((s) => s.toggleLocale);

  const t = useCallback(
    (
      key: TranslationKey,
      params?: Record<string, string | number | undefined | null>
    ) => translate(locale, key, params),
    [locale]
  );

  const dict = dictionaries[locale] ?? ar;
  const isRTL = dir === "rtl";

  return {
    t,
    dict,
    locale,
    dir,
    isRTL,
    setLocale,
    toggleLocale,
  };
}

/**
 * Client-side language synchronizer — ensures `<html lang dir>` stays in sync
 * with the persisted language preference on mount and whenever locale changes.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useLanguageStore((s) => s.locale);
  const dir = useLanguageStore((s) => s.dir);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  return children;
}

export { getCurrentLocale, getCurrentDir, type Locale, type Direction, type TranslationDictionary };
