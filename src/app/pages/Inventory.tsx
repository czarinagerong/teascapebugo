import { useState } from 'react';
import { Package, AlertTriangle, XCircle, Plus, Minus, Search } from 'lucide-react';

type StockStatus = 'OK' | 'Low' | 'Out';

interface InventoryItem {
  id: string;
  item: string;
  category: string;
  stock: number;
  unit: string;
  min: number;
  status: StockStatus;
}

interface StockLog {
  item: string;
  type: 'Added' | 'Deducted';
  qty: number;
  remaining: number;
  date: string;
  staff: string;
  unit: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', item: 'Milk Tea Powder – Cheesecake', category: 'Milk Tea', stock: 45, unit: 'packs', min: 10, status: 'OK' },
  { id: '2', item: 'Tapioca Pearls', category: 'Milk Tea', stock: 8, unit: 'kg', min: 5, status: 'Low' },
  { id: '3', item: 'Ramen Noodles', category: 'Ramen', stock: 30, unit: 'packs', min: 10, status: 'OK' },
  { id: '4', item: 'Pizza Dough', category: 'Pizza', stock: 5, unit: 'pcs', min: 10, status: 'Low' },
  { id: '5', item: 'Beef Patty', category: 'Burger', stock: 0, unit: 'pcs', min: 20, status: 'Out' },
  { id: '6', item: 'Eggs', category: 'General', stock: 60, unit: 'pcs', min: 20, status: 'OK' },
  { id: '7', item: 'Rice', category: 'General', stock: 12, unit: 'kg', min: 5, status: 'OK' },
  { id: '8', item: 'Plastic Cups', category: 'Packaging', stock: 200, unit: 'pcs', min: 50, status: 'OK' },
  { id: '9', item: 'Straws', category: 'Packaging', stock: 150, unit: 'pcs', min: 50, status: 'OK' },
  { id: '10', item: 'Japanese Siomai', category: 'Siomai', stock: 3, unit: 'pcs', min: 20, status: 'Low' },
];

const INITIAL_LOGS: StockLog[] = [
  { item: 'Tapioca Pearls', type: 'Added', qty: 5, remaining: 13, date: 'Mar 12, 8AM', staff: 'Staff', unit: 'kg' },
  { item: 'Beef Patty', type: 'Deducted', qty: 8, remaining: 0, date: 'Mar 12, 11AM', staff: 'Staff', unit: 'pcs' },
  { item: 'Pizza Dough', type: 'Added', qty: 3, remaining: 5, date: 'Mar 11, 9AM', staff: 'Staff', unit: 'pcs' },
  { item: 'Plastic Cups', type: 'Added', qty: 100, remaining: 200, date: 'Mar 11, 2PM', staff: 'Staff', unit: 'pcs' },
  { item: 'Rice', type: 'Deducted', qty: 3, remaining: 12, date: 'Mar 13, 7AM', staff: 'Staff', unit: 'kg' },
];

const STATUS_STYLE: Record<StockStatus, { bg: string; text: string; label: string }> = {
  OK: { bg: 'rgba(107,63,30,0.1)', text: '#6B3F1E', label: 'OK' },
  Low: { bg: 'rgba(230,126,34,0.12)', text: '#E67E22', label: 'Low Stock' },
  Out: { bg: 'rgba(229,62,62,0.12)', text: '#e53e3e', label: 'Out of Stock' },
};

const CATEGORIES = ['All', 'Milk Tea', 'Ramen', 'Pizza', 'Burger', 'General', 'Packaging', 'Siomai'];

