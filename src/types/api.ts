/**
 * Masar X — API types derived from the live OpenAPI spec at
 * http://185.211.5.19:8081/api/v1/openapi.json
 *
 * Schemas are tuned to match the REAL backend response shapes we
 * discovered through live testing (e.g. halalas for prices, EN enums
 * for accountType and paymentMode, exact carrier shape).
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface ApiError {
  status: number;
  code?: string;
  message?: string;
  messageAr?: string;
  messageEn?: string;
  details?: unknown;
  raw?: unknown;
}

/** Backend uses UPPERCASE enum values */
export type AccountType = "MERCHANT" | "INDIVIDUAL";

/** Backwards-compatible alias for the UI */
export type AccountTypeAlias = "merchant" | "customer";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  accountType: AccountType;
  phone?: string;
  user?: UserProfile;
}

export interface UserProfile {
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  accountType?: AccountType;
  status?: string;
  nationalId?: string;
  bankName?: string;
  iban?: string;
  city?: string;
  address?: string;
  locale?: "ar" | "en";
  store?: StoreInfo;
  // backend sometimes nests extra fields
  merchant?: {
    id?: string;
    name?: string;
    storeName?: string;
    status?: string;
    balance?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export interface StoreInfo {
  id?: string;
  name?: string;
  storeName?: string;
  legalName?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  vatNumber?: string;
  commercialRegister?: string;
  crNumber?: string;
  status?: string;
  balance?: number;
  [k: string]: unknown;
}

export interface ShipmentPackage {
  id?: string;
  weight?: number;
  weightGrams?: number;
  length?: number;
  width?: number;
  height?: number;
  description?: string;
  quantity?: number;
  [k: string]: unknown;
}

export type ShipmentStatus =
  | "DRAFT"
  | "PENDING"
  | "PROCESSING"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "FAILED"
  | string;

/** Payment mode — backend uses UPPERCASE */
export type PaymentMode = "PREPAID" | "COD";

export interface Shipment {
  id: string;
  trackingNumber?: string;
  reference?: string;
  status: ShipmentStatus;
  // Sender
  senderName?: string;
  senderPhone?: string;
  senderCity?: string;
  senderCityId?: string;
  senderAddress?: string;
  // Receiver
  receiverName?: string;
  receiverPhone?: string;
  receiverCity?: string;
  receiverCityId?: string;
  receiverAddress?: string;
  // Carrier & service
  carrier?: string;
  carrierCode?: string;
  carrierName?: string;
  carrierNameAr?: string;
  carrierId?: string;
  serviceType?: string;
  serviceCode?: string;
  // Payment
  paymentMethod?: PaymentMode | string;
  paymentMode?: PaymentMode;
  codAmount?: number;
  codAmountHal?: number;
  // Pricing (halalas)
  price?: number;
  totalHal?: number;
  shippingPriceHal?: number;
  vatHal?: number;
  codFeeHal?: number;
  codCommissionHal?: number;
  chargeableGrams?: number;
  currency?: string;
  // Misc
  weight?: number;
  weightGrams?: number;
  pieces?: number;
  quantity?: number;
  notes?: string;
  etaMinDays?: number;
  etaMaxDays?: number;
  etaTextAr?: string;
  createdAt?: string;
  updatedAt?: string;
  packages?: ShipmentPackage[];
  history?: ShipmentHistoryItem[];
  events?: ShipmentHistoryItem[];
  timeline?: ShipmentHistoryItem[];
  [k: string]: unknown;
}

export interface ShipmentHistoryItem {
  status?: ShipmentStatus;
  description?: string;
  message?: string;
  messageAr?: string;
  location?: string;
  city?: string;
  timestamp?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export interface ShipmentStats {
  total?: number;
  draft?: number;
  pending?: number;
  processing?: number;
  inTransit?: number;
  in_transit?: number;
  outForDelivery?: number;
  out_for_delivery?: number;
  delivered?: number;
  cancelled?: number;
  canceled?: number;
  returned?: number;
  failed?: number;
  codTotal?: number;
  codPending?: number;
  codCollected?: number;
  totalValue?: number;
  totalValueHal?: number;
  [k: string]: unknown;
}

/** Quote request — matches the REAL backend schema */
export interface QuoteRequest {
  originCityId?: string;
  destCityId?: string;
  senderCityId?: string;
  receiverCityId?: string;
  carrierId?: string;
  carrier?: string;
  serviceType?: string;
  packages: Array<{
    weightGrams: number;
    length?: number;
    width?: number;
    height?: number;
    description: string;
    quantity?: number;
  }>;
  paymentMode: PaymentMode;
  codAmountHal?: number;
  [k: string]: unknown;
}

/** Quote result — halalas */
export interface QuoteResult {
  carrierId?: string;
  carrierCode?: string;
  carrierNameAr?: string;
  carrierNameEn?: string;
  carrierName?: string;
  serviceCode?: string;
  serviceType?: string;
  chargeableGrams?: number;
  carrierNetHal?: number;
  marginHal?: number;
  shippingPriceHal?: number;
  codFeeHal?: number;
  vatHal?: number;
  totalHal?: number;
  codCommissionHal?: number;
  etaMinDays?: number;
  etaMaxDays?: number;
  etaTextAr?: string;
  weightBreakdown?: {
    mode?: string;
    quantity?: number;
    actualGrams?: number;
    volumetricGrams?: number;
    chargeableGrams?: number;
  };
  // For backwards-compat with mock
  price?: number;
  currency?: string;
  estimatedDays?: number;
  [k: string]: unknown;
}

export interface QuoteResponse {
  best?: QuoteResult;
  quotes?: QuoteResult[];
}

export interface Wallet {
  balance?: number;
  balanceHal?: number;
  currency?: string;
  pending?: number;
  pendingHal?: number;
  codPending?: number;
  codPendingHal?: number;
  codCollected?: number;
  codCollectedHal?: number;
  negativeBalance?: boolean;
  [k: string]: unknown;
}

export type TxType =
  | "TOPUP"
  | "SHIPMENT"
  | "REFUND"
  | "COD"
  | "FEE"
  | "ADJUSTMENT"
  | "topup"
  | "shipment"
  | "refund"
  | "cod"
  | "fee"
  | "adjustment"
  | string;

export type TxDirection = "in" | "out" | "IN" | "OUT" | "CREDIT" | "DEBIT";

export interface WalletTransaction {
  id: string;
  type?: TxType;
  direction?: TxDirection;
  amount?: number;
  amountHal?: number;
  currency?: string;
  description?: string;
  descriptionAr?: string;
  reference?: string;
  status?: string;
  createdAt?: string;
  balanceAfter?: number;
  balanceAfterHal?: number;
  [k: string]: unknown;
}

export interface TopupRequest {
  amount: number;
  amountHal?: number;
  currency?: string;
  paymentMethod?: "card" | "bank_transfer" | string;
  [k: string]: unknown;
}

export interface TopupResult {
  id: string;
  status?: string;
  amount?: number;
  amountHal?: number;
  paymentUrl?: string;
  moyasarId?: string;
  [k: string]: unknown;
}

/** Customer / Address book entry — represents both sender & receiver contacts */
export interface Customer {
  id: string;
  name?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  cityName?: string;
  cityId?: string;
  address?: string;
  notes?: string;
  type?: "SENDER" | "RECEIVER" | "BOTH" | string;
  shipmentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export interface Invoice {
  id: string;
  number?: string;
  invoiceNumber?: string;
  shipmentId?: string;
  trackingNumber?: string;
  amount?: number;
  amountHal?: number;
  subtotal?: number;
  subtotalHal?: number;
  vat?: number;
  vatHal?: number;
  total?: number;
  totalHal?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  issueDate?: string;
  pdfUrl?: string;
  printUrl?: string;
  [k: string]: unknown;
}

export interface NotificationItem {
  id: string;
  type?: string;
  title?: string;
  titleAr?: string;
  body?: string;
  bodyAr?: string;
  message?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
  actionUrl?: string;
  link?: string;
  [k: string]: unknown;
}

/** City — actual shape from /public/cities */
export interface City {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  regionAr?: string;
  regionEn?: string;
  zoneCode?: string;
  zoneNameAr?: string;
  zoneNameEn?: string;
  active?: boolean;
  [k: string]: unknown;
}

/** Carrier — actual shape from /public/carriers/active */
export interface Carrier {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  apiMode?: "API" | "MANUAL" | "MOCK" | string;
  codSupported?: boolean;
  capabilities?: string[];
  logoUrl?: string | null;
  services?: CarrierService[];
  active?: boolean;
  [k: string]: unknown;
}

export interface CarrierService {
  code?: string;
  name?: string;
  nameAr?: string;
  domestic?: boolean;
  international?: boolean;
  [k: string]: unknown;
}

export interface TrackingEvent {
  status?: ShipmentStatus;
  description?: string;
  descriptionAr?: string;
  message?: string;
  messageAr?: string;
  location?: string;
  city?: string;
  timestamp?: string;
  createdAt?: string;
  [k: string]: unknown;
}

export interface TrackingResult {
  trackingNumber?: string;
  status?: ShipmentStatus;
  carrier?: string;
  carrierName?: string;
  carrierNameAr?: string;
  estimatedDelivery?: string;
  estimatedDeliveryAr?: string;
  events?: TrackingEvent[];
  history?: TrackingEvent[];
  timeline?: TrackingEvent[];
  origin?: string;
  originCity?: string;
  destination?: string;
  destinationCity?: string;
  receiverName?: string;
  createdAt?: string;
  [k: string]: unknown;
}

/** Helper: convert halalas to SAR */
export function halToSar(hal: number | undefined | null): number {
  if (!hal || typeof hal !== "number") return 0;
  return hal / 100;
}

/** Helper: convert SAR to halalas */
export function sarToHal(sar: number | undefined | null): number {
  if (!sar || typeof sar !== "number") return 0;
  return Math.round(sar * 100);
}
