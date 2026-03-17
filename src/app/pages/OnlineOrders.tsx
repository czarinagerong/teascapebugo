import { useState } from 'react';
import {
  Search, X, Phone, MapPin, Printer, CheckCircle,
  ShoppingBag, Bike, Package, Smartphone, User, ClipboardCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OnlineOrder, OnlineOrderStatus } from '../context/AppContext';

const STATUS_COLORS: Record<OnlineOrderStatus, { bg: string; text: string }> = {
  Pending:              { bg: 'rgba(230,126,34,0.12)',  text: '#E67E22' },
  Preparing:            { bg: 'rgba(0,122,255,0.12)',   text: '#007AFF' },
  'Ready for Pick Up':  { bg: 'rgba(255,193,7,0.18)',   text: '#7a5c00' },
  Done:                 { bg: 'rgba(61,107,42,0.12)',   text: '#3D6B2A' },
  'Rider Assigned':     { bg: 'rgba(103,58,183,0.12)',  text: '#673AB7' },
  Delivered:            { bg: 'rgba(107,63,30,0.12)',   text: '#6B3F1E' },
};

const ALL_STATUS_TABS: (OnlineOrderStatus | 'All')[] = [
  'All', 'Pending', 'Preparing', 'Ready for Pick Up', 'Done', 'Rider Assigned', 'Delivered',
];

const SMS_ON_STATUS: Partial<Record<OnlineOrderStatus, string>> = {
  Preparing: 'Your order has been confirmed and is now being prepared! ☕ – Teascape Bugo',
  'Ready for Pick Up': "Your order is now ready for pick up! Please come to the store. We'll be waiting! 🍵 – Teascape Bugo",
  'Rider Assigned': 'Great news! Your rider is on the way! 🛵 – Teascape Bugo',
};

interface SmsLog { message: string; time: string }

function parseItems(items: string): string[] {
  return items.split(',').map(s => s.trim()).filter(Boolean);
}

