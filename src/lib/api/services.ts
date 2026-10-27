import { apiClient } from "./client";
import { Endpoints } from "./endpoints";
import { mockApi } from "./mock/client";
import type {
  AccountType,
  AuthSession,
  Carrier,
  City,
  Customer,
  Invoice,
  NotificationItem,
  PaymentMode,
  QuoteRequest,
  QuoteResponse,
  QuoteResult,
  Shipment,
  ShipmentStats,
  StoreInfo,
  TopupRequest,
  TopupResult,
  TrackingResult,
  UserProfile,
  Wallet,
  WalletTransaction,
} from "@/types/api";

const withToken = (token?: string | null) => ({ token: token ?? undefined });

/**
 * Mode selector — controls whether the UI talks to the real backend
 * or to the local mock fixtures.
 *
 *  - "real"  → calls go to the actual backend (default)
 *  - "demo"  → all data comes from src/lib/api/mock/data.ts
 */
export type ApiMode = "real" | "demo";

export function getApiMode(): ApiMode {
  if (typeof process !== "undefined") {
    const v = process.env.NEXT_PUBLIC_API_MODE;
    if (v === "demo" || v === "real") return v;
  }
  return "real";
}

export function isDemoMode(): boolean {
  return getApiMode() === "demo";
}

/** ===== AUTH =====
 *
 * Backend uses OTP-only flow for merchants:
 *  1. POST /auth/otp/request { phone, accountType: "MERCHANT"|"INDIVIDUAL" } → { expiresInSec }
 *  2. POST /auth/otp/verify  { phone, code, accountType } → { accessToken, user, ... }
 *
 * NOTE: The backend currently does NOT expose a password login endpoint
 * for merchants. The UI presents a "password" field to match the brand
 * reference images — in real mode it is currently stored client-side
 * only (used for the local signup form). When a real password-login
 * endpoint is added to the backend, swap verifyOtp() for a direct
 * password call. See BACKEND_NOTES.md.
 */

export const authApi = {
  requestOtp: (phone: string, accountType: AccountType = "MERCHANT") =>
    isDemoMode()
      ? mockApi.auth.requestOtp(phone, accountType)
      : apiClient.post<{ ok?: boolean; message?: string; expiresInSec?: number }>(
          Endpoints.auth.otpRequest,
          { phone, accountType }
        ),

  verifyOtp: (phone: string, code: string, accountType: AccountType = "MERCHANT") =>
    isDemoMode()
      ? mockApi.auth.verifyOtp(phone, code, accountType)
      : apiClient.post<AuthSession & Partial<UserProfile>>(Endpoints.auth.otpVerify, {
          phone,
          code,
          accountType,
        }),

  refresh: (token: string) =>
    isDemoMode()
      ? mockApi.auth.refresh()
      : apiClient.post<{ accessToken: string; refreshToken?: string }>(
          Endpoints.auth.refresh,
          {},
          withToken(token)
        ),

  logout: (token: string) =>
    isDemoMode()
      ? mockApi.auth.logout()
      : apiClient.post<{ ok?: boolean }>(Endpoints.auth.logout, {}, withToken(token)),

  me: (token: string) =>
    isDemoMode() ? mockApi.auth.me() : apiClient.get<UserProfile>(Endpoints.auth.me, withToken(token)),

  updateMe: (token: string, patch: Partial<UserProfile>) =>
    isDemoMode()
      ? mockApi.auth.updateMe(patch)
      : apiClient.patch<UserProfile>(Endpoints.auth.me, patch, withToken(token)),

  updateLocale: (token: string, locale: "ar" | "en") =>
    isDemoMode()
      ? mockApi.auth.updateLocale(locale)
      : apiClient.patch<{ ok?: boolean }>(
          Endpoints.auth.locale,
          { locale },
          withToken(token)
        ),
};

/** ===== PUBLIC ===== */

export const publicApi = {
  quote: (req: QuoteRequest) =>
    isDemoMode()
      ? mockApi.public.quote(req)
      : apiClient.post<QuoteResponse | QuoteResult[]>(Endpoints.public.quote, req),

  cities: () =>
    isDemoMode()
      ? mockApi.public.cities()
      : apiClient.get<City[] | { data: City[] }>(Endpoints.public.cities),

  carriersActive: () =>
    isDemoMode()
      ? mockApi.public.carriersActive()
      : apiClient.get<Carrier[] | { data: Carrier[] }>(Endpoints.public.carriersActive),

  track: (trackingNumber: string) =>
    isDemoMode()
      ? mockApi.public.track(trackingNumber)
      : apiClient.get<TrackingResult>(Endpoints.public.track(trackingNumber)),
};

/** ===== SHIPMENTS ===== */

export const shipmentsApi = {
  quote: (token: string, req: QuoteRequest) =>
    isDemoMode()
      ? mockApi.shipments.quote(token, req)
      : apiClient.post<QuoteResponse | QuoteResult[]>(
          Endpoints.shipments.quote,
          req,
          withToken(token)
        ),

  list: (token: string, query?: Record<string, string | number>) =>
    isDemoMode()
      ? mockApi.shipments.list()
      : apiClient.get<Shipment[] | { data: Shipment[]; total?: number }>(
          Endpoints.shipments.list,
          { ...withToken(token), query }
        ),

  stats: (token: string) =>
    isDemoMode()
      ? mockApi.shipments.stats()
      : apiClient.get<ShipmentStats>(Endpoints.shipments.stats, withToken(token)),

  details: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.shipments.details(token, id)
      : apiClient.get<Shipment>(Endpoints.shipments.details(id), withToken(token)),

  create: (token: string, payload: Record<string, unknown>) =>
    isDemoMode()
      ? mockApi.shipments.create(token, payload as Partial<Shipment> & Record<string, unknown>)
      : apiClient.post<Shipment>(Endpoints.shipments.create, payload, withToken(token)),

  confirm: (token: string, id: string, payload?: Record<string, unknown>) =>
    isDemoMode()
      ? mockApi.shipments.confirm(token, id)
      : apiClient.post<Shipment & { invoice?: Invoice }>(
          Endpoints.shipments.confirm(id),
          payload ?? {},
          withToken(token)
        ),

  label: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.shipments.label(token, id)
      : apiClient.get<{ url?: string }>(Endpoints.shipments.label(id), withToken(token)),

  cancel: (token: string, id: string, reason?: string) =>
    isDemoMode()
      ? mockApi.shipments.cancel(token, id)
      : apiClient.post<Shipment>(
          Endpoints.shipments.cancel(id),
          reason ? { reason } : {},
          withToken(token)
        ),
};

