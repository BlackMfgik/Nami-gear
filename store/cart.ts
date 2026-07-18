"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (item: Omit<CartItem, "quantity">) => void;
  changeQuantity: (key: string, delta: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const useCart = create<CartStore>()(persist((set) => ({
  items: [],
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  add: (newItem) => set((state) => {
    const existing = state.items.find((item) => item.key === newItem.key);
    return {
      isOpen: true,
      items: existing
        ? state.items.map((item) => item.key === newItem.key ? { ...item, quantity: item.quantity + 1 } : item)
        : [...state.items, { ...newItem, quantity: 1 }]
    };
  }),
  changeQuantity: (key, delta) => set((state) => ({
    items: state.items
      .map((item) => item.key === key ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0)
  })),
  remove: (key) => set((state) => ({ items: state.items.filter((item) => item.key !== key) })),
  clear: () => set({ items: [] })
}), { name: "nami-cart", version: 1, partialize: (state) => ({ items: state.items }) }));
