/**
 * Endpoint helpers — map 1:1 to the OpenAPI spec paths.
 * All paths are RELATIVE to the api/v1 prefix (added by the apiClient).
 */

export const Endpoints = {
  auth: {
    otpRequest: "/auth/otp/request",
    otpVerify: "/auth/otp/verify",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
    locale: "/auth/locale",
    staffLogin: "/auth/staff/login",
    staffLogout: "/auth/staff/logout",
    staffRefresh: "/auth/staff/refresh",
    staffMe: "/auth/staff/me",
    staffChangePassword: "/auth/staff/change-password",
  },
  public: {
    quote: "/public/quote",
    cities: "/public/cities",
    carriersActive: "/public/carriers/active",
    track: (trackingNumber: string) =>
      `/public/track/${encodeURIComponent(trackingNumber)}`,
  },
  shipments: {
    quote: "/shipments/quote",
    list: "/shipments",
    create: "/shipments",
    stats: "/shipments/stats",
    details: (id: string) => `/shipments/${encodeURIComponent(id)}`,
    confirm: (id: string) => `/shipments/${encodeURIComponent(id)}/confirm`,
    label: (id: string) => `/shipments/${encodeURIComponent(id)}/label`,
    labelFile: (id: string) => `/shipments/${encodeURIComponent(id)}/label-file`,
    cancel: (id: string) => `/shipments/${encodeURIComponent(id)}/cancel`,
  },
  customers: {
    list: "/customers",
    create: "/customers",
    details: (id: string) => `/customers/${encodeURIComponent(id)}`,
  },
  stores: {
    me: "/stores/me",
  },
  wallet: {
    balance: "/wallet",
    transactions: "/wallet/transactions",
    topup: "/wallet/topup",
    topupStatus: (id: string) => `/wallet/topup/${encodeURIComponent(id)}`,
    topupBankTransfer: "/wallet/topup/bank-transfer",
    topupBankTransferInstructions: "/wallet/topup/bank-transfer/instructions",
    codSummary: "/wallet/cod-summary",
  },
  invoices: {
    list: "/invoices",
    details: (id: string) => `/invoices/${encodeURIComponent(id)}`,
    pdf: (id: string) => `/invoices/${encodeURIComponent(id)}/pdf`,
    print: (id: string) => `/invoices/${encodeURIComponent(id)}/print`,
  },
  notifications: {
    list: "/notifications",
    read: "/notifications/read",
  },
  uploads: {
    presign: "/uploads/presign",
  },
  admin: {
    dashboardKpis: "/admin/dashboard/kpis",
    shipments: "/admin/shipments",
    shipmentDetails: (id: string) => `/admin/shipments/${encodeURIComponent(id)}`,
    shipmentStatus: (id: string) =>
      `/admin/shipments/${encodeURIComponent(id)}/status`,
    shipmentCancel: (id: string) =>
      `/admin/shipments/${encodeURIComponent(id)}/cancel`,
    shipmentAdjustWeight: (id: string) =>
      `/admin/shipments/${encodeURIComponent(id)}/adjust-weight`,
    merchants: "/admin/merchants",
    merchantDetails: (id: string) => `/admin/merchants/${encodeURIComponent(id)}`,
    merchantSuspend: (id: string) =>
      `/admin/merchants/${encodeURIComponent(id)}/suspend`,
    merchantActivate: (id: string) =>
      `/admin/merchants/${encodeURIComponent(id)}/activate`,
    carriers: "/admin/carriers",
    carrierDetails: (id: string) => `/admin/carriers/${encodeURIComponent(id)}`,
    carrierActivate: (id: string) =>
      `/admin/carriers/${encodeURIComponent(id)}/activate`,
    carrierDeactivate: (id: string) =>
      `/admin/carriers/${encodeURIComponent(id)}/deactivate`,
    carrierCapabilities: (id: string) =>
      `/admin/carriers/${encodeURIComponent(id)}/capabilities`,
    carrierApiConfig: (id: string) =>
      `/admin/carriers/${encodeURIComponent(id)}/api-config`,
    carrierTestConnection: (id: string) =>
      `/admin/carriers/${encodeURIComponent(id)}/test-connection`,
    pricingRules: "/admin/pricing-rules",
    pricingRule: (id: string) => `/admin/pricing-rules/${encodeURIComponent(id)}`,
    topups: "/admin/topups",
    topupApprove: (id: string) =>
      `/admin/topups/${encodeURIComponent(id)}/approve`,
    topupReject: (id: string) =>
      `/admin/topups/${encodeURIComponent(id)}/reject`,
    staff: "/admin/staff",
    auditLogs: "/admin/audit-logs",
    auditLog: (id: string) => `/admin/audit-logs/${encodeURIComponent(id)}`,
    settings: "/admin/settings",
    reportsCarrierPerformance: "/admin/reports/carrier-performance",
    reportsWalletNegative: "/admin/reports/wallet-negative",
  },
  webhooks: {
    whatsapp: "/webhooks/whatsapp",
    moyasar: "/webhooks/moyasar",
    carrier: (code: string) => `/webhooks/carriers/${encodeURIComponent(code)}`,
  },
  system: {
    health: "/../health",
    ready: "/../ready",
  },
} as const;