/** ===== CUSTOMERS (Address book — senders + receivers) ===== */

export const customersApi = {
  list: (token: string, query?: Record<string, string | number>) =>
    isDemoMode()
      ? mockApi.customers.list()
      : apiClient.get<Customer[] | { data: Customer[]; total?: number }>(
          Endpoints.customers.list,
          { ...withToken(token), query }
        ),

  create: (token: string, payload: Partial<Customer>) =>
    isDemoMode()
      ? mockApi.customers.create(token, payload)
      : apiClient.post<Customer>(Endpoints.customers.create, payload, withToken(token)),

  details: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.customers.details(token, id)
      : apiClient.get<Customer>(Endpoints.customers.details(id), withToken(token)),

  update: (token: string, id: string, patch: Partial<Customer>) =>
    isDemoMode()
      ? mockApi.customers.update(token, id, patch)
      : apiClient.patch<Customer>(Endpoints.customers.details(id), patch, withToken(token)),

  delete: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.customers.delete(token, id)
      : apiClient.delete<{ ok?: boolean }>(Endpoints.customers.details(id), withToken(token)),
};

/** ===== STORES ===== */

export const storesApi = {
  me: (token: string) =>
    isDemoMode()
      ? mockApi.stores.me()
      : apiClient.get<StoreInfo>(Endpoints.stores.me, withToken(token)),

  update: (token: string, patch: Partial<StoreInfo>) =>
    isDemoMode()
      ? mockApi.stores.update(token, patch)
      : apiClient.patch<StoreInfo>(Endpoints.stores.me, patch, withToken(token)),
};

/** ===== WALLET ===== */

export const walletApi = {
  balance: (token: string) =>
    isDemoMode()
      ? mockApi.wallet.balance()
      : apiClient.get<Wallet>(Endpoints.wallet.balance, withToken(token)),

  transactions: (token: string, query?: Record<string, string | number>) =>
    isDemoMode()
      ? mockApi.wallet.transactions()
      : apiClient.get<WalletTransaction[] | { data: WalletTransaction[]; total?: number }>(
          Endpoints.wallet.transactions,
          { ...withToken(token), query }
        ),

  topup: (token: string, req: TopupRequest) =>
    isDemoMode()
      ? mockApi.wallet.topup(token, req)
      : apiClient.post<TopupResult>(Endpoints.wallet.topup, req, withToken(token)),

  topupStatus: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.wallet.topupStatus(token, id)
      : apiClient.get<TopupResult>(Endpoints.wallet.topupStatus(id), withToken(token)),

  topupBankTransfer: (token: string, req: TopupRequest) =>
    isDemoMode()
      ? mockApi.wallet.topupBankTransfer(token, req)
      : apiClient.post<TopupResult>(
          Endpoints.wallet.topupBankTransfer,
          req,
          withToken(token)
        ),

  bankTransferInstructions: (token: string) =>
    isDemoMode()
      ? mockApi.wallet.bankTransferInstructions()
      : apiClient.get<Record<string, unknown>>(
          Endpoints.wallet.topupBankTransferInstructions,
          withToken(token)
        ),

  codSummary: (token: string) =>
    isDemoMode()
      ? mockApi.wallet.codSummary()
      : apiClient.get<Record<string, unknown>>(Endpoints.wallet.codSummary, withToken(token)),
};

/** ===== INVOICES ===== */

export const invoicesApi = {
  list: (token: string, query?: Record<string, string | number>) =>
    isDemoMode()
      ? mockApi.invoices.list()
      : apiClient.get<Invoice[] | { data: Invoice[]; total?: number }>(
          Endpoints.invoices.list,
          { ...withToken(token), query }
        ),

  details: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.invoices.details(token, id)
      : apiClient.get<Invoice>(Endpoints.invoices.details(id), withToken(token)),

  pdf: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.invoices.pdf(token, id)
      : apiClient.get<{ url?: string }>(Endpoints.invoices.pdf(id), withToken(token)),
};

/** ===== NOTIFICATIONS ===== */

export const notificationsApi = {
  list: (token: string) =>
    isDemoMode()
      ? mockApi.notifications.list()
      : apiClient.get<NotificationItem[] | { data: NotificationItem[] }>(
          Endpoints.notifications.list,
          withToken(token)
        ),

  markRead: (token: string, ids?: string[]) =>
    isDemoMode()
      ? mockApi.notifications.markRead(token, ids)
      : apiClient.post<{ ok?: boolean }>(
          Endpoints.notifications.read,
          ids ? { ids } : {},
          withToken(token)
        ),
};

/** ===== UPLOADS ===== */

export const uploadsApi = {
  presign: (token: string, payload: Record<string, unknown>) =>
    apiClient.post<{ url?: string; fields?: Record<string, string> }>(
      Endpoints.uploads.presign,
      payload,
      withToken(token)
    ),
};

/** Export PaymentMode for forms */
export type { PaymentMode };
