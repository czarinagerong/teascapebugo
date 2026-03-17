import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload } from 'lucide-react';
import { MENU_CATEGORIES } from '../data/menuData';
import { Coffee } from 'lucide-react';

interface ManagedItem {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  available: boolean;
  image?: string;
}

const INITIAL_ITEMS: ManagedItem[] = [
  { id: '1', name: 'Cheesecake Series Milk Tea', category: 'Milk Tea', price: 'P125 / P135', description: 'Rich cheesecake-inspired milk tea in 8 flavors.', available: true },
  { id: '2', name: 'Classic Series Milk Tea', category: 'Milk Tea', price: 'P90 / P105', description: 'Timeless milk tea blends.', available: true },
  { id: '3', name: 'Coffee Series Milk Tea', category: 'Milk Tea', price: 'P120 / P130', description: 'Bold coffee meets creamy milk tea.', available: true },
  { id: '4', name: 'Korean Ramen', category: 'Ramen', price: 'P130', description: 'Spicy ramen with egg, crab meat, cheese, nori.', available: true },
  { id: '5', name: 'Hawaiianscape Pizza', category: 'Pizza', price: 'P145 / P165', description: 'Hawaiian pizza with ham and pineapple.', available: false },
  { id: '6', name: 'Beefycheese Pizza', category: 'Pizza', price: 'P235 / P265', description: 'Loaded beef and cheese pizza.', available: true },
  { id: '7', name: 'Burger n Fries', category: 'Combo', price: 'P109', description: 'Juicy burger with crispy fries.', available: true },
  { id: '8', name: '80 Pasta', category: 'Pasta', price: 'P80', description: 'Pasta with bread and refresher.', available: true },
  { id: '9', name: 'Classic Palabok', category: 'Pasta', price: 'P50', description: 'Traditional Filipino palabok.', available: true },
  { id: '10', name: 'French Fries', category: 'Sharing', price: 'P120', description: 'Golden fries in 4 flavors.', available: true },
];

const CATEGORY_OPTIONS = MENU_CATEGORIES.filter(c => c !== 'All');

interface ItemModalProps {
  item: ManagedItem | null;
  onClose: () => void;
  onSave: (item: ManagedItem) => void;
}

