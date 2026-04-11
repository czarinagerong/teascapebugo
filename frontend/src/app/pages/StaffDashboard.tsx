import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShoppingBag, DollarSign, Clock, ChefHat, Truck, Store, CreditCard, Wallet, Sun, Coffee, Moon, Power, AlertTriangle, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getStaffOrders, toggleStore, getStoreStatus } from '../lib/api';
import type { OnlineOrder } from '../context/AppContext';

const PIE_COLORS = ['#b88917', '#6B3F1E'];
const HOUR_LABELS = ['7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 18) return { text: 'Good afternoon', Icon: Coffee };
  return { text: 'Good evening', Icon: Moon };
}

function parseHour(timeStr: string): number {
  try {
    const [timePart, meridiem] = timeStr.trim().split(' ');
    let [h] = timePart.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h;
  } catch { return -1; }
}

function getTopItems(orders: OnlineOrder[]) {
  const map: Record<string, { qty: number; sales: number }> = {};
  for (const o of orders) {
    const parts = o.items.split(',').map(s => s.trim());
    for (const part of parts) {
      // Matches format: "Item Name – Flavor (Size) x2"
      const match = part.match(/^(.+)\s+x(\d+)$/);
      const qty = match ? parseInt(match[2]) : 1;
      const rawName = match ? match[1] : part;
      // Strip flavor (– Matcha) and size ((M)) leaving just base name
      const name = rawName
        .replace(/\s*–.*/, '')
        .replace(/\s*\(.*\)/, '')
        .trim();
      if (!map[name]) map[name] = { qty: 0, sales: 0 };
      map[name].qty += qty;
      map[name].sales += Math.round((o.total / parts.length) * qty);
    }
  }
  return Object.entries(map)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([item, v], i) => ({ rank: i + 1, item, qty: v.qty, sales: v.sales }));
}