export default function OnlineOrders() {
  const { customerOrders, updateCustomerOrderStatus } = useApp();

  const [localOrders, setLocalOrders] = useState<OnlineOrder[]>([]);
  const [activeTab, setActiveTab] = useState<OnlineOrderStatus | 'All'>('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderErrors, setRiderErrors] = useState<{ name?: string; phone?: string }>({});
  const [smsLogs, setSmsLogs] = useState<Record<string, SmsLog[]>>({});

  // customerOrders (from context) are the primary source; localOrders are staff-added ones
  const allOrders: OnlineOrder[] = [
    ...customerOrders,
    ...localOrders.filter(lo => !customerOrders.find(co => co.id === lo.id)),
  ];

  const filtered = allOrders.filter(o => {
    const matchTab = activeTab === 'All' || o.status === activeTab;
    const q = search.toLowerCase();
    return matchTab && (o.customer.toLowerCase().includes(q) || o.id.includes(q));
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const sendSms = (orderId: string, msg: string) => {
    const time = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    setSmsLogs(prev => ({ ...prev, [orderId]: [...(prev[orderId] || []), { message: msg, time }] }));
  };

  const updateStatus = (orderId: string, newStatus: OnlineOrderStatus, sms?: string) => {
    // Update customerOrders in context if it's a customer order
    if (customerOrders.find(o => o.id === orderId)) {
      updateCustomerOrderStatus(orderId, newStatus);
    }
    // Update localOrders
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    // Update selectedOrder so modal reflects change immediately
    setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev);
    if (sms) sendSms(orderId, sms);
  };

  // ── Pickup flow ─────────────────────────────────────────────────────────────
  // Step 1: Confirm Order → Preparing + SMS sent
  const handleConfirm = (order: OnlineOrder) =>
    updateStatus(order.id, 'Preparing', SMS_ON_STATUS['Preparing']);

  // Step 2 (Pickup): Ready for Pick Up + SMS sent
  const handleReadyForPickup = (order: OnlineOrder) =>
    updateStatus(order.id, 'Ready for Pick Up', SMS_ON_STATUS['Ready for Pick Up']);

  // Step 3 (Pickup): Done (customer picked up)
  const handleDone = (order: OnlineOrder) =>
    updateStatus(order.id, 'Done');

  // ── Delivery flow ───────────────────────────────────────────────────────────
  const handleAssignRider = (order: OnlineOrder) => {
    const errs: { name?: string; phone?: string } = {};
    if (!riderName.trim()) errs.name = 'Rider name is required.';
    if (!riderPhone.trim()) errs.phone = 'Rider phone number is required.';
    if (Object.keys(errs).length > 0) { setRiderErrors(errs); return; }
    setRiderErrors({});
    updateStatus(
      order.id,
      'Rider Assigned',
      `${SMS_ON_STATUS['Rider Assigned']} Rider: ${riderName.trim()} (${riderPhone.trim()})`,
    );
  };

  const handleMarkDelivered = (order: OnlineOrder) => updateStatus(order.id, 'Delivered');

  const handleCancel = (order: OnlineOrder) => {
    setLocalOrders(prev => prev.filter(o => o.id !== order.id));
    setSelectedOrder(null);
  };

  // Always use the live version of the order (may have been updated)
  const getLive = (id: string) => allOrders.find(o => o.id === id) ?? selectedOrder!;
  const live = selectedOrder ? getLive(selectedOrder.id) : null;

  // ── Quick-action button shown in table row ──────────────────────────────────
  function QuickAction({ order }: { order: OnlineOrder }) {
    if (order.status === 'Pending') {
      return (
        <button onClick={e => { e.stopPropagation(); handleConfirm(order); }}
          className="px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition-all"
          style={{ backgroundColor: '#b88917', color: '#fff' }}>
          Confirm Order
        </button>
      );
    }
    if (order.status === 'Preparing' && order.type === 'Pickup') {
      return (
        <button onClick={e => { e.stopPropagation(); handleReadyForPickup(order); }}
          className="px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition-all"
          style={{ backgroundColor: '#b88917', color: '#fff' }}>
          Ready for Pick Up
        </button>
      );
    }
    if (order.status === 'Ready for Pick Up') {
      return (
        <button onClick={e => { e.stopPropagation(); handleDone(order); }}
          className="px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition-all"
          style={{ backgroundColor: '#3D6B2A', color: '#fff' }}>
          Done
        </button>
      );
    }
    if (order.status === 'Rider Assigned') {
      return (
        <button onClick={e => { e.stopPropagation(); handleMarkDelivered(order); }}
          className="px-3 py-1 rounded-full text-xs font-semibold hover:opacity-80 transition-all"
          style={{ backgroundColor: '#b88917', color: '#fff' }}>
          Delivered
        </button>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Top Bar */}
      <div className="px-5 py-4 shadow-sm" style={{ backgroundColor: '#fff' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.4rem', fontWeight: 700 }}>
          Online Orders
        </h1>
        <p className="text-xs" style={{ color: '#6B3F1E' }}>Manage and update customer orders</p>
      </div>

      <div className="p-4 sm:p-5">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2e210e' }} />
          <input
            type="text"
            placeholder="Search by customer name or order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#D4A96A66', backgroundColor: '#fff', color: '#6B3F1E' }}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
          {ALL_STATUS_TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium border transition-all shrink-0"
              style={{
                backgroundColor: activeTab === tab ? '#b88917' : '#fff',
                color: activeTab === tab ? '#fff' : '#2e210e',
                borderColor: activeTab === tab ? '#b88917' : 'rgba(46,33,14,0.2)',
              }}>
              {tab}
              {tab !== 'All' && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(184,137,23,0.08)' }}>
                  {allOrders.filter(o => o.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#FAF5EE' }}>
                {['ID', 'Customer', 'Items', 'Total', 'Payment', 'Type', 'Time', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#b88917' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}
                  className="border-t cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#D4A96A11' }}
                  onClick={() => { setSelectedOrder(order); setRiderName(''); setRiderPhone(''); setRiderErrors({}); }}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: '#6B3F1E' }}>
                    {order.id}
                    {order.isCustomerOrder && (
                      <span className="ml-1 px-1 py-0.5 rounded" style={{ backgroundColor: '#b88917', color: '#fff', fontSize: '9px' }}>NEW</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#6B3F1E' }}>{order.customer}</td>
                  <td className="px-4 py-3 max-w-[160px] truncate text-xs" style={{ color: '#6B3F1E' }}>{order.items}</td>
                  <td className="px-4 py-3 font-semibold" style={{ color: '#6B3F1E' }}>₱{order.total}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: order.payment === 'GCash' ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.06)', color: order.payment === 'GCash' ? '#007AFF' : '#555' }}>
                      {order.payment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: order.type === 'Delivery' ? 'rgba(26,35,126,0.1)' : 'rgba(107,63,30,0.1)', color: order.type === 'Delivery' ? '#1A237E' : '#6B3F1E' }}>
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#6B3F1E' }}>{order.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: STATUS_COLORS[order.status].bg, color: STATUS_COLORS[order.status].text }}>
                        {order.status}
                      </span>
                      {(smsLogs[order.id] || []).length > 0 && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(0,150,136,0.1)', color: '#009688', fontSize: '9px' }}>
                          <Smartphone className="w-2.5 h-2.5" /> SMS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><QuickAction order={order} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center" style={{ color: '#6B3F1E' }}>
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No orders yet. Orders placed on the website will appear here.</p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map(order => (
            <div key={order.id}
              className="rounded-2xl p-4 shadow-sm cursor-pointer" style={{ backgroundColor: '#fff' }}
              onClick={() => { setSelectedOrder(order); setRiderName(''); setRiderPhone(''); setRiderErrors({}); }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#2D5016' }}>{order.customer}</p>
                  <p className="text-xs" style={{ color: '#6B3F1E' }}>
                    {order.id} · {order.time}
                    {order.isCustomerOrder && (
                      <span className="ml-1 px-1 rounded" style={{ backgroundColor: '#b88917', color: '#fff', fontSize: '9px' }}>NEW</span>
                    )}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: STATUS_COLORS[order.status].bg, color: STATUS_COLORS[order.status].text }}>
                  {order.status}
                </span>
              </div>
              <p className="text-xs mb-2 line-clamp-1" style={{ color: '#6B3F1E' }}>{order.items}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: order.payment === 'GCash' ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.06)', color: order.payment === 'GCash' ? '#007AFF' : '#555' }}>
                    {order.payment}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: order.type === 'Delivery' ? 'rgba(26,35,126,0.1)' : 'rgba(107,63,30,0.1)', color: order.type === 'Delivery' ? '#1A237E' : '#6B3F1E' }}>
                    {order.type}
                  </span>
                </div>
                <p className="font-semibold text-sm" style={{ color: '#6B3F1E' }}>₱{order.total}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center rounded-2xl flex flex-col items-center gap-3" style={{ backgroundColor: '#fff', color: '#6B3F1E' }}>
              <ShoppingBag className="w-10 h-10 opacity-20" />
              <p className="text-sm">No orders yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      {live && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ backgroundColor: '#FDF6EC', maxHeight: '90vh' }}>

            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b shrink-0"
              style={{ backgroundColor: '#4A2810', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-white font-semibold">Order {live.id}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: STATUS_COLORS[live.status].bg, color: STATUS_COLORS[live.status].text }}>
                    {live.status}
                  </span>
                  {(smsLogs[live.id] || []).length > 0 && (
                    <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(0,150,136,0.15)', color: '#00bcd4' }}>
                      <CheckCircle className="w-3 h-3" /> SMS Sent
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Customer */}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#fff' }}>
                <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: '#5A9B42' }}>Customer Info</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(61,32,16,0.1)' }}>
                      <User className="w-3.5 h-3.5" style={{ color: '#6B3F1E' }} />
                    </div>
                    <span style={{ color: '#6B3F1E' }}>{live.customer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(61,32,16,0.1)' }}>
                      <Phone className="w-3.5 h-3.5" style={{ color: '#6B3F1E' }} />
                    </div>
                    <span style={{ color: '#6B3F1E' }}>{live.phone}</span>
                  </div>
                  {live.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(61,32,16,0.1)' }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: '#6B3F1E' }} />
                      </div>
                      <span style={{ color: '#6B3F1E' }}>{live.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="rounded-xl p-4" style={{ backgroundColor: '#fff' }}>
                <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: '#5A9B42' }}>Order Items</p>
                <ul className="space-y-1.5">
                  {parseItems(live.items).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#b88917' }} />
                      <span style={{ color: '#6B3F1E' }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'rgba(107,63,30,0.1)' }}>
                  <div className="flex gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: live.payment === 'GCash' ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.06)', color: live.payment === 'GCash' ? '#007AFF' : '#555' }}>
                      {live.payment}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: live.type === 'Delivery' ? 'rgba(26,35,126,0.1)' : 'rgba(107,63,30,0.1)', color: live.type === 'Delivery' ? '#1A237E' : '#6B3F1E' }}>
                      {live.type}
                    </span>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: '#6B3F1E' }}>₱{live.total}</p>
                </div>
              </div>

              {/* Pickup progress tracker */}
              {live.type === 'Pickup' && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#fff' }}>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: '#5A9B42' }}>Pick Up Progress</p>
                  {(() => {
                    const steps: OnlineOrderStatus[] = ['Pending', 'Preparing', 'Ready for Pick Up', 'Done'];
                    const labels = ['Pending', 'Preparing', 'Ready', 'Done'];
                    const cur = steps.indexOf(live.status as OnlineOrderStatus);
                    return (
                      <div className="flex items-center">
                        {steps.map((step, i) => {
                          const done = i < cur;
                          const active = i === cur;
                          return (
                            <div key={step} className="flex items-center flex-1">
                              <div className="flex flex-col items-center flex-1">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                                  style={{ backgroundColor: done || active ? '#b88917' : 'rgba(107,63,30,0.1)', color: done || active ? '#fff' : '#9C7A5A' }}>
                                  {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className="text-center"
                                  style={{ fontSize: '9px', color: active ? '#b88917' : '#9C7A5A', fontWeight: active ? 700 : 400 }}>
                                  {labels[i]}
                                </span>
                              </div>
                              {i < steps.length - 1 && (
                                <div className="h-0.5 flex-1 mx-1 mb-4 rounded"
                                  style={{ backgroundColor: i < cur ? '#b88917' : 'rgba(107,63,30,0.1)' }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Rider assign form */}
              {live.status === 'Preparing' && live.type === 'Delivery' && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#fff' }}>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: '#5A9B42' }}>Assign Rider</p>
                  <div className="space-y-2">
                    <div>
                      <input type="text" value={riderName}
                        onChange={e => { setRiderName(e.target.value); setRiderErrors(p => ({ ...p, name: undefined })); }}
                        placeholder="Rider name *"
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: riderErrors.name ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: '#FAF5EE', color: '#6B3F1E' }} />
                      {riderErrors.name && <p className="text-xs mt-1" style={{ color: '#e53e3e' }}>{riderErrors.name}</p>}
                    </div>
                    <div>
                      <input type="text" value={riderPhone}
                        onChange={e => { setRiderPhone(e.target.value); setRiderErrors(p => ({ ...p, phone: undefined })); }}
                        placeholder="Rider phone number *"
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: riderErrors.phone ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: '#FAF5EE', color: '#6B3F1E' }} />
                      {riderErrors.phone && <p className="text-xs mt-1" style={{ color: '#e53e3e' }}>{riderErrors.phone}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* SMS History */}
              {(smsLogs[live.id] || []).length > 0 && (
                <div className="rounded-xl p-4" style={{ backgroundColor: '#fff' }}>
                  <p className="text-xs uppercase tracking-wide font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#5A9B42' }}>
                    <Smartphone className="w-3.5 h-3.5" /> SMS History
                  </p>
                  <div className="space-y-2">
                    {(smsLogs[live.id] || []).map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs rounded-lg p-2.5" style={{ backgroundColor: 'rgba(0,150,136,0.06)' }}>
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#009688' }} />
                        <div>
                          <p style={{ color: '#6B3F1E' }}>{log.message}</p>
                          <p className="mt-0.5" style={{ color: '#9C7A5A' }}>Sent at {log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Action Buttons ─────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2">

                {/* PENDING → Confirm Order (sends SMS → Preparing) */}
                {live.status === 'Pending' && (
                  <>
                    <button onClick={() => handleConfirm(live)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                      style={{ backgroundColor: '#b88917', color: '#fff' }}>
                      <CheckCircle className="w-4 h-4" /> Confirm Order
                    </button>
                    <button onClick={() => handleCancel(live)}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                      style={{ backgroundColor: '#e53e3e', color: '#fff' }}>
                      Cancel
                    </button>
                  </>
                )}

                {/* PREPARING + PICKUP → Ready for Pick Up (sends SMS) */}
                {live.status === 'Preparing' && live.type === 'Pickup' && (
                  <button onClick={() => handleReadyForPickup(live)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#b88917', color: '#fff' }}>
                    <ShoppingBag className="w-4 h-4" /> Ready for Pick Up
                  </button>
                )}

                {/* READY FOR PICK UP → Done */}
                {live.status === 'Ready for Pick Up' && (
                  <button onClick={() => handleDone(live)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#3D6B2A', color: '#fff' }}>
                    <ClipboardCheck className="w-4 h-4" /> Done
                  </button>
                )}

                {/* PREPARING + DELIVERY → Assign Rider */}
                {live.status === 'Preparing' && live.type === 'Delivery' && (
                  <button onClick={() => handleAssignRider(live)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#b88917', color: '#fff' }}>
                    <Bike className="w-4 h-4" /> Assign Rider
                  </button>
                )}

                {/* RIDER ASSIGNED → Mark Delivered */}
                {live.status === 'Rider Assigned' && (
                  <button onClick={() => handleMarkDelivered(live)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#b88917', color: '#fff' }}>
                    <Package className="w-4 h-4" /> Mark as Delivered
                  </button>
                )}

                {/* Print receipt */}
                <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80 transition-all"
                  style={{ borderColor: '#5A9B42', color: '#5A9B42' }}>
                  <Printer className="w-4 h-4" /> Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
