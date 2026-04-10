// src/context/AppContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { placeOrder, attachReceipt } from '../lib/api';

export interface CartItem {
  id: string;
  name: string;
  category: string;
  size?: string;
  flavor?: string;
  addons?: string[];
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderInfo {
  name: string;
  phone: string;
  orderType: 'pickup' | 'delivery';
  address?: string;
  distance?: number;
  deliveryFee?: number;
  payment: 'gcash' | 'cash';
  pickupTime?: string;
  specialNotes?: string;
}

export interface PlacedOrder extends OrderInfo {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  placedAt: Date;
  receiptImage?: string;
}

export type OnlineOrderStatus =
  | 'Payment Pending'
  | 'Payment Confirmed'
  | 'Preparing'
  | 'Delivering / Ready for Pickup'
  | 'Delivered';

export interface OnlineOrder {
  id: string;
  customer: string;
  phone: string;
  items: string;
  total: number;
  payment: 'GCash' | 'Cash';
  type: 'Delivery' | 'Pickup';
  time: string;
  status: OnlineOrderStatus;
  address?: string;
  pickupTime?: string;
  receiptImage?: string;
  isCustomerOrder?: boolean;
  specialNotes?: string;
}

interface AppContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  orderInfo: OrderInfo | null;
  setOrderInfo: (info: OrderInfo) => void;
  placedOrder: PlacedOrder | null;
  setPlacedOrder: (order: PlacedOrder) => void;

  customerOrders: OnlineOrder[];
  addCustomerOrder: (order: OnlineOrder) => Promise<void>;
  attachReceiptToOrder: (orderId: string, receiptUrl: string) => Promise<void>;
  updateCustomerOrderStatus: (id: string, status: OnlineOrderStatus) => void;

  staffToken: string | null;
  staffUsername: string | null;
  setStaffAuth: (token: string, username: string) => void;
  clearStaffAuth: () => void;
}

const STORAGE_KEY = 'teascape_orders_v2';

function loadOrdersFromStorage(): OnlineOrder[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as OnlineOrder[];
  } catch {}
  return [];
}

function saveOrdersToStorage(orders: OnlineOrder[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {}
}

const CTX_KEY = Symbol.for('teascape_app_context_v2');
type G = typeof globalThis & { [CTX_KEY]?: React.Context<AppContextType | null> };
const AppContext: React.Context<AppContextType | null> =
  (globalThis as G)[CTX_KEY] ??
  ((globalThis as G)[CTX_KEY] = createContext<AppContextType | null>(null));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OnlineOrder[]>(loadOrdersFromStorage);
  const [staffToken, setStaffToken] = useState<string | null>(null);
  const [staffUsername, setStaffUsername] = useState<string | null>(null);

  useEffect(() => {
    saveOrdersToStorage(customerOrders);
  }, [customerOrders]);

  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCart(prev => {
      const key = `${newItem.id}-${newItem.size || ''}-${newItem.flavor || ''}-${(newItem.addons || []).join(',')}`;
      const existing = prev.find(
        item => `${item.id}-${item.size || ''}-${item.flavor || ''}-${(item.addons || []).join(',')}` === key
      );
      if (existing) {
        return prev.map(item =>
          `${item.id}-${item.size || ''}-${item.flavor || ''}-${(item.addons || []).join(',')}` === key
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Save order to backend immediately (before receipt upload) ──────────────
  // This ensures the order is safe in Supabase even if the customer
  // loses internet, closes the tab, or refreshes on the payment page.
  const addCustomerOrder = useCallback(async (order: OnlineOrder) => {
    // 1. Add to local state immediately
    setCustomerOrders(prev => [order, ...prev]);

    // 2. Save to backend right away — no waiting for receipt
    try {
      await placeOrder({
        id: order.id,
        customer_name: order.customer,
        phone: order.phone,
        items: order.items,
        total: order.total,
        payment: order.payment,
        order_type: order.type,
        status: order.status,
        address: order.address,
        pickup_time: order.pickupTime,
        special_notes: order.specialNotes,
        receipt_url: order.receiptImage,
      });
    } catch (err) {
      console.warn('[Teascape] Backend not available, order saved locally only:', err);
    }
  }, []);

  // ── Attach receipt URL to an already-saved order ──────────────────────────
  const attachReceiptToOrder = useCallback(async (orderId: string, receiptUrl: string) => {
    // Update local state
    setCustomerOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, receiptImage: receiptUrl } : o)
    );
    // Update in backend
    try {
      await attachReceipt(orderId, receiptUrl);
    } catch (err) {
      console.warn('[Teascape] Could not attach receipt to backend:', err);
    }
  }, []);

  const updateCustomerOrderStatus = useCallback((id: string, status: OnlineOrderStatus) => {
    setCustomerOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, []);

  const setStaffAuth = useCallback((token: string, username: string) => {
    setStaffToken(token);
    setStaffUsername(username);
  }, []);

  const clearStaffAuth = useCallback(() => {
    setStaffToken(null);
    setStaffUsername(null);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AppContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartSubtotal,
      orderInfo, setOrderInfo,
      placedOrder, setPlacedOrder,
      customerOrders, addCustomerOrder, attachReceiptToOrder,
      updateCustomerOrderStatus,
      staffToken, staffUsername, setStaffAuth, clearStaffAuth,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}