function ItemModal({ item, onClose, onSave }: ItemModalProps) {
  const isEdit = !!item?.id && item.id !== 'new';
  const [form, setForm] = useState<ManagedItem>(item || {
    id: 'new',
    name: '',
    category: 'Milk Tea',
    price: '',
    description: '',
    available: true,
  });

  const handleChange = (key: keyof ManagedItem, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price.trim()) return;
    onSave({ ...form, id: form.id === 'new' ? `item-${Date.now()}` : form.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#FDF6EC' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between sticky top-0" style={{ backgroundColor: '#4A2810' }}>
          <h3 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {isEdit ? 'Edit Menu Item' : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image Upload */}
          <div
            className="h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-80"
            style={{ borderColor: '#5A9B42', backgroundColor: '#fff' }}
          >
            <Upload className="w-6 h-6 mb-2" style={{ color: '#5A9B42' }} />
            <p className="text-xs" style={{ color: '#6B3F1E' }}>Click to upload image</p>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>Item Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="e.g. Cheesecake Milk Tea"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>Category *</label>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}
            />
          </div>

          {/* Size Options Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B3F1E' }}>Has Size Options (M/L)</span>
            <div
              className="relative w-10 h-5 rounded-full cursor-pointer transition-all"
              style={{ backgroundColor: '#3D6B2A' }}
              onClick={() => {}}
            >
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
            </div>
          </div>

          {/* Flavor Options Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B3F1E' }}>Has Flavor Options</span>
            <div
              className="relative w-10 h-5 rounded-full cursor-pointer transition-all"
              style={{ backgroundColor: '#3D6B2A' }}
              onClick={() => {}}
            >
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>Price *</label>
            <input
              type="text"
              value={form.price}
              onChange={e => handleChange('price', e.target.value)}
              placeholder="e.g. P125 or P125 / P135"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}
            />
          </div>

          {/* Add-ons */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: '#6B3F1E' }}>Add-ons</label>
            <input
              type="text"
              placeholder="e.g. Pearl +P10, Cheese Drizzle +P20"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}
            />
          </div>

          {/* Available Toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold" style={{ color: '#6B3F1E' }}>Available</span>
            <button
              onClick={() => handleChange('available', !form.available)}
              className="relative w-12 h-6 rounded-full transition-all duration-200"
              style={{ backgroundColor: form.available ? '#3D6B2A' : 'rgba(107,63,30,0.25)' }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                style={{ left: form.available ? 'calc(100% - 22px)' : '2px' }}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: '#5A9B42', color: '#6B3F1E' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#b88917' }}
            >
              {isEdit ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MenuManager() {
  const [items, setItems] = useState<ManagedItem[]>(INITIAL_ITEMS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ManagedItem | null | 'new'>(null);

  const filtered = items.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSave = (item: ManagedItem) => {
    if (items.find(i => i.id === item.id)) {
      setItems(prev => prev.map(i => i.id === item.id ? item : i));
    } else {
      setItems(prev => [...prev, item]);
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this item?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleToggleAvailable = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Top Bar */}
      <div className="px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: '#fff' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#6B3F1E', fontSize: '1.4rem', fontWeight: 700 }}>Menu Manager</h1>
          <p className="text-xs" style={{ color: '#5C2A0A' }}>Add, edit, and manage your menu items</p>
        </div>
        <button
          onClick={() => setModal({ id: 'new', name: '', category: 'Milk Tea', price: '', description: '', available: true })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 w-fit"
          style={{ backgroundColor: '#b88917', color: '#fff' }}
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5A9B42' }} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'rgba(107,63,30,0.2)', backgroundColor: '#fff', color: '#6B3F1E' }}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MENU_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-xs whitespace-nowrap font-medium border transition-all shrink-0"
              style={{
                backgroundColor: activeCategory === cat ? '#6B3F1E' : '#fff',
                color: activeCategory === cat ? '#fff' : '#6B3F1E',
                borderColor: activeCategory === cat ? '#6B3F1E' : 'rgba(107,63,30,0.2)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Table */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#fff' }}>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#FAF5EE' }}>
                  {['Thumbnail', 'Name', 'Category', 'Price', 'Available', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#5A9B42' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'rgba(107,63,30,0.08)' }}>
                    <td className="px-5 py-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: '#D4A96A22', color: '#2D5016' }}>
                        <Coffee className="w-5 h-5 opacity-40" />
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: '#6B3F1E' }}>{item.name}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(107,63,30,0.08)', color: '#6B3F1E' }}>{item.category}</span>
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: '#5C2A0A' }}>{item.price}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggleAvailable(item.id)}
                        className="relative w-12 h-6 rounded-full transition-all duration-200"
                        style={{ backgroundColor: item.available ? '#3D6B2A' : 'rgba(107,63,30,0.25)' }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                          style={{ left: item.available ? 'calc(100% - 22px)' : '2px' }}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                          style={{ backgroundColor: 'rgba(45,80,22,0.1)', color: '#2D5016' }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                          style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: '#e53e3e' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: '#5C2A0A' }}>No items found.</div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y" style={{ divideColor: '#D4A96A11' }}>
            {filtered.map(item => (
              <div key={item.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(107,63,30,0.08)', color: '#6B3F1E' }}>
                    <Coffee className="w-5 h-5 opacity-40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: '#6B3F1E' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: '#5C2A0A' }}>{item.category} · {item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleAvailable(item.id)}
                      className="relative w-10 h-5 rounded-full transition-all duration-200"
                      style={{ backgroundColor: item.available ? '#3D6B2A' : 'rgba(107,63,30,0.25)' }}
                    >
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                        style={{ left: item.available ? 'calc(100% - 18px)' : '2px' }} />
                    </button>
                    <button onClick={() => setModal(item)} className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(107,63,30,0.08)', color: '#6B3F1E' }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: '#e53e3e' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: '#5C2A0A' }}>No items found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && modal !== 'new' && (
        <ItemModal
          item={modal as ManagedItem}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}