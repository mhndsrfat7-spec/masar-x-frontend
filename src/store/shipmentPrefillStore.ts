"use client";

import { create } from "zustand";
import type { Customer } from "@/types/api";

export type ShipmentContactTarget = "sender" | "receiver";

interface ShipmentPrefillState {
  contact: Customer | null;
  target: ShipmentContactTarget | null;
  code: string | null;
  setPrefill: (contact: Customer, target: ShipmentContactTarget, code: string) => void;
  consumePrefill: () => { contact: Customer; target: ShipmentContactTarget; code: string } | null;
}

/** In-memory handoff only. Contact details are deliberately not persisted to localStorage. */
export const useShipmentPrefillStore = create<ShipmentPrefillState>((set, get) => ({
  contact: null,
  target: null,
  code: null,
  setPrefill: (contact, target, code) => set({ contact, target, code }),
  consumePrefill: () => {
    const current = get();
    if (!current.contact || !current.target || !current.code) return null;
    const value = { contact: current.contact, target: current.target, code: current.code };
    set({ contact: null, target: null, code: null });
    return value;
  },
}));
