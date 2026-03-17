import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ShoppingBag, DollarSign, Clock, ChefHat, Truck, Store,
  CreditCard, Wallet, Sun, Coffee, Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OnlineOrder } from '../context/AppContext';

const PIE_COLORS = ['#b88917', '#6B3F1E'];

const HOUR_LABELS = [
  '7AM','8AM','9AM','10AM','11AM','12PM',
  '1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 18) return { text: 'Good afternoon', Icon: Coffee };
  return { text: 'Good evening', Icon: Moon };
}

/** Parse "3:45 PM" → 24h integer (15) */
function parseHour(timeStr: string): number {
  try {
    const [timePart, meridiem] = timeStr.trim().split(' ');
    let [h] = timePart.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h;
  } catch {
    return -1;
  }
}

/** Derive top-5 items from a list of completed orders */
function getTopItems(orders: OnlineOrder[]) {
  const map: Record<string, { category: string; qty: number; sales: number }> = {};
  for (const o of orders) {
    // items string: "2x Cheesecake Series (Matcha, M), 1x Korean Ramen"
    const parts = o.items.split(',').map(s => s.trim());
    for (const part of parts) {
      const match = part.match(/^(\d+)x\s+(.+)/);
      const qty = match ? parseInt(match[1]) : 1;
      const name = match ? match[2].replace(/\s*\(.*\)/, '').trim() : part.replace(/\s*\(.*\)/, '').trim();
      if (!map[name]) map[name] = { category: '', qty: 0, sales: 0 };
      map[name].qty += qty;
      // Approximate per-item revenue: total ÷ number of distinct line-items
      map[name].sales += Math.round((o.total / parts.length) * qty);
    }
  }
  return Object.entries(map)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([item, v], i) => ({ rank: i + 1, item, category: v.category, qty: v.qty, sales: v.sales }));
}

