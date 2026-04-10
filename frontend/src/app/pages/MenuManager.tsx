import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Edit2, Trash2, Search, X, Loader2, RefreshCw,
  WifiOff, ChevronDown, ChevronUp, Upload, UtensilsCrossed,
} from "lucide-react";
import { MENU_CATEGORIES } from "../data/menuData";
import { menuItems as staticMenuItemsList } from "../data/menuData";
import { useApp } from "../context/AppContext";
import {
  getMenuItems, saveMenuItem, updateMenuItem,
  deleteMenuItem, uploadMenuImage,
} from "../lib/api";
import { useStaffAvailability } from "../hooks/useMenuAvailability";
import type { MenuItem } from "../lib/api";

const CATEGORY_OPTIONS = MENU_CATEGORIES.filter((c) => c !== "All");

// ── localStorage helpers ──────────────────────────────────────────────────────
const HIDDEN_STATIC_KEY = "teascape_hidden_static_items";
function getHiddenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_STATIC_KEY) || "[]")); }
  catch { return new Set(); }
}
function hideStaticId(id: string) {
  const s = getHiddenIds(); s.add(id);
  localStorage.setItem(HIDDEN_STATIC_KEY, JSON.stringify([...s]));
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} disabled={disabled}
      className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 disabled:opacity-50"
      style={{ backgroundColor: value ? "#3D6B2A" : "rgba(107,63,30,0.25)" }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: value ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );
}

interface FlavorEntry { name: string }
interface AddonEntry  { name: string; price: number }

