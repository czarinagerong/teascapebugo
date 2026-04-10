import type { OnlineOrder } from '../context/AppContext';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    if (res.status === 429) throw new Error('Too many attempts. Please wait 15 minutes.');
    if (res.status === 409) return data as T;
    throw new Error(message);
  }
  return data as T;
}

// ── Receipt ───────────────────────────────────────────────────────────────────
export async function uploadReceipt(base64: string, orderId: string, mimeType: string): Promise<string> {
  const r = await apiFetch<{ url: string }>('/upload/receipt', { method: 'POST', body: JSON.stringify({ base64, orderId, mimeType }) });
  return r.url;
}

export async function attachReceipt(orderId: string, receiptUrl: string): Promise<void> {
  await apiFetch(`/orders/${orderId}/receipt`, { method: 'PATCH', body: JSON.stringify({ receipt_url: receiptUrl }) });
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function placeOrder(order: {
  id: string; customer_name: string; phone: string; items: string;
  total: number; payment: string; order_type: string; status: string;
  address?: string; pickup_time?: string; special_notes?: string; receipt_url?: string;
}): Promise<{ success: boolean; id: string }> {
  return apiFetch('/orders', { method: 'POST', body: JSON.stringify(order) });
}

export async function trackOrder(query: string): Promise<OnlineOrder | null> {
  try { return await apiFetch<OnlineOrder>(`/orders/${encodeURIComponent(query)}`); }
  catch (err) { if (err instanceof Error && err.message.includes('not found')) return null; throw err; }
}

export async function cancelOrder(orderId: string): Promise<void> {
  await apiFetch(`/orders/${orderId}`, { method: 'DELETE' });
}

// ── Staff auth ────────────────────────────────────────────────────────────────
export async function staffLogin(username: string, password: string): Promise<{ token: string; username: string }> {
  return apiFetch('/staff/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export async function getStaffOrders(token: string): Promise<OnlineOrder[]> {
  return apiFetch('/staff/orders', { headers: { Authorization: `Bearer ${token}` } });
}

export async function updateOrderStatus(token: string, orderId: string, status: string): Promise<void> {
  await apiFetch(`/staff/orders/${orderId}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
}

// ── Store status ──────────────────────────────────────────────────────────────
export async function toggleStore(token: string, isOpen: boolean, closeReason: string): Promise<void> {
  await apiFetch('/staff/store', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ isOpen, closeReason }) });
}

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  available: boolean;
  image_url?: string;
  price_m?: number;
  price_l?: number;
  sizes?: string;
  flavors?: string;
  addons?: string;
}

export async function getMenuItems(token: string): Promise<MenuItem[]> {
  return apiFetch('/staff/menu', { headers: { Authorization: `Bearer ${token}` } });
}
export async function saveMenuItem(token: string, item: Partial<MenuItem>): Promise<{ success: boolean; id: string }> {
  return apiFetch('/staff/menu', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(item) });
}
export async function updateMenuItem(token: string, id: string, updates: Partial<MenuItem>): Promise<void> {
  await apiFetch(`/staff/menu/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(updates) });
}
export async function deleteMenuItem(token: string, id: string): Promise<void> {
  await apiFetch(`/staff/menu/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export interface InventoryItem { id: string; item: string; category: string; stock: number; unit: string; min_stock: number; }
export interface InventoryLog { id: string; item_name: string; type: 'Added'|'Deducted'; qty: number; remaining: number; unit: string; staff: string; created_at: string; }

export async function getInventory(token: string): Promise<InventoryItem[]> {
  return apiFetch('/staff/inventory', { headers: { Authorization: `Bearer ${token}` } });
}
export async function saveInventoryItem(token: string, item: Partial<InventoryItem>): Promise<{ success: boolean; id: string }> {
  return apiFetch('/staff/inventory', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(item) });
}
export async function updateInventoryStock(token: string, id: string, qty: number, type: 'add'|'deduct'): Promise<{ newStock: number }> {
  return apiFetch(`/staff/inventory/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ qty, type }) });
}
export async function deleteInventoryItem(token: string, id: string): Promise<void> {
  await apiFetch(`/staff/inventory/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}
export async function getInventoryLogs(token: string): Promise<InventoryLog[]> {
  return apiFetch('/staff/inventory/logs', { headers: { Authorization: `Bearer ${token}` } });
}
export async function uploadMenuImage(base64: string, mimeType: string): Promise<string> {
  const r = await apiFetch<{ url: string }>('/upload/menu-image', {
    method: 'POST',
    body: JSON.stringify({ base64, mimeType }),
  });
  return r.url;
}

export async function getPublicMenuItems(): Promise<MenuItem[]> {
  return apiFetch('/menu/items');
}