function getStatus(stock: number, min: number): StockStatus {
  if (stock === 0) return 'Out';
  if (stock <= min) return 'Low';
  return 'OK';
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [logs, setLogs] = useState<StockLog[]>(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [addQtyMap, setAddQtyMap] = useState<Record<string, number>>({});
  const [deductQtyMap, setDeductQtyMap] = useState<Record<string, number>>({});

  const filtered = inventory.filter(i => {
    const matchCat = catFilter === 'All' || i.category === catFilter;
    const matchSearch = i.item.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalItems = inventory.length;
  const lowStock = inventory.filter(i => i.status === 'Low').length;
  const outOfStock = inventory.filter(i => i.status === 'Out').length;

  const handleStock = (item: InventoryItem, type: 'add' | 'deduct') => {
    const qty = type === 'add' ? (addQtyMap[item.id] || 1) : (deductQtyMap[item.id] || 1);
    const newStock = type === 'add' ? item.stock + qty : Math.max(0, item.stock - qty);
    const newStatus = getStatus(newStock, item.min);
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, stock: newStock, status: newStatus } : i));
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) + ', ' + now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [
      { item: item.item, type: type === 'add' ? 'Added' : 'Deducted', qty, remaining: newStock, date: dateStr, staff: 'Staff', unit: item.unit },
      ...prev
    ]);
    setAddQtyMap(prev => ({ ...prev, [item.id]: 1 }));
    setDeductQtyMap(prev => ({ ...prev, [item.id]: 1 }));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Top Bar */}
      <div className="px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: '#fff' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.4rem', fontWeight: 700 }}>Inventory Tracker</h1>
          <p className="text-xs" style={{ color: '#5C2A0A' }}>Monitor and manage stock levels</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 w-fit"
          style={{ backgroundColor: '#b88917', color: '#fff' }}
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Items', value: totalItems, icon: Package, color: '#6B3F1E', bg: 'rgba(107,63,30,0.1)' },
            { label: 'Low Stock', value: lowStock, icon: AlertTriangle, color: '#E67E22', bg: 'rgba(230,126,34,0.1)' },
            { label: 'Out of Stock', value: outOfStock, icon: XCircle, color: '#e53e3e', bg: 'rgba(229,62,62,0.1)' },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl p-4 shadow-sm" style={{ backgroundColor: '#fff' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.bg }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                </div>
                <p style={{ color: card.color, fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#5C2A0A' }}>{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#2e210e' }} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.3)', backgroundColor: '#fff', color: '#3D2010' }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className="px-3 py-2 rounded-xl text-xs whitespace-nowrap font-medium border transition-all shrink-0"
                style={{
                  backgroundColor: catFilter === cat ? '#b88917' : '#fff',
                  color: catFilter === cat ? '#fff' : '#2e210e',
                  borderColor: catFilter === cat ? '#b88917' : 'rgba(46,33,14,0.2)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#FAF5EE' }}>
                  {['Item', 'Category', 'Stock', 'Unit', 'Min.', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#b88917' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                    <td className="px-4 py-3 font-medium" style={{ color: '#6B3F1E' }}>{item.item}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(107,63,30,0.08)', color: '#6B3F1E' }}>{item.category}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: item.status === 'Out' ? '#e53e3e' : item.status === 'Low' ? '#E67E22' : '#2D5016', fontFamily: 'var(--font-body)' }}>
                      {item.stock}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#5C2A0A' }}>{item.unit}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#5C2A0A' }}>{item.min}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: STATUS_STYLE[item.status].bg, color: STATUS_STYLE[item.status].text }}>
                        {STATUS_STYLE[item.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={addQtyMap[item.id] || 1}
                            onChange={e => setAddQtyMap(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 1 }))}
                            className="w-12 px-2 py-1 rounded-lg border text-xs text-center outline-none"
                            style={{ borderColor: '#D4A96A66', backgroundColor: '#FDF6EC' }}
                          />
                          <button
                            onClick={() => handleStock(item, 'add')}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                            style={{ backgroundColor: 'rgba(45,80,22,0.1)', color: '#2D5016' }}
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            value={deductQtyMap[item.id] || 1}
                            onChange={e => setDeductQtyMap(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 1 }))}
                            className="w-12 px-2 py-1 rounded-lg border text-xs text-center outline-none"
                            style={{ borderColor: '#D4A96A66', backgroundColor: '#FDF6EC' }}
                          />
                          <button
                            onClick={() => handleStock(item, 'deduct')}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                            style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#e53e3e' }}
                          >
                            <Minus className="w-3 h-3" /> Deduct
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: '#5C2A0A' }}>No items found.</div>
            )}
          </div>
        </div>

        {/* Stock History Log */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(107,63,30,0.1)' }}>
            <h3 className="font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>Stock History Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#FAF5EE' }}>
                  {['Item', 'Type', 'Qty', 'Remaining', 'Date', 'Staff'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: '#b88917' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx} className="border-t" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                    <td className="px-4 py-2.5 font-medium text-xs" style={{ color: '#6B3F1E' }}>{log.item}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          backgroundColor: log.type === 'Added' ? 'rgba(107,63,30,0.1)' : 'rgba(229,62,62,0.1)',
                          color: log.type === 'Added' ? '#3D6B2A' : '#e53e3e',
                        }}>
                        {log.type === 'Added' ? '+' : '-'}{log.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: log.type === 'Added' ? '#2D5016' : '#e53e3e', fontFamily: 'var(--font-body)' }}>
                      {log.type === 'Added' ? '+' : '-'}{log.qty} {log.unit}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#6B3F1E', fontFamily: 'var(--font-body)' }}>{log.remaining} {log.unit}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#5C2A0A' }}>{log.date}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: '#5C2A0A' }}>{log.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}