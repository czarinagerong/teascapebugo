import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, ShoppingBag, Loader2, RefreshCw, Truck, Store,
  Eye, X, Phone, MapPin, Clock, FileText, AlertTriangle,
  ArrowRight, Check, Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStaffOrders, updateOrderStatus } from '../lib/api';
import type { OnlineOrder, OnlineOrderStatus } from '../context/AppContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type StaffOrder = OnlineOrder & { created_at?: string };

// ── Status config ─────────────────────────────────────────────────────────────
// Shortened tab labels so the tab bar stays compact and readable
const STATUS_TABS: { value: OnlineOrderStatus | 'All'; label: string }[] = [
  { value: 'All',                            label: 'All' },
  { value: 'Payment Pending',                label: 'Pending' },
  { value: 'Payment Confirmed',              label: 'Confirmed' },
  { value: 'Preparing',                      label: 'Preparing' },
  { value: 'Delivering / Ready for Pickup',  label: 'Ready' },
  { value: 'Delivered',                      label: 'Delivered' },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; bar: string }> = {
  'Payment Pending':               { bg: 'rgba(230,126,34,0.12)', text: '#E67E22', bar: '#E67E22' },
  'Payment Confirmed':             { bg: 'rgba(184,137,23,0.12)', text: '#b88917', bar: '#b88917' },
  'Preparing':                     { bg: 'rgba(0,122,255,0.10)',  text: '#007AFF', bar: '#007AFF' },
  'Delivering / Ready for Pickup': { bg: 'rgba(26,35,126,0.10)', text: '#3949AB', bar: '#3949AB' },
  'Delivered':                     { bg: 'rgba(61,107,42,0.12)', text: '#3D6B2A', bar: '#3D6B2A' },
};

const NEXT_STATUS: Partial<Record<OnlineOrderStatus, { label: string; next: OnlineOrderStatus; bg: string }>> = {
  'Payment Pending':               { label: 'Confirm Payment', next: 'Payment Confirmed',             bg: '#b88917' },
  'Payment Confirmed':             { label: 'Start Preparing', next: 'Preparing',                     bg: '#007AFF' },
  'Preparing':                     { label: 'Mark Ready',      next: 'Delivering / Ready for Pickup', bg: '#3949AB' },
  'Delivering / Ready for Pickup': { label: 'Mark Delivered',  next: 'Delivered',                     bg: '#3D6B2A' },
};

