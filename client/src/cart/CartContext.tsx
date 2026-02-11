import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, Product } from "../types";

type CartContextValue = {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const LS_KEY = "varshaAyurveda.cart.v1";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartContextValue>(() => {
    return {
      items,
      add(product, qty = 1) {
        setItems((prev) => {
          const next = [...prev];
          const idx = next.findIndex((x) => x.product.id === product.id);
          if (idx >= 0) {
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          next.push({ product, qty });
          return next;
        });
      },
      remove(productId) {
        setItems((prev) => prev.filter((x) => x.product.id !== productId));
      },
      setQty(productId, qty) {
        const safe = Math.max(1, Math.floor(qty || 1));
        setItems((prev) =>
          prev.map((x) => (x.product.id === productId ? { ...x, qty: safe } : x))
        );
      },
      clear() {
        setItems([]);
      },
      count: items.reduce((sum, x) => sum + x.qty, 0),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
