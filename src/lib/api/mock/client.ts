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
  type SavedBankAccount,
} from "./data";
import type {
  AccountType,
  Carrier,
  CarrierCapabilityResponse,
  CreateWeightDisputeRequest,
  CreateShipmentRequest,
  IntegrationEventDetails,
  IntegrationsOverview,
  ShortCodeLookupResult,
  WeightDispute,
  City,
  Customer,
  Invoice,
  NotificationItem,
  PasswordChangeRequest,
  PasswordLoginRequest,
  PasswordRecoveryRequest,
  PasswordResetRequest,
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

/** SAR → halalas helper (mirror of the one in data.ts). */
const sar = (v: number) => Math.round(v * 100);

const demoWeightDisputes: WeightDispute[] = [
  {
    id: "wd-demo-1001",
    shipmentId: mockShipments[0]?.id ?? "sh-demo-01",
    trackingNumber: mockShipments[0]?.trackingNumber ?? "MX-DEMO-1001",
    carrierCode: "SMSA",
    carrierNameAr: "سمسا",
    reasonCode: "WEIGHT_MISMATCH",
    description: "أطلب مراجعة فرق الوزن المسجل على البوليصة ومقارنته بوزن الطرد قبل التسليم.",
    status: "UNDER_REVIEW",
    customerMeasuredWeightGrams: 3200,
    carrierMeasuredWeightGrams: 5000,
    chargeDifferenceHal: 1800,
    attachments: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const demoIntegrationEvents: IntegrationEventDetails[] = [];

export const mockApi = {
  // ===== AUTH =====
  auth: {
    async login(payload: PasswordLoginRequest) {
      await delay(400);
      return ok({
        accessToken: MOCK_TOKEN,
        refreshToken: "mock-refresh",
        expiresAt: Date.now() + 86400000,
        accountType: payload.accountType,
        phone: payload.phone,
        user: mockUser,
      });
    },
    async forgotPassword(_payload: PasswordRecoveryRequest) {
      await delay(300);
      return ok({ ok: true, expiresInSec: 300, message: "تم إرسال رمز الاستعادة في وضع التجربة" });
    },
    async resetPassword(_payload: PasswordResetRequest) {
      await delay(300);
      return ok({ ok: true, message: "تم تغيير كلمة المرور في وضع التجربة" });
    },
    async changePassword(_payload: PasswordChangeRequest) {
      await delay(300);
      return ok({ ok: true, message: "تم تغيير كلمة المرور في وضع التجربة" });
    },
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
    async carrierCapabilities(code: string): Promise<CarrierCapabilityResponse> {
      await delay(220);
      const carrier = mockCarriers.find((item) => item.code === code);
      if (!carrier) throw Object.assign(new Error("الناقل غير موجود"), { status: 404 });
      const customFields = code === "SMSA"
        ? [{ key: "landmark", labelAr: "أقرب معلم للمستلم", type: "TEXT" as const, required: false, placeholder: "مثال: بجوار المركز التجاري" }]
        : code === "MWEXPRESS"
          ? [{ key: "deliveryWindow", labelAr: "فترة التسليم المفضلة", type: "SELECT" as const, required: true, options: [{ label: "صباحًا", value: "MORNING" }, { label: "مساءً", value: "EVENING" }] }]
          : [];
      return ok({ carrier, capabilities: carrier.capabilities ?? [], services: carrier.services ?? [], customFields, updatedAt: new Date().toISOString() });
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
    async create(_token: string, payload: CreateShipmentRequest) {
      await delay(700);
      const id = nextMockShipmentId();

      // Compute pricing if not provided
      const totalHal =
        payload.totalHal ??
        (() => {
          const base = 1500 + Math.round((payload.weightGrams ?? 1000) * 0.5);
          const margin = Math.round(base * 0.1);
          return Math.round((base + margin) * 1.15);
        })();
      const shippingPriceHal =
        payload.shippingPriceHal ?? Math.round(totalHal / 1.15);
      const vatHal = payload.vatHal ?? (totalHal - shippingPriceHal);

      const shipment: Shipment = {
        id,
        trackingNumber: id,
        reference: payload.senderAddressCode ?? `ORD-${id}`,
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
        price: totalHal / 100,
        totalHal,
        shippingPriceHal,
        vatHal,
        currency: "SAR",
        notes: payload.notes,
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

      // === Financial linkage: PREPAID → debit wallet + record transaction + notify ===
      if (shipment.paymentMode === "PREPAID" && totalHal > 0) {
        const amountSar = totalHal / 100;
        const prevBalance = mockWallet.balance ?? 0;
        mockWallet.balance = prevBalance - amountSar;
        mockWallet.balanceHal = Math.round(mockWallet.balance * 100);
        const tx: WalletTransaction = {
          id: `tx${Date.now()}`,
          type: "SHIPMENT",
          direction: "out",
          amount: amountSar,
          amountHal: totalHal,
          currency: "SAR",
          description: `تكلفة شحنة #${id}`,
          descriptionAr: `تكلفة شحنة #${id}`,
          reference: id,
          status: "COMPLETED",
          createdAt: new Date().toISOString(),
          balanceAfter: mockWallet.balance,
          balanceAfterHal: mockWallet.balanceHal,
        };
        mockTransactions.unshift(tx);
        mockNotifications.unshift({
          id: `n${Date.now()}`,
          type: "SHIPMENT",
          title: "تم إنشاء شحنة جديدة",
          titleAr: "تم إنشاء شحنة جديدة",
          body: `تم إنشاء الشحنة #${id} وخصم ${amountSar.toLocaleString("ar-SA")} ر.س من محفظتك.`,
          bodyAr: `تم إنشاء الشحنة #${id} وخصم ${amountSar.toLocaleString("ar-SA")} ر.س من محفظتك.`,
          read: false,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionUrl: `shipment-details?id=${id}`,
        });
      }

      // Update shipment stats
      mockShipmentStats.total = (mockShipmentStats.total ?? 0) + 1;
      mockShipmentStats.pending = (mockShipmentStats.pending ?? 0) + 1;
      if (shipment.paymentMode === "COD") {
        mockShipmentStats.codPending = (mockShipmentStats.codPending ?? 0) + (shipment.codAmount ?? 0);
      }

      return ok(shipment);
    },
    async confirm(_token: string, id: string) {
      await delay();
      const s = mockShipments.find((x) => x.id === id);
      if (s) {
        s.status = "PROCESSING";
        s.updatedAt = new Date().toISOString();
      }
      return ok(s);
    },
    async label(_token: string, _id: string) {
      await delay();
      return ok({ url: "#" });
    },
    async cancel(_token: string, id: string) {
      await delay();
      const s = mockShipments.find((x) => x.id === id);
      if (s) {
        const wasPrepaid = s.paymentMode === "PREPAID";
        const refundHal = s.totalHal ?? 0;
        s.status = "CANCELLED";
        s.updatedAt = new Date().toISOString();
        // Append cancellation to history
        s.history = [
          ...(s.history ?? []),
          {
            status: "CANCELLED",
            description: "تم إلغاء الشحنة واسترداد المبلغ",
            location: s.senderCity,
            timestamp: new Date().toISOString(),
          },
        ];

        // === Financial linkage: refund to wallet + record REFUND transaction + notify ===
        if (wasPrepaid && refundHal > 0) {
          const refundSar = refundHal / 100;
          const prevBalance = mockWallet.balance ?? 0;
          mockWallet.balance = prevBalance + refundSar;
          mockWallet.balanceHal = Math.round(mockWallet.balance * 100);
          mockTransactions.unshift({
            id: `tx${Date.now()}`,
            type: "REFUND",
            direction: "in",
            amount: refundSar,
            amountHal: refundHal,
            currency: "SAR",
            description: `استرداد شحنة ملغاة #${id}`,
            descriptionAr: `استرداد شحنة ملغاة #${id}`,
            reference: id,
            status: "COMPLETED",
            createdAt: new Date().toISOString(),
            balanceAfter: mockWallet.balance,
            balanceAfterHal: mockWallet.balanceHal,
          });
          mockNotifications.unshift({
            id: `n${Date.now() + 1}`,
            type: "WALLET",
            title: "تم استرداد المبلغ",
            titleAr: "تم استرداد المبلغ",
            body: `تم إلغاء الشحنة #${id} وإعادة ${refundSar.toLocaleString("ar-SA")} ر.س إلى محفظتك.`,
            bodyAr: `تم إلغاء الشحنة #${id} وإعادة ${refundSar.toLocaleString("ar-SA")} ر.س إلى محفظتك.`,
            read: false,
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: `shipment-details?id=${id}`,
          });
        }

        // Update stats
        if (mockShipmentStats.pending) mockShipmentStats.pending -= 1;
        mockShipmentStats.cancelled = (mockShipmentStats.cancelled ?? 0) + 1;
      }
      return ok(s);
    },
  },

  // ===== CUSTOMERS =====
  customers: {
    async lookupByCode(code: string): Promise<ShortCodeLookupResult> {
      await delay(350);
      const normalized = code.trim().toUpperCase();
      const contact = mockCustomers.find((entry) =>
        String((entry as Customer & { shortCode?: string }).shortCode ?? "").toUpperCase() === normalized ||
        entry.id.toUpperCase() === normalized
      );
      if (!contact) throw Object.assign(new Error("لم يتم العثور على جهة اتصال مرتبطة بهذا الرمز في بيانات التجربة"), { status: 404 });
      return ok({ code: normalized, source: "CUSTOMER_ALIAS", contact, resolvedAt: new Date().toISOString() });
    },
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

  // ===== WEIGHT DISPUTES =====
  weightDisputes: {
    async list(query?: Record<string, string | number>) {
      await delay();
      const status = String(query?.status ?? "all");
      const rows = status === "all" ? demoWeightDisputes : demoWeightDisputes.filter((item) => item.status === status);
      return ok({ data: rows, total: rows.length, limit: Number(query?.limit ?? 50), offset: Number(query?.offset ?? 0) });
    },
    async create(shipmentId: string, payload: CreateWeightDisputeRequest) {
      await delay(500);
      const shipment = mockShipments.find((item) => item.id === shipmentId);
      if (!shipment) throw Object.assign(new Error("الشحنة غير موجودة في وضع التجربة"), { status: 404 });
      const item: WeightDispute = {
        id: `wd-demo-${Date.now()}`,
        shipmentId,
        trackingNumber: shipment.trackingNumber,
        carrierCode: shipment.carrierCode,
        carrierNameAr: shipment.carrierNameAr,
        reasonCode: payload.reasonCode,
        description: payload.description,
        status: "SUBMITTED",
        customerMeasuredWeightGrams: payload.customerMeasuredWeightGrams,
        attachments: [],
        createdAt: new Date().toISOString(),
      };
      demoWeightDisputes.unshift(item);
      return ok(item);
    },
    async details(id: string) {
      await delay();
      const found = demoWeightDisputes.find((item) => item.id === id);
      if (!found) throw Object.assign(new Error("الاعتراض غير موجود"), { status: 404 });
      return ok(found);
    },
    async attach(id: string, upload: { fileId: string; storageKey: string; fileName: string; mimeType: string; sizeBytes: number }) {
      await delay(250);
      const found = demoWeightDisputes.find((item) => item.id === id);
      if (!found) throw Object.assign(new Error("الاعتراض غير موجود"), { status: 404 });
      const attachment = { id: upload.fileId, fileName: upload.fileName, mimeType: upload.mimeType, sizeBytes: upload.sizeBytes };
      found.attachments = [...(found.attachments ?? []), attachment];
      return ok({ ...upload, id: attachment.id });
    },
  },

  // ===== INTEGRATIONS =====
  integrations: {
    async overview(): Promise<IntegrationsOverview> {
      await delay();
      return ok({
        connections: [
          { id: "wa-demo", provider: "WHATSAPP", nameAr: "واتساب للأعمال", status: "NOT_CONFIGURED" },
          { id: "moyasar-demo", provider: "MOYASAR", nameAr: "ميسر", status: "NOT_CONFIGURED" },
          { id: "carrier-smsa-demo", provider: "CARRIER", nameAr: "سمسا", status: "PENDING" },
        ],
        whatsapp: { status: "NOT_CONFIGURED", webhookVerified: false },
        updatedAt: new Date().toISOString(),
      });
    },
    async events(query?: Record<string, string | number>) {
      await delay();
      return ok({ data: demoIntegrationEvents.slice(0, Number(query?.limit ?? 20)), total: demoIntegrationEvents.length, limit: Number(query?.limit ?? 20), offset: Number(query?.offset ?? 0) });
    },
    async eventDetails(id: string) {
      await delay();
      const found = demoIntegrationEvents.find((item) => item.id === id);
      if (!found) throw Object.assign(new Error("حدث التكامل غير موجود"), { status: 404 });
      return ok(found);
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
      // In demo: bank transfer is auto-approved after a short delay (simulates admin review).
      const amount = req.amount ?? 0;
      const amountHal = req.amountHal ?? Math.round(amount * 100);
      // Auto-credit so the merchant can test the full flow instantly in demo.
      const prevBalance = mockWallet.balance ?? 0;
      mockWallet.balance = prevBalance + amount;
      mockWallet.balanceHal = Math.round(mockWallet.balance * 100);
      const tx: WalletTransaction = {
        id: `tx${Date.now()}`,
        type: "TOPUP",
        direction: "in",
        amount,
        amountHal,
        currency: "SAR",
        description: "شحن المحفظة عبر حوالة بنكية",
        descriptionAr: "شحن المحفظة عبر حوالة بنكية",
        reference: `BT-${Date.now()}`,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        balanceAfter: mockWallet.balance,
        balanceAfterHal: mockWallet.balanceHal,
      };
      mockTransactions.unshift(tx);
      mockNotifications.unshift({
        id: `n${Date.now()}`,
        type: "WALLET",
        title: "تم اعتماد الحوالة البنكية",
        titleAr: "تم اعتماد الحوالة البنكية",
        body: `تم إيداع ${amount.toLocaleString("ar-SA")} ر.س في محفظتك عبر حوالة بنكية. رصيدك الحالي: ${mockWallet.balance.toLocaleString("ar-SA")} ر.س`,
        bodyAr: `تم إيداع ${amount.toLocaleString("ar-SA")} ر.س في محفظتك عبر حوالة بنكية. رصيدك الحالي: ${mockWallet.balance.toLocaleString("ar-SA")} ر.س`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      return ok({
        id: tx.id,
        status: "completed",
        amount,
        paymentUrl: undefined,
      } as TopupResult);
    },
    async bankTransferInstructions() {
      await delay();
      return ok({
        bankName: "مصرف الراجحي",
        bankNameEn: "Al Rajhi Bank",
        accountName: "شركة مسار إكس للخدمات اللوجستية",
        iban: "SA0080000000000000000000",
        swiftCode: "RJHISARI",
        notes: [
          "أرسل إثبات التحويل عبر البريد الإلكتروني support@masarx.sa",
          "يتم اعتماد التحويل خلال 24 ساعة عمل",
          "في وضع التجربة يتم الاعتماد فوراً لاختبار التدفق",
        ],
      });
    },
    async codSummary() {
      await delay();
      return ok({
        total: mockShipmentStats.codTotal ?? 430,
        collected: mockShipmentStats.codCollected ?? 250,
        pending: mockShipmentStats.codPending ?? 180,
        totalCodCollectedHal: mockWallet.codCollectedHal ?? sar(250),
        totalCodPendingHal: mockWallet.codPendingHal ?? sar(180),
        shipmentsCount: 12,
      });
    },
    /**
     * Withdraw available balance / COD to a saved bank account.
     * In demo: debits wallet immediately + records an OUT transaction + notifies.
     */
    async withdraw(_token: string, req: { amount: number; amountHal?: number; bankAccountId: string; note?: string }) {
      await delay(700);
      const amount = req.amount;
      const amountHal = req.amountHal ?? Math.round(amount * 100);
      const bank = (mockUser as UserProfile & { savedBankAccounts?: SavedBankAccount[] }).savedBankAccounts?.find(
        (b) => b.id === req.bankAccountId
      );
      if (!bank) {
        throw Object.assign(new Error("الحساب البنكي المحفوظ غير موجود"), { status: 404 });
      }
      if (amount > (mockWallet.balance ?? 0)) {
        throw Object.assign(new Error("الرصيد غير كافٍ لإتمام السحب"), { status: 400 });
      }
      const prevBalance = mockWallet.balance ?? 0;
      mockWallet.balance = prevBalance - amount;
      mockWallet.balanceHal = Math.round(mockWallet.balance * 100);
      const tx: WalletTransaction = {
        id: `tx${Date.now()}`,
        type: "ADJUSTMENT",
        direction: "out",
        amount,
        amountHal,
        currency: "SAR",
        description: `سحب رصيد إلى ${bank.bankName} (${bank.iban.slice(-4)})`,
        descriptionAr: `سحب رصيد إلى ${bank.bankName} (${bank.iban.slice(-4)})`,
        reference: `WD-${Date.now()}`,
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        balanceAfter: mockWallet.balance,
        balanceAfterHal: mockWallet.balanceHal,
      };
      mockTransactions.unshift(tx);
      mockNotifications.unshift({
        id: `n${Date.now()}`,
        type: "WALLET",
        title: "تم تنفيذ طلب السحب",
        titleAr: "تم تنفيذ طلب السحب",
        body: `تم سحب ${amount.toLocaleString("ar-SA")} ر.س إلى حسابك في ${bank.bankName}. سيصل خلال 1-2 يوم عمل.`,
        bodyAr: `تم سحب ${amount.toLocaleString("ar-SA")} ر.س إلى حسابك في ${bank.bankName}. سيصل خلال 1-2 يوم عمل.`,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      return ok({ ok: true, transactionId: tx.id, status: "COMPLETED" });
    },
  },

  // ===== SAVED BANK ACCOUNTS — managed on the user profile =====
  bankAccounts: {
    async list(): Promise<SavedBankAccount[]> {
      await delay(150);
      const accts = (mockUser as UserProfile & { savedBankAccounts?: SavedBankAccount[] }).savedBankAccounts ?? [];
      return ok(accts);
    },
    async create(payload: Omit<SavedBankAccount, "id" | "createdAt">): Promise<SavedBankAccount> {
      await delay(300);
      const user = mockUser as UserProfile & { savedBankAccounts?: SavedBankAccount[] };
      if (!user.savedBankAccounts) user.savedBankAccounts = [];
      const acct: SavedBankAccount = {
        ...payload,
        id: `ba-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      // If marked default, unset others
      if (acct.isDefault) {
        user.savedBankAccounts.forEach((a) => (a.isDefault = false));
      }
      user.savedBankAccounts.push(acct);
      return ok(acct);
    },
    async update(id: string, patch: Partial<SavedBankAccount>): Promise<SavedBankAccount> {
      await delay(250);
      const user = mockUser as UserProfile & { savedBankAccounts?: SavedBankAccount[] };
      const acct = user.savedBankAccounts?.find((a) => a.id === id);
      if (!acct) throw Object.assign(new Error("الحساب غير موجود"), { status: 404 });
      Object.assign(acct, patch);
      if (patch.isDefault) {
        user.savedBankAccounts?.forEach((a) => {
          if (a.id !== id) a.isDefault = false;
        });
      }
      return ok(acct);
    },
    async delete(id: string): Promise<{ ok: boolean }> {
      await delay(200);
      const user = mockUser as UserProfile & { savedBankAccounts?: SavedBankAccount[] };
      if (user.savedBankAccounts) {
        user.savedBankAccounts = user.savedBankAccounts.filter((a) => a.id !== id);
      }
      return ok({ ok: true });
    },
  },

  /** Verify the user's password (demo: any password ≥ 4 chars is accepted). */
  async verifyPassword(_token: string, password: string) {
    await delay(400);
    if (!password || password.length < 4) {
      throw Object.assign(new Error("كلمة المرور غير صحيحة"), { status: 401, code: "INVALID_PASSWORD" });
    }
    return ok({ ok: true });
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
