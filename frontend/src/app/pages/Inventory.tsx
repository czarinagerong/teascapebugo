import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, XCircle, Plus, Minus, Search, Loader2, RefreshCw, Trash2, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getInventory, saveInventoryItem, updateInventoryStock, deleteInventoryItem, getInventoryLogs } from '../lib/api';
import type { InventoryItem, InventoryLog } from '../lib/api';

type StockStatus = 'OK' | 'Low' | 'Out';

const STATUS_STYLE: Record<StockStatus, { bg: string; text: string; label: string }> = {
  OK:  { bg: 'rgba(61,107,42,0.1)',  text: '#3D6B2A', label: 'OK' },
  Low: { bg: 'rgba(230,126,34,0.12)', text: '#E67E22', label: 'Low Stock' },
  Out: { bg: 'rgba(229,62,62,0.12)', text: '#e53e3e', label: 'Out of Stock' },
};

const CATEGORIES = ['All','Milk Tea','Ramen','Pizza','Burger','General','Packaging','Siomai'];

function getStatus(stock: number, min: number): StockStatus {
  if (stock === 0) return 'Out';
  if (stock <= min) return 'Low';
  return 'OK';
}

function AddItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: Partial<InventoryItem>) => void }) {
  const [form, setForm] = useState({ item: '', category: 'General', stock: 0, unit: 'pcs', min_stock: 5 });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.item.trim() || !form.unit.trim()) return;
    setSaving(true);
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: '#FDF6EC' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#4A2810' }}>
          <h3 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Add Inventory Item</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><XCircle className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'Item Name *', key: 'item', type: 'text', placeholder: 'e.g. Tapioca Pearls' },
            { label: 'Unit *', key: 'unit', type: 'text', placeholder: 'e.g. kg, pcs, packs' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#6B3F1E' }}>{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }} />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#6B3F1E' }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#6B3F1E' }}>Initial Stock</label>
              <input type="number" min={0} value={form.stock} onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#6B3F1E' }}>Min. Stock Alert</label>
              <input type="number" min={1} value={form.min_stock} onChange={e => setForm(p => ({ ...p, min_stock: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold border" style={{ borderColor: 'rgba(107,63,30,0.3)', color: '#6B3F1E' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#b88917' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { staffToken } = useApp();
  const token = staffToken || sessionStorage.getItem('teascape_staff_session') || '';

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [addQtyMap, setAddQtyMap] = useState<Record<string, number>>({});
  const [deductQtyMap, setDeductQtyMap] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [inv, logData] = await Promise.all([getInventory(token), getInventoryLogs(token)]);
      setInventory(inv);
      setLogs(logData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = inventory.filter(i => {
    const matchCat = catFilter === 'All' || i.category === catFilter;
    return matchCat && (i.item.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));
  });

  const handleStock = async (item: InventoryItem, type: 'add' | 'deduct') => {
    const qty = type === 'add' ? (addQtyMap[item.id] || 1) : (deductQtyMap[item.id] || 1);
    setUpdatingId(item.id);
    try {
      const { newStock } = await updateInventoryStock(token, item.id, qty, type);
      setInventory(prev => prev.map(i => i.id === item.id ? { ...i, stock: newStock } : i));
      await fetchAll(); // refresh logs too
    } catch (err) {
      alert('Failed to update stock.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddItem = async (item: Partial<InventoryItem>) => {
    try {
      await saveInventoryItem(token, item);
      await fetchAll();
      setShowAddModal(false);
    } catch (err) {
      alert('Failed to add item.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from inventory?`)) return;
    try {
      await deleteInventoryItem(token, id);
      setInventory(prev => prev.filter(i => i.id !== id));
    } catch {
      alert('Failed to delete item.');
    }
  };

  const totalItems = inventory.length;
  const lowStock = inventory.filter(i => getStatus(i.stock, i.min_stock) === 'Low').length;
  const outOfStock = inventory.filter(i => getStatus(i.stock, i.min_stock) === 'Out').length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#b88917' }} />
        <p className="text-sm" style={{ color: '#6B3F1E' }}>Loading inventory...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: '#fff' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.4rem', fontWeight: 700 }}>Inventory Tracker</h1>
          <p className="text-xs" style={{ color: '#5C2A0A' }}>Stock levels saved to database</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="p-2 rounded-xl border transition-all hover:opacity-80" style={{ borderColor: 'rgba(107,63,30,0.2)', color: '#6B3F1E' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
            style={{ backgroundColor: '#b88917', color: '#fff' }}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {error && (
          <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
            <WifiOff className="w-4 h-4 shrink-0" style={{ color: '#e53e3e' }} />
            <p className="text-xs" style={{ color: '#e53e3e' }}>{error}</p>
          </div>
        )}

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
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: card.bg }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9C7A5A' }} />
            <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.3)', backgroundColor: '#fff', color: '#3D2010' }} />
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="px-3 py-2 rounded-xl text-xs whitespace-nowrap font-medium border transition-all shrink-0"
                style={{
                  backgroundColor: catFilter === cat ? '#b88917' : '#fff',
                  color: catFilter === cat ? '#fff' : '#2e210e',
                  borderColor: catFilter === cat ? '#b88917' : 'rgba(46,33,14,0.2)',
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#FAF5EE' }}>
                  {['Item', 'Category', 'Stock', 'Unit', 'Min.', 'Status', 'Update Stock', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: '#b88917' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const status = getStatus(item.stock, item.min_stock);
                  const isUpdating = updatingId === item.id;
                  return (
                    <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: '#6B3F1E' }}>{item.item}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(107,63,30,0.08)', color: '#6B3F1E' }}>{item.category}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: status === 'Out' ? '#e53e3e' : status === 'Low' ? '#E67E22' : '#2D5016' }}>
                        {item.stock}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#5C2A0A' }}>{item.unit}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#5C2A0A' }}>{item.min_stock}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].text }}>
                          {STATUS_STYLE[status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input type="number" min={1} value={addQtyMap[item.id] || 1}
                              onChange={e => setAddQtyMap(p => ({ ...p, [item.id]: parseInt(e.target.value) || 1 }))}
                              className="w-12 px-2 py-1 rounded-lg border text-xs text-center outline-none"
                              style={{ borderColor: '#D4A96A66', backgroundColor: '#FDF6EC' }} />
                            <button onClick={() => handleStock(item, 'add')} disabled={isUpdating}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(45,80,22,0.1)', color: '#2D5016' }}>
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min={1} value={deductQtyMap[item.id] || 1}
                              onChange={e => setDeductQtyMap(p => ({ ...p, [item.id]: parseInt(e.target.value) || 1 }))}
                              className="w-12 px-2 py-1 rounded-lg border text-xs text-center outline-none"
                              style={{ borderColor: '#D4A96A66', backgroundColor: '#FDF6EC' }} />
                            <button onClick={() => handleStock(item, 'deduct')} disabled={isUpdating}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                              style={{ backgroundColor: 'rgba(229,62,62,0.08)', color: '#e53e3e' }}>
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Minus className="w-3 h-3" />} Deduct
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(item.id, item.item)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80"
                          style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: '#e53e3e' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: '#5C2A0A' }}>
                {inventory.length === 0 ? 'No inventory items yet. Add your first item!' : 'No items match your search.'}
              </div>
            )}
          </div>
        </div>

        {/* Stock History Log */}
        {logs.length > 0 && (
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
                  {logs.map(log => (
                    <tr key={log.id} className="border-t" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                      <td className="px-4 py-2.5 font-medium text-xs" style={{ color: '#6B3F1E' }}>{log.item_name}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: log.type === 'Added' ? 'rgba(61,107,42,0.1)' : 'rgba(229,62,62,0.1)', color: log.type === 'Added' ? '#3D6B2A' : '#e53e3e' }}>
                          {log.type === 'Added' ? '+' : '-'}{log.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: log.type === 'Added' ? '#2D5016' : '#e53e3e' }}>
                        {log.type === 'Added' ? '+' : '-'}{log.qty} {log.unit}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: '#6B3F1E' }}>{log.remaining} {log.unit}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#5C2A0A' }}>
                        {new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })},{' '}
                        {new Date(log.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: '#5C2A0A' }}>{log.staff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onSave={handleAddItem} />}
    </div>
  );
}