// ── Date helpers ──────────────────────────────────────────────────────────────
function toYMD(d: Date) { return d.toISOString().slice(0, 10); }
function formatDisplayDate(ymd: string) {
  const today     = toYMD(new Date());
  const yesterday = toYMD(new Date(Date.now() - 86_400_000));
  if (ymd === today)     return 'Today';
  if (ymd === yesterday) return 'Yesterday';
  return new Date(ymd + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── OrderCard (outside component so it doesn't re-create on every render) ─────
function OrderCard({
  order,
  onStatusUpdate,
  onReceiptClick,
}: {
  order: StaffOrder;
  onStatusUpdate: (id: string, status: OnlineOrderStatus) => void;
  onReceiptClick: (url: string) => void;
}) {
  const statusStyle = STATUS_STYLE[order.status] || { bg: 'rgba(107,63,30,0.08)', text: '#6B3F1E', bar: '#6B3F1E' };
  const nextAction  = NEXT_STATUS[order.status as OnlineOrderStatus];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.08)' }}
    >
      {/* Status bar across the top */}
      <div className="h-1 w-full" style={{ backgroundColor: statusStyle.bar }} />

      <div className="p-4 space-y-3">

        {/* Row 1: Order ID + status badge + total */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-mono font-bold shrink-0" style={{ color: '#9C7A5A' }}>
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {order.status}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-base leading-tight" style={{ color: '#6B3F1E' }}>
              ₱{Number(order.total).toLocaleString()}
            </p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: order.payment === 'GCash' ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: order.payment === 'GCash' ? '#007AFF' : '#555',
              }}
            >
              {order.payment}
            </span>
          </div>
        </div>

        {/* Row 2: Items — most important for staff, given top billing */}
        <div
          className="rounded-xl px-3 py-2 text-xs leading-relaxed font-medium"
          style={{ backgroundColor: '#FAF5EE', color: '#3D2010' }}
        >
          {order.items}
        </div>

        {/* Row 3: Customer info */}
        <div className="space-y-0.5">
          <p className="font-semibold text-sm" style={{ color: '#6B3F1E' }}>{order.customer}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: '#9C7A5A' }}>
            {order.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 shrink-0" /> {order.phone}
              </span>
            )}
            {order.address && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{order.address}</span>
              </span>
            )}
            {(order.pickupTime || order.time) && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                {order.pickupTime ? `Pickup: ${order.pickupTime}` : order.time}
              </span>
            )}
          </div>
        </div>

        {/* Special notes */}
        {order.specialNotes && (
          <div
            className="rounded-lg px-2.5 py-1.5 text-[11px] flex items-start gap-1.5"
            style={{ backgroundColor: 'rgba(184,137,23,0.08)', color: '#b88917', border: '1px solid rgba(184,137,23,0.2)' }}
          >
            <FileText className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{order.specialNotes}</span>
          </div>
        )}

        {/* GCash receipt */}
        {order.payment === 'GCash' && (
          order.receiptImage ? (
            <button
              onClick={() => onReceiptClick(order.receiptImage!)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold border w-full hover:bg-blue-50 transition-colors"
              style={{ borderColor: 'rgba(0,122,255,0.2)', color: '#007AFF' }}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              View GCash Receipt
              <img src={order.receiptImage} alt="receipt" className="ml-auto w-6 h-6 object-cover rounded-md" />
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px]"
              style={{ backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7' }}
            >
              <AlertTriangle className="w-3 h-3 shrink-0" /> No Receipt Uploaded
            </div>
          )
        )}

        {/* Action button */}
        {nextAction ? (
          <button
            onClick={() => onStatusUpdate(order.id, nextAction.next)}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ backgroundColor: nextAction.bg }}
          >
            {nextAction.label} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : order.status === 'Delivered' ? (
          <div
            className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
            style={{ backgroundColor: 'rgba(61,107,42,0.1)', color: '#3D6B2A' }}
          >
            <Check className="w-3.5 h-3.5" /> Completed
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OnlineOrders() {
  const { staffToken } = useApp();
  const token = staffToken || sessionStorage.getItem('teascape_staff_session');

  const [orders,     setOrders]     = useState<StaffOrder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab,  setActiveTab]  = useState<OnlineOrderStatus | 'All'>('All');
  const [receiptModal, setReceiptModal] = useState<string | null>(null);

  const todayYMD = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [showPicker,   setShowPicker]   = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true); else setRefreshing(true);
    try {
      const data = await getStaffOrders(token) as StaffOrder[];
      setOrders(data || []);
    } catch (err) {
      console.error('Fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const dateFilteredOrders = useMemo(() => {
    if (selectedDate === 'all') return orders;
    return orders.filter(order =>
      order.created_at
        ? toYMD(new Date(order.created_at)) === selectedDate
        : selectedDate === todayYMD
    );
  }, [orders, selectedDate, todayYMD]);

  const filteredOrders = useMemo(() => {
    return dateFilteredOrders.filter(order => {
      const matchesSearch =
        (order.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.phone || '').includes(searchTerm);
      const matchesTab = activeTab === 'All' || order.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [dateFilteredOrders, searchTerm, activeTab]);

  const deliveryOrders = filteredOrders.filter(o => o.type === 'Delivery');
  const pickupOrders   = filteredOrders.filter(o => o.type !== 'Delivery');

  const getCount = (status: OnlineOrderStatus | 'All') =>
    status === 'All' ? dateFilteredOrders.length : dateFilteredOrders.filter(o => o.status === status).length;

  const handleStatusUpdate = async (orderId: string, newStatus: OnlineOrderStatus) => {
    if (!token) return;
    try {
      await updateOrderStatus(token, orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch {
      alert('Update failed. Please try again.');
    }
  };

  const headerTitle =
    selectedDate === 'all'   ? 'All Orders' :
    selectedDate === todayYMD ? "Today's Orders" :
    `Orders — ${formatDisplayDate(selectedDate)}`;

  if (loading && orders.length === 0) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#b88917' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>

      {/* Receipt modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setReceiptModal(null)}>
          <div className="relative max-w-sm w-full">
            <button className="absolute -top-10 right-0 flex items-center gap-1 text-white text-sm">
              <X className="w-4 h-4" /> Close
            </button>
            <img src={receiptModal} alt="GCash receipt" className="w-full rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* ── Compact sticky header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#fff' }}>

        {/* Top row: title + date picker + refresh */}
        <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="font-bold text-xl truncate"
              style={{ color: '#6B3F1E', fontFamily: "'Playfair Display', serif" }}
            >
              {headerTitle}
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#9C7A5A' }}>
              {new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Date picker */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setShowPicker(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
                style={{
                  borderColor: 'rgba(107,63,30,0.25)',
                  backgroundColor: showPicker ? '#6B3F1E' : '#fff',
                  color: showPicker ? '#fff' : '#6B3F1E',
                }}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {selectedDate === 'all' ? 'All Dates' : formatDisplayDate(selectedDate)}
                </span>
              </button>

              {showPicker && (
                <div
                  className="absolute right-0 mt-2 rounded-2xl shadow-xl overflow-hidden z-20"
                  style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.12)', minWidth: '190px' }}
                >
                  <div className="p-2 border-b" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                    {[
                      { label: 'Today',     value: todayYMD },
                      { label: 'Yesterday', value: toYMD(new Date(Date.now() - 86_400_000)) },
                      { label: 'All Dates', value: 'all' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => { setSelectedDate(opt.value); setShowPicker(false); }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{
                          backgroundColor: selectedDate === opt.value ? '#6B3F1E' : 'transparent',
                          color: selectedDate === opt.value ? '#fff' : '#6B3F1E',
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9C7A5A' }}>Pick a date</p>
                    <input type="date" max={todayYMD}
                      value={selectedDate === 'all' ? '' : selectedDate}
                      onChange={e => { if (e.target.value) { setSelectedDate(e.target.value); setShowPicker(false); } }}
                      className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                      style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#FAF5EE', color: '#6B3F1E', colorScheme: 'light' }} />
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => fetchOrders(true)} disabled={refreshing}
              className="p-2 rounded-xl border"
              style={{ borderColor: 'rgba(107,63,30,0.2)', color: '#6B3F1E' }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 sm:px-5 pb-2 relative">
          <Search className="absolute left-7 sm:left-8 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#9C7A5A' }} />
          <input
            type="text" placeholder="Search by name, ID, or phone…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#FAF5EE', color: '#3D2010' }}
          />
        </div>

        {/* Status tabs — short labels, readable sizing */}
        <div className="px-4 sm:px-5 pb-3 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {STATUS_TABS.map(tab => {
            const count   = getCount(tab.value);
            const isActive = activeTab === tab.value;
            return (
              <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
                style={{
                  backgroundColor: isActive ? '#6B3F1E' : '#fff',
                  color:           isActive ? '#fff'    : '#6B3F1E',
                  borderColor:     isActive ? '#6B3F1E' : 'rgba(107,63,30,0.2)',
                }}>
                {tab.label}
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(107,63,30,0.1)',
                    color:           isActive ? '#fff' : '#6B3F1E',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* ── End header ───────────────────────────────────────────────────── */}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        // Single centered empty state — much cleaner than two side-by-side empties
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <ShoppingBag className="w-12 h-12 mb-4 opacity-20" style={{ color: '#6B3F1E' }} />
          <p className="font-semibold text-sm" style={{ color: '#6B3F1E' }}>No orders found</p>
          <p className="text-xs mt-1" style={{ color: '#9C7A5A' }}>
            {searchTerm || activeTab !== 'All'
              ? 'Try changing your search or filter'
              : selectedDate === todayYMD
                ? "No orders yet today — check back soon"
                : `No orders for ${formatDisplayDate(selectedDate)}`}
          </p>
        </div>
      ) : (
        // md:grid-cols-2 — shows two columns from tablet/medium-laptop width up, not just large screens
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

          {/* Delivery column */}
          <div>
            <div
              className="flex items-center justify-between mb-3 pb-2 border-b"
              style={{ borderColor: 'rgba(26,35,126,0.2)' }}
            >
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#b88917' }}>
                <Truck className="w-4 h-4" /> Delivery Queue
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(26,35,126,0.1)', color: '#3949AB' }}>
                {deliveryOrders.length}
              </span>
            </div>
            {deliveryOrders.length === 0 ? (
              <div className="rounded-2xl py-10 text-center" style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.06)' }}>
                <Truck className="w-7 h-7 mx-auto mb-2 opacity-20" style={{ color: '#3949AB' }} />
                <p className="text-xs" style={{ color: '#9C7A5A' }}>No deliveries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryOrders.map(order => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} onReceiptClick={setReceiptModal} />
                ))}
              </div>
            )}
          </div>

          {/* Pickup column */}
          <div>
            <div
              className="flex items-center justify-between mb-3 pb-2 border-b"
              style={{ borderColor: 'rgba(74,40,16,0.2)' }}
            >
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#b88917' }}>
                <Store className="w-4 h-4" /> Pickup Queue
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(74,40,16,0.1)', color: '#4A2810' }}>
                {pickupOrders.length}
              </span>
            </div>
            {pickupOrders.length === 0 ? (
              <div className="rounded-2xl py-10 text-center" style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.06)' }}>
                <Store className="w-7 h-7 mx-auto mb-2 opacity-20" style={{ color: '#4A2810' }} />
                <p className="text-xs" style={{ color: '#9C7A5A' }}>No pickups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pickupOrders.map(order => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} onReceiptClick={setReceiptModal} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}