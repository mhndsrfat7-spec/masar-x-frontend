"use client";

import type { UserProfile } from "@/types/api";

/**
 * Restricted-browsing mode helpers.
 *
 * When a user skips the profile step at registration, the account is marked
 * incomplete: they can browse prices and pages, but creating shipments and
 * wallet operations are blocked until they fill in their profile (name, email,
 * and merchant store details for merchants).
 *
 * The flag is persisted in localStorage under `masar-x-profile-incomplete`
 * so it survives reloads and is also reflected in the auth store user object.
 */

const STORAGE_KEY = "masar-x-profile-incomplete";

/** True when the user explicitly skipped profile completion. */
export function isProfileIncompleteFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Persist the incomplete flag. */
export function setProfileIncompleteFlag(incomplete: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (incomplete) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

/**
 * Whether the given user profile is substantively complete:
 *  - has a name (>= 3 chars)
 *  - has an email
 *  - merchants also need a store name + commercial register
 */
export function isProfileComplete(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  const hasName = (user.name ?? user.fullName ?? "").trim().length >= 3;
  const hasEmail = !!(user.email && user.email.trim());
  const accountTypeLower = String(user.accountType ?? "").toLowerCase();
  const isMerchant = accountTypeLower === "merchant" || accountTypeLower === "business";
  const hasStore =
    !isMerchant ||
    ((user.store?.name ?? "").trim().length >= 2 &&
      (user.store?.commercialRegister ?? user.store?.crNumber ?? "").trim().length >= 4);
  return hasName && hasEmail && hasStore;
}

/**
 * Combined restriction check: the user is restricted if EITHER the explicit
 * skip flag is set OR their profile is missing required fields.
 */
export function isProfileRestricted(user: UserProfile | null | undefined): boolean {
  if (isProfileIncompleteFlag()) return true;
  return !isProfileComplete(user);
}

/** Clear the restriction after the profile is completed in ProfilePage. */
export function clearProfileRestriction(): void {
  setProfileIncompleteFlag(false);
}
