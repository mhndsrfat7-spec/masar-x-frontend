"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RouteName =
  | "login"
  | "register"
  | "dashboard"
  | "shipments"
  | "shipment-details"
  | "create-shipment"
  | "wallet"
  | "address-book"
  | "address-lookup"
  | "weight-disputes"
  | "carriers"
  | "integrations"
  | "customers"
  | "invoices"
  | "tracking"
  | "notifications"
  | "profile"
  | "settings";

export interface RouteParams {
  id?: string;
  trackingNumber?: string;
  tab?: string;
  contactType?: "sender" | "receiver" | "both";
  contactId?: string;
  [k: string]: string | undefined;
}

interface RouterState {
  route: RouteName;
  params: RouteParams;
  navigate: (route: RouteName, params?: RouteParams) => void;
  back: () => void;
  history: Array<{ route: RouteName; params: RouteParams }>;
}

export const useRouterStore = create<RouterState>()(
  persist(
    (set, get) => ({
      route: "login",
      params: {},
      history: [],
      navigate: (route, params = {}) =>
        set((st) => ({
          history: [
            ...st.history,
            { route: st.route, params: st.params },
          ].slice(-20),
          route,
          params,
        })),
      back: () =>
        set((st) => {
          if (st.history.length === 0) return st;
          const last = st.history[st.history.length - 1];
          return {
            route: last.route,
            params: last.params,
            history: st.history.slice(0, -1),
          };
        }),
    }),
    {
      name: "masarx-router",
      partialize: (s) => ({ route: s.route, params: s.params }),
    }
  )
);
