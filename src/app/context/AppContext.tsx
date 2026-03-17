import React, { createContext, useContext, useState, useCallback } from 'react';

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
}

export interface PlacedOrder extends OrderInfo {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  placedAt: Date;
}

export type OnlineOrderStatus = 'Pending' | 'Preparing' | 'Rider Assigned' | 'Ready for Pick Up' | 'Done' | 'Delivered';

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
  isCustomerOrder?: boolean;
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
  addCustomerOrder: (order: OnlineOrder) => void;
  updateCustomerOrderStatus: (id: string, status: OnlineOrderStatus) => void;
}

// Use a globalThis singleton so the context object survives Vite HMR module re-execution.
// Without this, each HMR update creates a new context object, causing provider/consumer mismatches.
const CTX_KEY = Symbol.for('teascape_app_context_v1');
type G = typeof globalThis & { [CTX_KEY]?: React.Context<AppContextType | null> };
const AppContext: React.Context<AppContextType | null> =
  (globalThis as G)[CTX_KEY] ??
  ((globalThis as G)[CTX_KEY] = createContext<AppContextType | null>(null));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OnlineOrder[]>([]);

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
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
    }
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const addCustomerOrder = useCallback((order: OnlineOrder) => {
    setCustomerOrders(prev => [order, ...prev]);
  }, []);

  const updateCustomerOrderStatus = useCallback((id: string, status: OnlineOrderStatus) => {
    setCustomerOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AppContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartCount, cartSubtotal,
      orderInfo, setOrderInfo,
      placedOrder, setPlacedOrder,
      customerOrders, addCustomerOrder, updateCustomerOrderStatus,
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