// ── ItemModal ─────────────────────────────────────────────────────────────────
function ItemModal({ item, onClose, onSave }: { item: MenuItem | null; onClose: () => void; onSave: (item: MenuItem) => void }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState<MenuItem>(item || {
    id: "", name: "", category: "Milk Tea", price: "", description: "",
    available: true, image_url: "", price_m: undefined, price_l: undefined,
    sizes: "[]", flavors: "[]", addons: "[]",
  });
  const [saving,      setSaving]      = useState(false);
  const [imagePreview,setImagePreview] = useState<string | null>(item?.image_url || null);
  const [uploadingImg,setUploadingImg] = useState(false);
  const [flavors, setFlavors] = useState<FlavorEntry[]>(() => { try { return JSON.parse(item?.flavors || "[]"); } catch { return []; } });
  const [addons,  setAddons]  = useState<AddonEntry[]>(() =>  { try { return JSON.parse(item?.addons  || "[]"); } catch { return []; } });
  const [sizes,   setSizes]   = useState<string[]>(() =>      { try { return JSON.parse(item?.sizes   || "[]"); } catch { return []; } });
  const [newFlavor,    setNewFlavor]    = useState("");
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice,setNewAddonPrice]= useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!["image/jpeg","image/png"].includes(file.type)) { alert("JPG or PNG only."); return; }
    if (file.size > 5*1024*1024) { alert("Max 5MB."); return; }
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = ev.target?.result as string;
      setImagePreview(b64); setUploadingImg(true);
      try {
        const url = await uploadMenuImage(b64, file.type);
        setForm(f => ({ ...f, image_url: url })); setImagePreview(url);
      } catch { alert("Image upload failed."); } finally { setUploadingImg(false); }
    };
    reader.readAsDataURL(file);
  };

  const toggleSize = (s: string) => setSizes(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const addFlavor  = () => { if (!newFlavor.trim()) return; setFlavors(p => [...p, { name: newFlavor.trim() }]); setNewFlavor(""); };
  const addAddon   = () => {
    if (!newAddonName.trim() || !newAddonPrice) return;
    setAddons(p => [...p, { name: newAddonName.trim(), price: parseInt(newAddonPrice) || 0 }]);
    setNewAddonName(""); setNewAddonPrice("");
  };
  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim()) return;
    setSaving(true);
    onSave({ ...form, sizes: JSON.stringify(sizes), flavors: JSON.stringify(flavors), addons: JSON.stringify(addons) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#FDF6EC", maxHeight: "90dvh", overflowY: "auto" }}>
        <div className="px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: "#4A2810" }}>
          <h3 className="text-white font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {isEdit ? "Edit Menu Item" : "Add New Item"}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Item Photo</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden h-36">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                {uploadingImg && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                <button onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image_url: "" })); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(229,62,62,0.85)" }}>
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2"
                style={{ borderColor: "rgba(107,63,30,0.3)", backgroundColor: "#fff" }}>
                <Upload className="w-5 h-5" style={{ color: "#b88917" }} />
                <span className="text-xs font-semibold" style={{ color: "#b88917" }}>Tap to upload photo</span>
                <span className="text-xs" style={{ color: "#9C7A5A" }}>JPG or PNG, max 5MB</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Item Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Cheesecake Milk Tea"
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Category *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }}>
              {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Price row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Base Price *", key: "price",   placeholder: "125", type: "text"   },
              { label: "Price M",      key: "price_m",  placeholder: "125", type: "number" },
              { label: "Price L",      key: "price_l",  placeholder: "135", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>{f.label}</label>
                <input type={f.type}
                  value={f.key === "price" ? form.price : ((form as any)[f.key] || "")}
                  onChange={e => setForm(p => ({
                    ...p,
                    [f.key]: f.type === "number" ? (parseInt(e.target.value) || undefined) : e.target.value,
                  }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
              </div>
            ))}
          </div>

          {/* Sizes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Sizes</label>
            <div className="flex flex-wrap gap-2">
              {["M","L","8in","11in","Glass","Pitcher"].map(s => (
                <button key={s} onClick={() => toggleSize(s)}
                  className="px-3 py-1.5 rounded-xl text-xs border-2 transition-all"
                  style={{
                    backgroundColor: sizes.includes(s) ? "#b88917" : "transparent",
                    color: sizes.includes(s) ? "#fff" : "#6B3F1E",
                    borderColor: sizes.includes(s) ? "#b88917" : "rgba(107,63,30,0.2)",
                  }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description..." rows={2}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
          </div>

          {/* Flavors */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Flavors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {flavors.map((f, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{ backgroundColor: "rgba(107,63,30,0.1)", color: "#6B3F1E" }}>
                  {f.name}
                  <button onClick={() => setFlavors(p => p.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newFlavor} onChange={e => setNewFlavor(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFlavor()} placeholder="e.g. Matcha"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs outline-none"
                style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
              <button onClick={addFlavor} className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#b88917", color: "#fff" }}>Add</button>
            </div>
          </div>

          {/* Add-ons */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "#6B3F1E" }}>Add-ons</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {addons.map((a, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                  style={{ backgroundColor: "rgba(107,63,30,0.1)", color: "#6B3F1E" }}>
                  {a.name} +P{a.price}
                  <button onClick={() => setAddons(p => p.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newAddonName} onChange={e => setNewAddonName(e.target.value)}
                placeholder="e.g. Pearl"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs outline-none"
                style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
              <input type="number" value={newAddonPrice} onChange={e => setNewAddonPrice(e.target.value)}
                placeholder="₱"
                className="w-14 shrink-0 px-2 py-2 rounded-xl border text-xs outline-none text-center"
                style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
              <button onClick={addAddon} className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#b88917", color: "#fff" }}>Add</button>
            </div>
          </div>

          {/* Available */}
          <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ backgroundColor: "rgba(107,63,30,0.05)" }}>
            <span className="text-sm font-semibold" style={{ color: "#6B3F1E" }}>Available to customers</span>
            <Toggle value={form.available} onChange={v => setForm(f => ({ ...f, available: v }))} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "rgba(107,63,30,0.3)", color: "#6B3F1E" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || uploadingImg}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#b88917" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AvailabilityRow ───────────────────────────────────────────────────────────
function AvailabilityRow({ itemId, type, name, availability }: {
  itemId: string; type: "flavor" | "addon"; name: string;
  availability: ReturnType<typeof useStaffAvailability>;
}) {
  const available = availability.getAvailable(itemId, type, name);
  return (
    <div className="flex items-center justify-between py-2 px-3 gap-3">
      <span className="text-xs min-w-0 truncate" style={{ color: available ? "#3D2010" : "#9C7A5A" }}>{name}</span>
      <div className="flex items-center gap-2 shrink-0">
        {!available && (
          <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline"
            style={{ backgroundColor: "rgba(229,62,62,0.1)", color: "#e53e3e" }}>Unavailable</span>
        )}
        <Toggle value={available} onChange={v => availability.toggle(itemId, type, name, v)} />
      </div>
    </div>
  );
}

// ── MenuManager ───────────────────────────────────────────────────────────────
export default function MenuManager() {
  const { staffToken } = useApp();
  const token = staffToken || sessionStorage.getItem("teascape_staff_session") || "";
  const availability = useStaffAvailability(token);

  const [items,          setItems]          = useState<MenuItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search,         setSearch]         = useState("");
  const [modal,          setModal]          = useState<MenuItem | null | "new">(null);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const dbData   = await getMenuItems(token);
      const dbIds    = new Set(dbData.map(i => i.id));
      const hiddenIds = getHiddenIds();
      const staticConverted: MenuItem[] = staticMenuItemsList
        .filter(i => !dbIds.has(i.id) && !hiddenIds.has(i.id))
        .map(i => ({
          id: i.id, name: i.name, category: i.category,
          price: String(i.priceM ?? i.price), description: i.description || "",
          available: true, image_url: i.image || "",
          price_m: i.priceM, price_l: i.priceL,
          sizes:   JSON.stringify(i.sizes   || []),
          flavors: JSON.stringify(i.flavors?.map(f => ({ name: f.name })) || []),
          addons:  JSON.stringify(i.addons?.map(a  => ({ name: a.name, price: a.price })) || []),
        }));
      setItems([...staticConverted, ...dbData]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items.filter(item => {
    const matchCat = activeCategory === "All" || item.category === activeCategory;
    return matchCat && item.name.toLowerCase().includes(search.toLowerCase());
  });

  const handleSave = async (item: MenuItem) => {
    try {
      const isStatic = staticMenuItemsList.some(s => s.id === item.id);
      if (item.id && !isStatic)     { await updateMenuItem(token, item.id, item); setItems(p => p.map(i => i.id === item.id ? item : i)); }
      else if (!item.id)            { const r = await saveMenuItem(token, item); setItems(p => [...p, { ...item, id: r.id }]); }
      else                          { setItems(p => p.map(i => i.id === item.id ? item : i)); }
      setModal(null);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to save."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      if (staticMenuItemsList.some(s => s.id === id)) hideStaticId(id);
      else await deleteMenuItem(token, id);
      setItems(p => p.filter(i => i.id !== id));
    } catch { alert("Failed to delete item."); }
  };

  const getStaticItem  = (id: string) => staticMenuItemsList.find(i => i.id === id);
  const getItemFlavors = (item: MenuItem) => {
    const s = getStaticItem(item.id);
    if (s?.flavors) return s.flavors;
    try { return JSON.parse(item.flavors || "[]"); } catch { return []; }
  };
  const getItemAddons = (item: MenuItem) => {
    const s = getStaticItem(item.id);
    if (s?.addons) return s.addons;
    try { return JSON.parse(item.addons || "[]"); } catch { return []; }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#b88917" }} />
        <p className="text-sm" style={{ color: "#6B3F1E" }}>Loading menu...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f5" }}>

      {/* Header */}
      <div className="px-4 sm:px-5 py-4 shadow-sm" style={{ backgroundColor: "#fff" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate" style={{ fontFamily: "var(--font-display)", color: "#6B3F1E", fontSize: "1.4rem", fontWeight: 700 }}>
              Menu Manager
            </h1>
            <p className="text-xs" style={{ color: "#5C2A0A" }}>Toggle item, flavor, and addon availability</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchItems} className="p-2 rounded-xl border hover:opacity-80"
              style={{ borderColor: "rgba(107,63,30,0.2)", color: "#6B3F1E" }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setModal("new")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: "#b88917", color: "#fff" }}>
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Add New Item</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">

        {/* Error */}
        {error && (
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: "#fff5f5", border: "1px solid #fed7d7" }}>
            <WifiOff className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#e53e3e" }} />
            <p className="text-xs break-words" style={{ color: "#e53e3e" }}>{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#9C7A5A" }} />
          <input type="text" placeholder="Search menu items..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "rgba(107,63,30,0.2)", backgroundColor: "#fff", color: "#6B3F1E" }} />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {MENU_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium border transition-all"
              style={{
                backgroundColor: activeCategory === cat ? "#6B3F1E" : "#fff",
                color:           activeCategory === cat ? "#fff"    : "#6B3F1E",
                borderColor:     activeCategory === cat ? "#6B3F1E" : "rgba(107,63,30,0.2)",
              }}>{cat}</button>
          ))}
        </div>

        {/* Items table-style list */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: "#fff" }}>

          {/* Column headers — visible on sm+ */}
          <div className="hidden sm:grid px-4 py-3 text-xs font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: "#FAF5EE",
              color: "#b88917",
              gridTemplateColumns: "2.5rem 1fr 7rem 6rem 5rem 7rem",
              gap: "0.75rem",
            }}>
            <div />
            <div>Item</div>
            <div>Category</div>
            <div>Price</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#6B3F1E" }} />
              <p className="text-sm" style={{ color: "#9C7A5A" }}>
                {items.length === 0 ? "No items yet. Add your first item!" : "No items match your search."}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(107,63,30,0.08)" }}>
              {filtered.map(item => {
                const itemFlavors  = getItemFlavors(item);
                const itemAddons   = getItemAddons(item);
                const hasFlavors   = itemFlavors.length > 0;
                const hasAddons    = itemAddons.length > 0;
                const hasDetails   = hasFlavors || hasAddons;
                const isExpanded   = expandedId === item.id;
                const itemAvailable = availability.getAvailable(item.id, "item", item.name);

                return (
                  <div key={item.id}>
                    {/* ── Desktop row ── */}
                    <div className="hidden sm:grid items-center px-4 py-3 hover:bg-orange-50/30 transition-colors"
                      style={{ gridTemplateColumns: "2.5rem 1fr 7rem 6rem 5rem 7rem", gap: "0.75rem" }}>

                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          : <UtensilsCrossed className="w-4 h-4 opacity-30" style={{ color: "#6B3F1E" }} />}
                      </div>

                      {/* Name + description */}
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "#6B3F1E" }}>{item.name}</p>
                        {item.description && (
                          <p className="text-xs truncate mt-0.5" style={{ color: "#9C7A5A" }}>{item.description}</p>
                        )}
                        {hasDetails && (
                          <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="flex items-center gap-1 mt-1 text-xs font-medium"
                            style={{ color: "#b88917" }}>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isExpanded ? "Hide" : "Flavors / Add-ons"}
                          </button>
                        )}
                      </div>

                      {/* Category */}
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: "rgba(107,63,30,0.08)", color: "#6B3F1E" }}>
                          {item.category}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-sm font-semibold" style={{ color: "#6B3F1E" }}>
                        ₱{item.price}
                        {(item.price_m || item.price_l) && (
                          <p className="text-xs font-normal" style={{ color: "#9C7A5A" }}>
                            {item.price_m && `M:₱${item.price_m}`}{item.price_m && item.price_l && " · "}{item.price_l && `L:₱${item.price_l}`}
                          </p>
                        )}
                      </div>

                      {/* Available toggle */}
                      <div className="flex items-center gap-1.5">
                        <Toggle value={itemAvailable} onChange={v => availability.toggle(item.id, "item", item.name, v)} />
                        <span className="text-xs" style={{ color: itemAvailable ? "#3D6B2A" : "#9C7A5A" }}>
                          {itemAvailable ? "On" : "Off"}
                        </span>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:opacity-80"
                          style={{ backgroundColor: "rgba(45,80,22,0.1)", color: "#2D5016" }}>
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80"
                          style={{ backgroundColor: "rgba(229,62,62,0.1)", color: "#e53e3e" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* ── Mobile card ── */}
                    <div className="sm:hidden p-4 flex gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          : <UtensilsCrossed className="w-4 h-4 opacity-30" style={{ color: "#6B3F1E" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: "#6B3F1E" }}>{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{ backgroundColor: "rgba(107,63,30,0.08)", color: "#6B3F1E" }}>{item.category}</span>
                              <span className="text-xs font-semibold" style={{ color: "#6B3F1E" }}>₱{item.price}</span>
                            </div>
                          </div>
                          <Toggle value={itemAvailable} onChange={v => availability.toggle(item.id, "item", item.name, v)} />
                        </div>
                        {item.description && (
                          <p className="text-xs mt-1 line-clamp-1" style={{ color: "#9C7A5A" }}>{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {hasDetails && (
                            <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                              style={{ backgroundColor: "rgba(184,137,23,0.1)", color: "#b88917" }}>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Flavors / Add-ons
                            </button>
                          )}
                          <button onClick={() => setModal(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: "rgba(45,80,22,0.1)", color: "#2D5016" }}>
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                            style={{ backgroundColor: "rgba(229,62,62,0.1)", color: "#e53e3e" }}>
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded flavors / add-ons */}
                    {isExpanded && hasDetails && (
                      <div className="border-t mx-4 mb-3 rounded-xl overflow-hidden"
                        style={{ borderColor: "rgba(107,63,30,0.08)", backgroundColor: "#FAF5EE" }}>
                        {hasFlavors && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide px-3 pt-3 pb-1" style={{ color: "#9C7A5A" }}>Flavors</p>
                            {itemFlavors.map((f: { name: string }) => (
                              <AvailabilityRow key={f.name} itemId={item.id} type="flavor" name={f.name} availability={availability} />
                            ))}
                          </div>
                        )}
                        {hasAddons && (
                          <div className={hasFlavors ? "border-t mt-1" : ""} style={{ borderColor: "rgba(107,63,30,0.08)" }}>
                            <p className="text-xs font-semibold uppercase tracking-wide px-3 pt-3 pb-1" style={{ color: "#9C7A5A" }}>Add-ons</p>
                            {itemAddons.map((a: { name: string }) => (
                              <AvailabilityRow key={a.name} itemId={item.id} type="addon" name={a.name} availability={availability} />
                            ))}
                          </div>
                        )}
                        <div className="pb-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {(modal === "new" || (modal && modal !== "new")) && (
        <ItemModal item={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}