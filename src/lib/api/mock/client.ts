/**
 * Mock API client — mirrors the real `apiClient` interface but returns
 * data from local mock fixtures. Activated via NEXT_PUBLIC_API_MODE=demo
 * or automatically when the real backend is unreachable.
 */

import {
  MOCK_TOKEN,
  buildMockQuote,
  buildMockTracking,
  mockCarriers,
  mockCities,
  mockCustomers,
  mockInvoices,
  mockNotifications,
  mockShipmentStats,
  mockShipments,
  mockTransactions,
  mockUser,
  mockWallet,
  nextMockShipmentId,
} from "./data";
import type {
  AccountType,
  Carrier,
  City,
  Customer,
  Invoice,
  NotificationItem,
  QuoteRequest,
  QuoteResponse,
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

const delay = (ms = 250) =>
  new Promise<void>((r) => setTimeout(r, ms + Math.random() * 200));

const ok = <T>(data: T): T => data;

export const mockApi = {
  // ===== AUTH =====
  auth: {
    async requestOtp(_phone: string, _accountType: AccountType) {
      await delay();
      return ok({
        ok: true,
        message: "تم إرسال رمز التحقق (وضع التجربة: استخدم 1234)",
        expiresInSec: 300,
      });
    },
    async verifyOtp(phone: string, code: string, accountType: AccountType) {
      await delay(400);
      if (code !== "1234" && code !== "0000") {
        const e = new Error(
          "رمز التحقق غير صحيح. في وضع التجربة استخدم: 1234"
        ) as Error & { status: number; code?: string };
        e.status = 400;
        e.code = "invalid_otp";
        throw e;
      }
      return ok({
        accessToken: MOCK_TOKEN,
        refreshToken: "mock-refresh",
        expiresAt: Date.now() + 86400000,
        accountType,
        phone,
        ...mockUser,
      });
    },
    async refresh() {
      await delay();
      return ok({ accessToken: MOCK_TOKEN, refreshToken: "mock-refresh" });
    },
    async logout() {
      await delay(100);
      return ok({ ok: true });
    },
    async me() {
      await delay();
      return ok(mockUser);
    },
    async updateMe(patch: Partial<UserProfile>) {
      await delay();
      Object.assign(mockUser, patch);
      return ok(mockUser);
    },
    async updateLocale(locale: "ar" | "en") {
      await delay();
      mockUser.locale = locale;
      return ok({ ok: true });
    },
  },

  // ===== PUBLIC =====
  public: {
    async quote(req: QuoteRequest) {
      await delay(500);
      return ok(buildMockQuote(req));
    },
    async cities(): Promise<City[]> {
      await delay();
      return ok(mockCities);
    },
    async carriersActive(): Promise<Carrier[]> {
      await delay();
      return ok(mockCarriers);
    },
    async track(trackingNumber: string) {
      await delay();
      return ok(buildMockTracking(trackingNumber));
    },
  },

  // ===== SHIPMENTS =====
  shipments: {
    async quote(_token: string, req: QuoteRequest) {
      await delay(500);
      return ok(buildMockQuote(req));
    },
    async list(): Promise<Shipment[]> {
      await delay();
      return ok(mockShipments);
    },
    async stats(): Promise<ShipmentStats> {
      await delay();
      return ok(mockShipmentStats);
    },
    async details(_token: string, id: string) {
      await delay();
      const found = mockShipments.find((s) => s.id === id || s.trackingNumber === id);
      if (!found) throw Object.assign(new Error("الشحنة غير موجودة"), { status: 404 });
      return ok(found);
    },
    async create(_token: string, payload: Partial<Shipment> & Record<string, unknown>) {
      await delay(700);
      const id = nextMockShipmentId();
      const shipment: Shipment = {
        id,
        trackingNumber: id,
        status: "PENDING",
        senderName: payload.senderName ?? "",
        senderPhone: payload.senderPhone ?? "",
        senderCity: payload.senderCity ?? "الرياض",
        senderCityId: payload.senderCityId,
        senderAddress: payload.senderAddress ?? "",
        receiverName: payload.receiverName ?? "",
        receiverPhone: payload.receiverPhone ?? "",
        receiverCity: payload.receiverCity ?? "جدة",
        receiverCityId: payload.receiverCityId,
        receiverAddress: payload.receiverAddress ?? "",
        carrier: payload.carrier ?? "SMSA",
        carrierCode: payload.carrierCode ?? "SMSA",
        carrierName: payload.carrierName ?? "سمسا",
        carrierNameAr: payload.carrierNameAr ?? "سمسا",
        serviceType: payload.serviceType ?? "DOM",
        paymentMode: payload.paymentMode ?? "PREPAID",
        paymentMethod: payload.paymentMode ?? "PREPAID",
        codAmount: payload.codAmount,
        codAmountHal: payload.codAmountHal,
        weight: payload.weight ?? 1,
        weightGrams: payload.weightGrams ?? 1000,
        pieces: payload.pieces ?? 1,
        quantity: payload.quantity ?? 1,
        price: payload.price ?? 30,
        totalHal: payload.totalHal,
        shippingPriceHal: payload.shippingPriceHal,
        vatHal: payload.vatHal,
        currency: "SAR",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        packages: payload.packages,
        history: [
          {
            status: "PENDING",
            description: "تم إنشاء الشحنة بنجاح",
            location: payload.senderCity ?? "الرياض",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      mockShipments.unshift(shipment);
      return ok(shipment);
    },
    async confirm(_token: string, id: string) {
      await delay();
      const s = mockShipments.find((x) => x.id === id);
      if (s) s.status = "PROCESSING";
      return ok(s);
    },
    async label(_token: string, _id: string) {
      await delay();
      return ok({ url: "#" });
    },
    async cancel(_token: string, id: string) {
      await delay();
      const s = mockShipments.find((x) => x.id === id);
      if (s) s.status = "CANCELLED";
      return ok(s);
    },
  },

  // ===== CUSTOMERS =====
  customers: {
    async list(): Promise<Customer[]> {
      await delay();
      return ok(mockCustomers);
    },
    async create(_token: string, payload: Partial<Customer>) {
      await delay();
      const c: Customer = {
        id: `cust-${Date.now()}`,
        name: payload.name ?? "",
        fullName: payload.name ?? payload.fullName ?? "",
        phone: payload.phone ?? "",
        email: payload.email,
        city: payload.city,
        cityName: payload.city,
        cityId: payload.cityId,
        address: payload.address,
        notes: payload.notes,
        type: payload.type ?? "BOTH",
        shipmentsCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockCustomers.unshift(c);
      return ok(c);
    },
    async details(_token: string, id: string) {
      await delay();
      return ok(mockCustomers.find((c) => c.id === id));
    },
    async update(_token: string, id: string, patch: Partial<Customer>) {
      await delay();
      const c = mockCustomers.find((x) => x.id === id);
      if (c) Object.assign(c, patch);
      return ok(c);
    },
    async delete(_token: string, id: string) {
      await delay();
      const idx = mockCustomers.findIndex((c) => c.id === id);
      if (idx >= 0) mockCustomers.splice(idx, 1);
      return ok({ ok: true });
    },
  },

  // ===== STORES =====
  stores: {
    async me() {
      await delay();
      return ok(mockUser.store as StoreInfo);
    },
    async update(_token: string, patch: Partial<StoreInfo>) {
      await delay();
      if (mockUser.store) Object.assign(mockUser.store, patch);
      return ok(mockUser.store as StoreInfo);
    },
  },

  // ===== WALLET =====
  wallet: {
    async balance(): Promise<Wallet> {
      await delay();
      return ok(mockWallet);
    },
    async transactions(): Promise<WalletTransaction[]> {
      await delay();
      return ok(mockTransactions);
    },
    async topup(_token: string, req: TopupRequest): Promise<TopupResult> {
      await delay(800);
      mockWallet.balance = (mockWallet.balance ?? 0) + req.amount;
      mockWallet.balanceHal = Math.round(mockWallet.balance * 100);
      const tx: WalletTransaction = {
        id: `tx${mockTransactions.length + 1}`,
        type: "TOPUP",
        direction: "in",
        amount: req.amount,
        amountHal: Math.round(req.amount * 100),
        currency: "SAR",
        description: "شحن المحفظة عبر بطاقة مدى",
        reference: `TP-2025-${String(mockTransactions.length + 1).padStart(3, "0")}`,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        balanceAfter: mockWallet.balance,
        balanceAfterHal: mockWallet.balanceHal,
      };
      mockTransactions.unshift(tx);
      return ok({
        id: tx.id,
        status: "completed",
        amount: req.amount,
        paymentUrl: undefined,
        moyasarId: `mock_${Date.now()}`,
      });
    },
    async topupStatus(_token: string, _id: string) {
      await delay();
      return ok({ id: _id, status: "completed" });
    },
    async topupBankTransfer(_token: string, req: TopupRequest) {
      await delay(600);
      return ok({ id: `bt_${Date.now()}`, status: "pending", amount: req.amount });
    },
    async bankTransferInstructions() {
      await delay();
      return ok({
        bankName: "مصرف الراجحي",
        accountName: "شركة مسار إكس للخدمات اللوجستية",
        iban: "SA00 8000 0000 0000 0000",
        note: "يرجى إرسال إشعار الحوالة إلى support@masarx.sa",
      });
    },
    async codSummary() {
      await delay();
      return ok({
        total: 430,
        collected: 250,
        pending: 180,
      });
    },
  },

  // ===== INVOICES =====
  invoices: {
    async list(): Promise<Invoice[]> {
      await delay();
      return ok(mockInvoices);
    },
    async details(_token: string, id: string) {
      await delay();
      return ok(mockInvoices.find((i) => i.id === id));
    },
    async pdf(_token: string, _id: string) {
      await delay();
      return ok({ url: "#" });
    },
  },

  // ===== NOTIFICATIONS =====
  notifications: {
    async list(): Promise<NotificationItem[]> {
      await delay();
      return ok(mockNotifications);
    },
    async markRead(_token: string, ids?: string[]) {
      await delay(150);
      if (ids) {
        mockNotifications.forEach((n) => {
          if (ids.includes(n.id)) {
            n.read = true;
            n.isRead = true;
          }
        });
      } else {
        mockNotifications.forEach((n) => {
          n.read = true;
          n.isRead = true;
        });
      }
      return ok({ ok: true });
    },
  },
};

export type { QuoteResponse };