// ── date helpers ──────────────────────────────────────────────────────────────
function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(ymd: string) {
  if (ymd === 'all') return 'All Dates';
  const d = new Date(ymd + 'T00:00:00');
  const today = toYMD(new Date());
  const yesterday = toYMD(new Date(Date.now() - 86_400_000));
  if (ymd === today)     return 'Today';
  if (ymd === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
// ─────────────────────────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const { staffToken } = useApp();
  const token = staffToken || sessionStorage.getItem('teascape_staff_session') || '';

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [now, setNow] = useState(new Date());
  const [storeOpen, setStoreOpen] = useState(true);
  const [closeReason, setCloseReason] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReasonInput, setCloseReasonInput] = useState('');
  const [togglingStore, setTogglingStore] = useState(false);

  // ── date filter state ─────────────────────────────────────────────────────
  const todayYMD = toYMD(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getStaffOrders(token);
      setOrders(data);
    } catch {}
  }, [token]);

  const fetchStoreStatus = useCallback(async () => {
  try {
    const data = await getStoreStatus();
    setStoreOpen(data.isOpen);
    setCloseReason(data.closeReason || '');
  } catch {}
}, []);

  useEffect(() => {
    fetchOrders();
    fetchStoreStatus();
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStoreStatus]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleToggleStore = async (open: boolean, reason = '') => {
    setTogglingStore(true);
    try {
      await toggleStore(token, open, reason);
      setStoreOpen(open);
      setCloseReason(reason);
      setShowCloseModal(false);
      setCloseReasonInput('');
    } catch { alert('Failed to update store status.'); }
    finally { setTogglingStore(false); }
  };

  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const { text: greeting, Icon: GreetIcon } = getGreeting();

  // ── filter orders by selected date ───────────────────────────────────────
  const dateFilteredOrders = useMemo(() => {
    if (selectedDate === 'all') return orders;
    return orders.filter(o => {
      if (!o.created_at) return selectedDate === todayYMD;
      return toYMD(new Date(o.created_at)) === selectedDate;
    });
  }, [orders, selectedDate, todayYMD]);
  // ─────────────────────────────────────────────────────────────────────────

  // ── ALL references inside use dateFilteredOrders ─────────────────────────
  const stats = useMemo(() => {
    const completed = dateFilteredOrders.filter(o => o.status === 'Delivered');
    const pending   = dateFilteredOrders.filter(o => o.status === 'Payment Pending' || o.status === 'Payment Confirmed');
    const preparing = dateFilteredOrders.filter(o => o.status === 'Preparing');
    const delivery  = dateFilteredOrders.filter(o => o.type === 'Delivery');
    const pickup    = dateFilteredOrders.filter(o => o.type === 'Pickup');
    const gcash     = completed.filter(o => o.payment === 'GCash');
    const cash      = completed.filter(o => o.payment === 'Cash');

    const totalSales = completed.reduce((s, o) => s + Number(o.total), 0);
    const gcashTotal = gcash.reduce((s, o) => s + Number(o.total), 0);
    const cashTotal  = cash.reduce((s, o) => s + Number(o.total), 0);

    const hourlyMap: Record<number, number> = {};
    for (const o of dateFilteredOrders) {
      const h = parseHour(o.time);
      if (h >= 7 && h <= 21) hourlyMap[h] = (hourlyMap[h] || 0) + 1;
    }
    const hourlyData = HOUR_LABELS.map((label, i) => ({ hour: label, orders: hourlyMap[i + 7] || 0 }));
    const pieData = [{ name: 'Delivery', value: delivery.length }, { name: 'Pickup', value: pickup.length }];
    const topItems = getTopItems(completed);
    const recentActivity = [...completed].reverse().slice(0, 10)
      .map(o => ({ name: o.customer, type: o.type, items: o.items, total: o.total, time: o.time }));

    return { totalOrders: completed.length, totalSales, pendingCount: pending.length, preparingCount: preparing.length, deliveryCount: delivery.length, pickupCount: pickup.length, gcashTotal, cashTotal, hourlyData, pieData, topItems, recentActivity };
  }, [dateFilteredOrders]);
  // ────────────────────────────────────────────────────────────────────────────

  const summaryCards = [
    { label: 'Total Orders',    value: String(stats.totalOrders),               icon: ShoppingBag, color: '#6B3F1E', bg: 'rgba(107,63,30,0.1)' },
    { label: 'Total Sales',     value: `₱${stats.totalSales.toLocaleString()}`, icon: DollarSign,  color: '#6B3F1E', bg: 'rgba(107,63,30,0.1)' },
    { label: 'Pending',         value: String(stats.pendingCount),              icon: Clock,       color: '#E67E22', bg: 'rgba(230,126,34,0.1)' },
    { label: 'Preparing',       value: String(stats.preparingCount),            icon: ChefHat,     color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
    { label: 'Delivery Orders', value: String(stats.deliveryCount),             icon: Truck,       color: '#1A237E', bg: 'rgba(26,35,126,0.1)' },
    { label: 'Pickup Orders',   value: String(stats.pickupCount),               icon: Store,       color: '#4A2810', bg: 'rgba(74,40,16,0.1)' },
    { label: 'GCash Total',     value: `₱${stats.gcashTotal.toLocaleString()}`, icon: CreditCard,  color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
    { label: 'Cash Total',      value: `₱${stats.cashTotal.toLocaleString()}`,  icon: Wallet,      color: '#555',    bg: 'rgba(0,0,0,0.06)' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Top Bar */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm" style={{ backgroundColor: '#fff' }}>
        <div>
          <h1 className="flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.4rem', fontWeight: 700 }}>
            <GreetIcon className="w-5 h-5" style={{ color: '#b88917' }} />
            {greeting}!
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>{dateStr}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">

          {/* ── Date Picker ──────────────────────────────────────────────── */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
              style={{
                borderColor: 'rgba(107,63,30,0.25)',
                backgroundColor: showPicker ? '#6B3F1E' : '#FAF5EE',
                color: showPicker ? '#fff' : '#6B3F1E',
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {formatDisplayDate(selectedDate)}
            </button>

            {showPicker && (
              <div
                className="absolute right-0 mt-2 rounded-2xl shadow-xl overflow-hidden z-20"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.12)', minWidth: '200px' }}
              >
                <div className="p-2 border-b" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                  {[
                    { label: 'Today',     value: todayYMD },
                    { label: 'Yesterday', value: toYMD(new Date(Date.now() - 86_400_000)) },
                    { label: 'All Dates', value: 'all' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedDate(opt.value); setShowPicker(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                      style={{
                        backgroundColor: selectedDate === opt.value ? '#6B3F1E' : 'transparent',
                        color: selectedDate === opt.value ? '#fff' : '#6B3F1E',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#9C7A5A' }}>Pick a date</p>
                  <input
                    type="date"
                    max={todayYMD}
                    value={selectedDate === 'all' ? '' : selectedDate}
                    onChange={e => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                        setShowPicker(false);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                    style={{
                      borderColor: 'rgba(107,63,30,0.2)',
                      backgroundColor: '#FAF5EE',
                      color: '#6B3F1E',
                      colorScheme: 'light',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${storeOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs font-semibold" style={{ color: storeOpen ? '#3D6B2A' : '#e53e3e' }}>
              {storeOpen ? 'Store Open' : 'Store Closed'}
            </span>
            {storeOpen ? (
              <button onClick={() => setShowCloseModal(true)} disabled={togglingStore}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: '#e53e3e' }}>
                <Power className="w-3.5 h-3.5" /> Close Store
              </button>
            ) : (
              <button onClick={() => handleToggleStore(true)} disabled={togglingStore}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(61,107,42,0.1)', color: '#3D6B2A' }}>
                <Power className="w-3.5 h-3.5" /> Open Store
              </button>
            )}
          </div>
          <p className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-body)', fontSize: '1.2rem', letterSpacing: '0.02em' }}>{timeStr}</p>
        </div>
      </div>

      {/* Store closed banner */}
      {!storeOpen && (
        <div className="mx-4 mt-4 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#e53e3e' }} />
          <p className="text-sm" style={{ color: '#e53e3e' }}>
            <strong>Store is currently closed.</strong>
            {closeReason && ` Reason: ${closeReason}`}
            {' '}Customers cannot place orders.
          </p>
        </div>
      )}

      {/* Date context banner (shown when not viewing today) */}
      {selectedDate !== todayYMD && (
        <div className="mx-4 mt-4 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: 'rgba(184,137,23,0.08)', border: '1px solid rgba(184,137,23,0.2)' }}>
          <Calendar className="w-4 h-4 shrink-0" style={{ color: '#b88917' }} />
          <p className="text-sm" style={{ color: '#b88917' }}>
            Showing data for <strong>{formatDisplayDate(selectedDate)}</strong>.
          </p>
          <button
            onClick={() => setSelectedDate(todayYMD)}
            className="ml-auto text-xs font-semibold underline"
            style={{ color: '#b88917' }}
          >
            Back to today
          </button>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {summaryCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: '#fff' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs leading-snug" style={{ color: '#5C2A0A' }}>{card.label}</p>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                    <Icon className="w-5 h-5" style={{ color: card.color }} />
                  </div>
                </div>
                <p style={{ color: card.color, fontFamily: 'var(--font-body)', fontSize: '1.4rem', fontWeight: 700 }}>{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Hourly Orders</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#5C2A0A' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5C2A0A' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #D4A96A44', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="orders" fill="#b88917" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Delivery vs Pickup</h3>
            {stats.pieData.every(d => d.value === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'rgba(107,63,30,0.35)' }}>No orders yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {stats.pieData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #D4A96A44', borderRadius: '12px', fontSize: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(107,63,30,0.1)' }}>
              <h3 className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Top 5 Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#FAF5EE' }}>
                    {['#','Item','Qty','Sales'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B42' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.topItems.map(item => (
                    <tr key={item.rank} className="border-t hover:bg-green-50/30 transition-colors" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                      <td className="px-5 py-3">
                        <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: item.rank===1?'#3D6B2A':item.rank===2?'#e8e8e8':item.rank===3?'#f0d8a8':'transparent', color: item.rank<=3?(item.rank===1?'#fff':'#5C2A0A'):'#5C2A0A' }}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium" style={{ color: '#6B3F1E' }}>{item.item}</td>
                      <td className="px-3 py-3 text-right font-semibold" style={{ color: '#6B3F1E' }}>{item.qty}</td>
                      <td className="px-5 py-3 text-right font-semibold" style={{ color: '#6B3F1E' }}>₱{item.sales.toLocaleString()}</td>
                    </tr>
                  ))}
                  {stats.topItems.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: 'rgba(107,63,30,0.4)' }}>No sales data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(107,63,30,0.1)' }}>
              <h3 className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
            </div>
            <div className="divide-y overflow-y-auto" style={{ maxHeight: '280px' }}>
              {stats.recentActivity.length === 0 && (
                <div className="px-5 py-10 text-center text-sm" style={{ color: 'rgba(107,63,30,0.4)' }}>No activity yet.</div>
              )}
              {stats.recentActivity.map((act, idx) => (
                <div key={idx} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold" style={{ color: '#6B3F1E' }}>{act.name}</p>
                    <p className="text-xs" style={{ color: '#5C2A0A' }}>{act.time}</p>
                  </div>
                  <p className="text-xs line-clamp-1" style={{ color: '#5C2A0A' }}>{act.items}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: act.type==='Delivery'?'rgba(26,35,126,0.1)':'rgba(74,40,16,0.1)', color: act.type==='Delivery'?'#1A237E':'#4A2810' }}>
                      {act.type}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#6B3F1E' }}>₱{act.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Close Store Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCloseModal(false); }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#fff' }}>
            <div className="px-5 py-4" style={{ backgroundColor: '#4A2810' }}>
              <h3 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Close Store</h3>
              <p className="text-white/70 text-xs mt-0.5">Customers will not be able to place orders while closed.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>
                  Reason (optional)
                </label>
                <input type="text" value={closeReasonInput} onChange={e => setCloseReasonInput(e.target.value)}
                  placeholder="e.g. Holiday, Special event, Maintenance..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#FAFAFA', color: '#3D2010' }} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: 'rgba(107,63,30,0.2)', color: '#6B3F1E' }}>Cancel</button>
                <button onClick={() => handleToggleStore(false, closeReasonInput)} disabled={togglingStore}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#e53e3e' }}>
                  {togglingStore ? 'Closing...' : 'Close Store'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}