export default function StaffDashboard() {
  const { customerOrders } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const { text: greeting, Icon: GreetIcon } = getGreeting();

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = customerOrders.filter(o => o.status === 'Done' || o.status === 'Delivered');
    const pending   = customerOrders.filter(o => o.status === 'Pending');
    const preparing = customerOrders.filter(o => o.status === 'Preparing');
    const delivery  = customerOrders.filter(o => o.type === 'Delivery');
    const pickup    = customerOrders.filter(o => o.type === 'Pickup');
    const gcash     = completed.filter(o => o.payment === 'GCash');
    const cash      = completed.filter(o => o.payment === 'Cash');

    const totalSales    = completed.reduce((s, o) => s + o.total, 0);
    const gcashTotal    = gcash.reduce((s, o) => s + o.total, 0);
    const cashTotal     = cash.reduce((s, o) => s + o.total, 0);

    // Hourly bar chart — count all orders (not just completed) by hour placed
    const hourlyMap: Record<number, number> = {};
    for (const o of customerOrders) {
      const h = parseHour(o.time);
      if (h >= 7 && h <= 21) hourlyMap[h] = (hourlyMap[h] || 0) + 1;
    }
    const hourlyData = HOUR_LABELS.map((label, i) => ({
      hour: label,
      orders: hourlyMap[i + 7] || 0,
    }));

    // Pie chart
    const pieData = [
      { name: 'Delivery', value: delivery.length },
      { name: 'Pickup',   value: pickup.length },
    ];

    // Top items — from completed orders
    const topItems = getTopItems(completed);

    // Recent activity — last 10 completed, newest first
    const recentActivity = [...completed]
      .reverse()
      .slice(0, 10)
      .map(o => ({ name: o.customer, type: o.type, items: o.items, total: o.total, time: o.time }));

    return {
      totalOrders: completed.length,
      totalSales,
      pendingCount:   pending.length,
      preparingCount: preparing.length,
      deliveryCount:  delivery.length,
      pickupCount:    pickup.length,
      gcashTotal,
      cashTotal,
      hourlyData,
      pieData,
      topItems,
      recentActivity,
    };
  }, [customerOrders]);

  const summaryCards = [
    { label: 'Total Orders Today',  value: String(stats.totalOrders),           icon: ShoppingBag, color: '#6B3F1E', bg: 'rgba(107,63,30,0.1)' },
    { label: 'Total Sales Today',   value: `₱${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: '#6B3F1E', bg: 'rgba(107,63,30,0.1)' },
    { label: 'Pending Orders',      value: String(stats.pendingCount),           icon: Clock,       color: '#E67E22', bg: 'rgba(230,126,34,0.1)' },
    { label: 'Preparing Orders',    value: String(stats.preparingCount),         icon: ChefHat,     color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
    { label: 'Delivery Orders',     value: String(stats.deliveryCount),          icon: Truck,       color: '#1A237E', bg: 'rgba(26,35,126,0.1)' },
    { label: 'Pickup Orders',       value: String(stats.pickupCount),            icon: Store,       color: '#4A2810', bg: 'rgba(74,40,16,0.1)' },
    { label: 'GCash Payments',      value: `₱${stats.gcashTotal.toLocaleString()}`, icon: CreditCard, color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
    { label: 'Cash Payments',       value: `₱${stats.cashTotal.toLocaleString()}`,  icon: Wallet,     color: '#555',    bg: 'rgba(0,0,0,0.06)' },
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
        <p className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-body)', fontSize: '1.35rem', letterSpacing: '0.02em' }}>{timeStr}</p>
      </div>

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
                <p style={{ color: card.color, fontFamily: 'var(--font-body)', fontSize: '1.4rem', fontWeight: 700 }}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Bar Chart */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Hourly Orders Today</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.hourlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#5C2A0A' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5C2A0A' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #D4A96A44', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="orders" fill="#b88917" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Delivery vs Pickup</h3>
            {stats.pieData.every(d => d.value === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'rgba(107,63,30,0.35)' }}>
                No orders yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%" cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell key={`pie-${entry.name}`} fill={PIE_COLORS[index]} />
                    ))}
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
          {/* Top 5 Items Table */}
          <div className="lg:col-span-3 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(107,63,30,0.1)' }}>
              <h3 className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Top 5 Items Today</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#FAF5EE' }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B42' }}>#</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B42' }}>Item</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B42' }}>Qty</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B42' }}>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topItems.map(item => (
                    <tr key={item.rank} className="border-t hover:bg-green-50/30 transition-colors" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                      <td className="px-5 py-3">
                        <span
                          className="w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold"
                          style={{
                            backgroundColor: item.rank === 1 ? '#3D6B2A' : item.rank === 2 ? '#e8e8e8' : item.rank === 3 ? '#f0d8a8' : 'transparent',
                            color: item.rank <= 3 ? (item.rank === 1 ? '#fff' : '#5C2A0A') : '#5C2A0A',
                          }}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium" style={{ color: '#6B3F1E' }}>{item.item}</td>
                      <td className="px-3 py-3 text-right font-semibold" style={{ color: '#6B3F1E' }}>{item.qty}</td>
                      <td className="px-5 py-3 text-right font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-body)' }}>₱{item.sales.toLocaleString()}</td>
                    </tr>
                  ))}
                  {stats.topItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: 'rgba(107,63,30,0.4)' }}>
                        No sales data yet — populates as orders are completed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: '#fff' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(107,63,30,0.1)' }}>
              <h3 className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
            </div>
            <div className="divide-y overflow-y-auto" style={{ maxHeight: '280px' }}>
              {stats.recentActivity.length === 0 && (
                <div className="px-5 py-10 text-center text-sm" style={{ color: 'rgba(107,63,30,0.4)' }}>
                  No activity yet — completed orders will appear here.
                </div>
              )}
              {stats.recentActivity.map((act, idx) => (
                <div key={idx} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold" style={{ color: '#6B3F1E' }}>{act.name}</p>
                    <p className="text-xs" style={{ color: '#5C2A0A' }}>{act.time}</p>
                  </div>
                  <p className="text-xs line-clamp-1" style={{ color: '#5C2A0A' }}>{act.items}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: act.type === 'Delivery' ? 'rgba(26,35,126,0.1)' : 'rgba(74,40,16,0.1)',
                        color: act.type === 'Delivery' ? '#1A237E' : '#4A2810',
                      }}
                    >
                      {act.type}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-body)' }}>₱{act.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
