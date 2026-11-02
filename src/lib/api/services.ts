import { apiClient } from "./client";
import { Endpoints } from "./endpoints";
import { mockApi } from "./mock/client";
import type {
  AccountType,
  AuthSession,
  Carrier,
  CarrierCapabilityResponse,
  CreateWeightDisputeRequest,
  CreateShipmentRequest,
  IntegrationEvent,
  IntegrationEventDetails,
  IntegrationEventListResponse,
  IntegrationsOverview,
  ShortCodeLookupResult,
  WeightDispute,
  WeightDisputeListResponse,
  WhatsAppConnectResponse,
  City,
  Customer,
  Invoice,
  NotificationItem,
  PaymentMode,
  PasswordActionResponse,
  PasswordChangeRequest,
  PasswordLoginRequest,
  PasswordRecoveryRequest,
  PasswordResetRequest,
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
 * OTP endpoints already exist. Password login / recovery / change are new
 * backend contracts documented in BACKEND_HANDOFF_AR.md. The UI falls back
 * to the established OTP flow only when password login is not deployed.
 */

export const authApi = {
  login: (payload: PasswordLoginRequest) =>
    isDemoMode()
      ? mockApi.auth.login(payload)
      : apiClient.post<AuthSession>(Endpoints.auth.passwordLogin, payload),

  forgotPassword: (payload: PasswordRecoveryRequest) =>
    isDemoMode()
      ? mockApi.auth.forgotPassword(payload)
      : apiClient.post<PasswordActionResponse>(Endpoints.auth.forgotPassword, payload),

  resetPassword: (payload: PasswordResetRequest) =>
    isDemoMode()
      ? mockApi.auth.resetPassword(payload)
      : apiClient.post<PasswordActionResponse>(Endpoints.auth.resetPassword, payload),

  changePassword: (token: string, payload: PasswordChangeRequest) =>
    isDemoMode()
      ? mockApi.auth.changePassword(payload)
      : apiClient.post<PasswordActionResponse>(Endpoints.auth.changePassword, payload, withToken(token)),

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

  create: (token: string, payload: CreateShipmentRequest) =>
    isDemoMode()
      ? mockApi.shipments.create(token, payload)
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

  /** Withdraw available balance / COD to a saved bank account. */
  withdraw: (token: string, req: { amount: number; amountHal?: number; bankAccountId: string; note?: string }) =>
    isDemoMode()
      ? mockApi.wallet.withdraw(token, req)
      : apiClient.post<{ ok: boolean; transactionId: string; status: string }>(
          "/wallet/withdraw",
          req,
          withToken(token)
        ),
};

/** ===== SAVED BANK ACCOUNTS — managed on the user profile =====
 *  Lets merchants save multiple IBANs and reuse them for bank-transfer topups
 *  and COD/balance withdrawals. In demo: stored on mockUser.savedBankAccounts.
 *  In real: stored server-side per user (POST /bank-accounts CRUD). */

export interface SavedBankAccount {
  id: string;
  label: string;
  accountHolderName: string;
  bankName: string;
  iban: string;
  isDefault: boolean;
  createdAt: string;
}

export const bankAccountsApi = {
  list: (token: string) =>
    isDemoMode()
      ? mockApi.bankAccounts.list()
      : apiClient.get<SavedBankAccount[]>("/bank-accounts", withToken(token)),

  create: (token: string, payload: Omit<SavedBankAccount, "id" | "createdAt">) =>
    isDemoMode()
      ? mockApi.bankAccounts.create(payload)
      : apiClient.post<SavedBankAccount>("/bank-accounts", payload, withToken(token)),

  update: (token: string, id: string, patch: Partial<SavedBankAccount>) =>
    isDemoMode()
      ? mockApi.bankAccounts.update(id, patch)
      : apiClient.patch<SavedBankAccount>(
          `/bank-accounts/${encodeURIComponent(id)}`,
          patch,
          withToken(token)
        ),

  delete: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.bankAccounts.delete(id)
      : apiClient.delete<{ ok: boolean }>(
          `/bank-accounts/${encodeURIComponent(id)}`,
          withToken(token)
        ),
};

/** Verify the user's password (for sensitive confirmations like withdrawals,
 *  bank-account edits, topup confirmation) without re-submitting bank details. */
export const securityApi = {
  verifyPassword: (token: string, password: string) =>
    isDemoMode()
      ? mockApi.verifyPassword(token, password)
      : apiClient.post<{ ok: boolean }>("/auth/verify-password", { password }, withToken(token)),
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

/** ===== ADDRESS RESOLUTION ===== */

export const addressLookupApi = {
  lookup: (token: string, code: string) =>
    isDemoMode()
      ? mockApi.customers.lookupByCode(code)
      : apiClient.get<ShortCodeLookupResult>(Endpoints.customers.lookupByCode, {
          ...withToken(token),
          query: { code: code.trim().toUpperCase() },
        }),
};

/** ===== WEIGHT DISPUTES ===== */

export const weightDisputesApi = {
  list: (token: string, query?: Record<string, string | number>) =>
    isDemoMode()
      ? mockApi.weightDisputes.list(query)
      : apiClient.get<WeightDisputeListResponse | WeightDispute[]>(
          Endpoints.weightDisputes.list,
          { ...withToken(token), query }
        ),

  create: (token: string, shipmentId: string, payload: CreateWeightDisputeRequest) =>
    isDemoMode()
      ? mockApi.weightDisputes.create(shipmentId, payload)
      : apiClient.post<WeightDispute>(
          Endpoints.weightDisputes.createForShipment(shipmentId),
          payload,
          withToken(token)
        ),

  details: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.weightDisputes.details(id)
      : apiClient.get<WeightDispute>(Endpoints.weightDisputes.details(id), withToken(token)),

  attach: (token: string, id: string, upload: UploadedFileReceipt) =>
    isDemoMode()
      ? mockApi.weightDisputes.attach(id, upload)
      : apiClient.post<WeightDisputeAttachmentReceipt>(
          Endpoints.weightDisputes.attachments(id),
          upload,
          withToken(token)
        ),
};

/** ===== CARRIER CAPABILITIES ===== */

export const carrierCapabilitiesApi = {
  get: (code: string) =>
    isDemoMode()
      ? mockApi.public.carrierCapabilities(code)
      : apiClient.get<CarrierCapabilityResponse>(Endpoints.public.carrierCapabilities(code)),
};

/** ===== INTEGRATIONS & DELIVERY EVENTS ===== */

export const integrationsApi = {
  overview: (token: string) =>
    isDemoMode()
      ? mockApi.integrations.overview()
      : apiClient.get<IntegrationsOverview>(Endpoints.integrations.overview, withToken(token)),

  events: (token: string, query?: Record<string, string | number>) =>
    isDemoMode()
      ? mockApi.integrations.events(query)
      : apiClient.get<IntegrationEventListResponse | IntegrationEvent[]>(
          Endpoints.integrations.events,
          { ...withToken(token), query }
        ),

  eventDetails: (token: string, id: string) =>
    isDemoMode()
      ? mockApi.integrations.eventDetails(id)
      : apiClient.get<IntegrationEventDetails>(
          Endpoints.integrations.eventDetails(id),
          withToken(token)
        ),

  connectWhatsApp: (token: string) =>
    isDemoMode()
      ? Promise.reject(new Error("ربط واتساب الحقيقي غير متاح في وضع التجربة"))
      : apiClient.post<WhatsAppConnectResponse>(
          Endpoints.integrations.whatsappConnect,
          {},
          withToken(token)
        ),

  disconnectWhatsApp: (token: string) =>
    isDemoMode()
      ? Promise.reject(new Error("إدارة اتصال واتساب الحقيقي غير متاحة في وضع التجربة"))
      : apiClient.post<{ ok: boolean }>(
          Endpoints.integrations.whatsappDisconnect,
          {},
          withToken(token)
        ),
};

/** ===== UPLOADS ===== */

export interface UploadedFileReceipt {
  fileId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface WeightDisputeAttachmentReceipt extends UploadedFileReceipt {
  id?: string;
  downloadUrl?: string;
}

export const uploadsApi = {
  presign: (token: string, payload: Record<string, unknown>) =>
    apiClient.post<import("@/types/api").PresignedUploadResponse>(
      Endpoints.uploads.presign,
      payload,
      withToken(token)
    ),

  uploadWeightEvidence: async (
    token: string,
    disputeId: string,
    file: File
  ): Promise<UploadedFileReceipt> => {
    if (isDemoMode()) {
      return {
        fileId: `demo-file-${Date.now()}`,
        storageKey: `demo/weight-disputes/${disputeId}/${file.name}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      };
    }

    const signed = await uploadsApi.presign(token, {
      purpose: "WEIGHT_DISPUTE_EVIDENCE",
      resourceType: "WEIGHT_DISPUTE",
      resourceId: disputeId,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });

    const uploadUrl = new URL(signed.uploadUrl);
    if (uploadUrl.protocol !== "https:") {
      throw new Error("رابط رفع الملف يجب أن يستخدم HTTPS");
    }

    const response = await fetch(uploadUrl.toString(), {
      method: signed.method,
      headers: signed.headers,
      body: file,
    });
    if (!response.ok) {
      throw new Error(`فشل رفع المرفق (HTTP ${response.status})`);
    }

    return {
      fileId: signed.fileId,
      storageKey: signed.storageKey,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    };
  },
};

/** Export PaymentMode for forms */
export type { PaymentMode };
