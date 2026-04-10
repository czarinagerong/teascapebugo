import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ShoppingCart, Plus, Star, X, Check, Search,
  LayoutGrid, Coffee, UtensilsCrossed, Soup, Users,
  Package, User, Sandwich, Pizza, Wheat,
  GlassWater, Minus, Droplets,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { menuItems as staticMenuItems, MENU_CATEGORIES, MenuItemData } from '../data/menuData';
import { getPublicMenuItems } from '../lib/api';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useMenuAvailability } from '../hooks/useMenuAvailability';

function getCategoryIcon(cat: string) {
  const map: Record<string, React.ReactNode> = {
    'All':        <LayoutGrid className="w-3.5 h-3.5" />,
    'Milk Tea':   <Coffee className="w-3.5 h-3.5" />,
    'Pasta':      <UtensilsCrossed className="w-3.5 h-3.5" />,
    'Ramen':      <Soup className="w-3.5 h-3.5" />,
    'Sharing':    <Users className="w-3.5 h-3.5" />,
    'Combo':      <Package className="w-3.5 h-3.5" />,
    'Solo':       <User className="w-3.5 h-3.5" />,
    'Siomai':     <Sandwich className="w-3.5 h-3.5" />,
    'Pizza':      <Pizza className="w-3.5 h-3.5" />,
    'Rice Meals': <Wheat className="w-3.5 h-3.5" />,
    'Drinks':     <GlassWater className="w-3.5 h-3.5" />,
  };
  return map[cat] || <Coffee className="w-3.5 h-3.5" />;
}

interface AddToCartModalProps {
  item: MenuItemData;
  onClose: () => void;
  onAdd: (item: MenuItemData, size: string, flavor: string, addons: string[], qty: number, refresherFlavor?: string) => void;
}

function AddToCartModal({ item, onClose, onAdd }: AddToCartModalProps) {
  const { isFlavorAvailable, isAddonAvailable } = useMenuAvailability();

  // Default to first available flavor
  const firstAvailableFlavor = item.flavors?.find(f => isFlavorAvailable(item.id, f.name))?.name || item.flavors?.[0]?.name || '';
  const [selectedFlavor, setSelectedFlavor]           = useState(firstAvailableFlavor);
  const [selectedSize, setSelectedSize]               = useState(item.sizes?.[0] || '');
  const [selectedAddons, setSelectedAddons]           = useState<string[]>([]);
  const [qty, setQty]                                 = useState(1);
  const [selectedRefresherFlavor, setSelectedRefresherFlavor] = useState(item.refresherFlavors?.[0]?.name || '');

  const selectedFlavorObj = item.flavors?.find(f => f.name === selectedFlavor);
  const displayImage = selectedFlavorObj?.image || item.image;

  const getBasePrice = () => {
    if (item.sizes && selectedSize) {
      if (selectedSize === 'L' || selectedSize === '11in' || selectedSize === 'Pitcher') return item.priceL || item.price;
      return item.priceM || item.price;
    }
    return item.price;
  };

  const addonTotal = selectedAddons.reduce((sum, addon) => {
    const a = item.addons?.find(a => a.name === addon);
    return sum + (a?.price || 0);
  }, 0);

  const totalPrice = (getBasePrice() + addonTotal) * qty;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 sm:px-6 pb-3 pt-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full rounded-2xl shadow-2xl flex flex-col" style={{ backgroundColor: '#FFFFFF', maxHeight: '92vh', maxWidth: '480px' }}>
        <div className="overflow-y-auto flex-1 rounded-2xl">
          {displayImage ? (
            <div className="h-52 sm:h-60 rounded-t-2xl overflow-hidden relative shrink-0">
              <ImageWithFallback src={displayImage} alt={selectedFlavor || item.name} className="w-full h-full object-cover transition-all duration-300" />
              {item.isBestseller && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#b88917', color: '#fff' }}>
                  <Star className="w-3 h-3 fill-current" /> Bestseller
                </div>
              )}
              <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="h-28 rounded-t-2xl flex items-center justify-center relative shrink-0" style={{ background: 'linear-gradient(135deg, #2e210e, #4A2810)' }}>
              <Coffee className="w-10 h-10 text-white/30" />
              <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <div className="p-5 sm:p-6">
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#2e210e', fontSize: '1.2rem', fontWeight: 700 }} className="mb-1">{item.name}</h3>
            <p className="text-sm mb-3 leading-relaxed" style={{ color: '#5C2A0A' }}>{item.description}</p>
            {item.note && <p className="text-xs italic mb-3 px-3 py-1.5 rounded-lg" style={{ color: '#b88917', backgroundColor: 'rgba(184,137,23,0.08)' }}>{item.note}</p>}

            {/* Flavors with availability */}
            {item.flavors && item.flavors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#2e210e' }}>Flavor</p>
                {item.flavors.every(f => !f.image) ? (
                  <div className="flex flex-wrap gap-2">
                    {item.flavors.map(f => {
                      const available = isFlavorAvailable(item.id, f.name);
                      return (
                        <button key={f.name} onClick={() => available && setSelectedFlavor(f.name)} disabled={!available}
                          className="px-4 py-2.5 rounded-xl text-sm border-2 transition-all focus:outline-none relative"
                          style={{
                            backgroundColor: selectedFlavor === f.name ? '#b88917' : available ? 'transparent' : 'rgba(0,0,0,0.04)',
                            color: !available ? '#bbb' : selectedFlavor === f.name ? '#fff' : '#2e210e',
                            borderColor: !available ? '#e0e0e0' : selectedFlavor === f.name ? '#b88917' : 'rgba(46,33,14,0.2)',
                            cursor: available ? 'pointer' : 'not-allowed',
                          }}>
                          {f.name}
                          {!available && <span className="block text-xs" style={{ color: '#bbb' }}>Unavailable</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {item.flavors.map(f => {
                      const available = isFlavorAvailable(item.id, f.name);
                      return (
                        <button key={f.name} onClick={() => available && setSelectedFlavor(f.name)} disabled={!available}
                          className="rounded-xl overflow-hidden border-2 transition-all focus:outline-none flex-shrink-0"
                          style={{
                            borderColor: !available ? '#e0e0e0' : selectedFlavor === f.name ? '#b88917' : 'rgba(46,33,14,0.15)',
                            width: '80px', opacity: available ? 1 : 0.5, cursor: available ? 'pointer' : 'not-allowed',
                          }}>
                          <div className="relative overflow-hidden flex items-center justify-center" style={{ width: '80px', height: '80px', backgroundColor: f.image ? '#fff' : '#f4efe4' }}>
                            {f.image ? <img src={f.image} alt={f.name} className="w-full h-full object-contain" /> : <Coffee className="w-7 h-7" style={{ color: '#b88917', opacity: 0.5 }} />}
                            {selectedFlavor === f.name && available && (
                              <span className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.22)' }}>
                                <Check className="w-5 h-5 text-white drop-shadow" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-center px-1 py-1" style={{ backgroundColor: selectedFlavor === f.name && available ? 'rgba(184,137,23,0.09)' : '#FAFAFA' }}>
                            <span className="text-center leading-tight" style={{ color: available ? '#2e210e' : '#bbb', fontSize: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%' }}>
                              {f.name}{!available && <span className="block" style={{ color: '#e53e3e', fontSize: '9px' }}>Unavailable</span>}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Refresher Flavor */}
            {item.refresherFlavors && item.refresherFlavors.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="w-4 h-4" style={{ color: '#2e9c7a' }} />
                  <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#2e210e' }}>Included Refresher Flavor</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(46,156,122,0.12)', color: '#2e9c7a' }}>Free</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.refresherFlavors.map(f => (
                    <button key={f.name} onClick={() => setSelectedRefresherFlavor(f.name)}
                      className="rounded-xl overflow-hidden border-2 transition-all flex-shrink-0"
                      style={{ borderColor: selectedRefresherFlavor === f.name ? '#2e9c7a' : 'rgba(46,33,14,0.15)', width: '80px' }}>
                      <div className="relative overflow-hidden flex items-center justify-center" style={{ width: '80px', height: '80px', backgroundColor: f.image ? '#fff' : '#f4efe4' }}>
                        {f.image ? <img src={f.image} alt={f.name} className="w-full h-full object-contain" /> : <Droplets className="w-7 h-7" style={{ color: '#2e9c7a', opacity: 0.5 }} />}
                        {selectedRefresherFlavor === f.name && <span className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.22)' }}><Check className="w-5 h-5 text-white" /></span>}
                      </div>
                      <div className="flex items-center justify-center px-1 py-1" style={{ backgroundColor: selectedRefresherFlavor === f.name ? 'rgba(46,156,122,0.09)' : '#FAFAFA' }}>
                        <span style={{ color: '#2e210e', fontSize: '10px' }}>{f.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {item.sizes && item.sizes.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#2e210e' }}>Size</p>
                <div className="flex gap-3">
                  {item.sizes.map(size => (
                    <button key={size} onClick={() => setSelectedSize(size)} className="flex-1 py-3 rounded-xl text-sm border transition-all"
                      style={{ backgroundColor: selectedSize === size ? '#b88917' : 'transparent', color: selectedSize === size ? '#fff' : '#2e210e', borderColor: selectedSize === size ? '#b88917' : 'rgba(46,33,14,0.2)' }}>
                      {size}
                      <span className="block text-xs opacity-75">P{(size === 'L' || size === '11in' || size === 'Pitcher') ? (item.priceL || item.price) : (item.priceM || item.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons with availability */}
            {item.addons && item.addons.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#2e210e' }}>Add-ons</p>
                <div className="flex flex-wrap gap-2">
                  {item.addons.map(addon => {
                    const available = isAddonAvailable(item.id, addon.name);
                    const selected = selectedAddons.includes(addon.name);
                    return (
                      <button key={addon.name} disabled={!available}
                        onClick={() => available && setSelectedAddons(prev => selected ? prev.filter(a => a !== addon.name) : [...prev, addon.name])}
                        className="px-4 py-2.5 rounded-xl text-sm border-2 transition-all focus:outline-none"
                        style={{
                          backgroundColor: selected && available ? '#b88917' : available ? 'transparent' : 'rgba(0,0,0,0.04)',
                          color: !available ? '#bbb' : selected ? '#fff' : '#2e210e',
                          borderColor: !available ? '#e0e0e0' : selected ? '#b88917' : 'rgba(46,33,14,0.2)',
                          cursor: available ? 'pointer' : 'not-allowed',
                        }}>
                        {addon.name}
                        <span className="block text-xs opacity-80">
                          {available ? `+P${addon.price}` : 'Unavailable'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#2e210e' }}>Quantity</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border flex items-center justify-center" style={{ borderColor: '#b88917', color: '#2e210e' }}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-semibold w-6 text-center" style={{ color: '#2e210e' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#b88917', color: '#fff' }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(46,33,14,0.12)' }}>
              <span className="font-semibold" style={{ color: '#2e210e', fontSize: '1.2rem' }}>P{totalPrice}</span>
              <button onClick={() => onAdd(item, selectedSize, selectedFlavor, selectedAddons, qty, item.refresherFlavors?.length ? selectedRefresherFlavor : undefined)}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#556419', color: '#fff' }}>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('All');
const [dbItems, setDbItems] = useState<MenuItemData[]>([]);

useEffect(() => {
  getPublicMenuItems().then(data => {
    const staticIds = new Set(staticMenuItems.map(i => i.id));
    const newItems: MenuItemData[] = data
      .filter(d => !staticIds.has(d.id))
      .map(d => ({
        id: d.id,
        name: d.name,
        category: d.category,
        description: d.description || '',
        price: parseFloat(d.price) || 0,
        priceM: d.price_m || undefined,
        priceL: d.price_l || undefined,
        sizes: d.sizes ? (() => { try { return JSON.parse(d.sizes!); } catch { return undefined; } })() : undefined,
        flavors: d.flavors ? (() => { try { return JSON.parse(d.flavors!); } catch { return []; } })() : undefined,
        addons: d.addons ? (() => { try { return JSON.parse(d.addons!); } catch { return []; } })() : undefined,
        image: d.image_url || undefined,
        available: d.available,
      }));
    setDbItems(newItems);
  }).catch(() => {});
}, []);

const menuItems = [...staticMenuItems, ...dbItems];
  const [searchQuery, setSearchQuery]       = useState('');
  const [modalItem, setModalItem]           = useState<MenuItemData | null>(null);
  const [toastMsg, setToastMsg]             = useState('');
  const [searchHighlight, setSearchHighlight] = useState(false);
  const { cartCount, addToCart }            = useApp();
  const { isItemAvailable, allFlavorsUnavailable } = useMenuAvailability();
  const navigate                            = useNavigate();
  const location                            = useLocation();
  const searchRef                           = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((location.state as Record<string, unknown>)?.focusSearch) {
      setTimeout(() => {
        searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { searchRef.current?.focus(); setSearchHighlight(true); setTimeout(() => setSearchHighlight(false), 1800); }, 400);
      }, 100);
    }
  }, [location.state]);

  const filtered = (() => {
    let items = activeCategory === 'All' ? menuItems : menuItems.filter(i => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.flavors?.some(f => f.name.toLowerCase().includes(q)));
    }
    return items;
  })();

  const handleAdd = (item: MenuItemData, size: string, flavor: string, addons: string[], qty: number = 1, refresherFlavor?: string) => {
    const addonTotal = addons.reduce((sum, addonName) => { const a = item.addons?.find(a => a.name === addonName); return sum + (a?.price || 0); }, 0);
    let price = item.price;
    if (size === 'L' || size === '11in' || size === 'Pitcher') price = item.priceL || item.price;
    else if (size === 'M' || size === '8in' || size === 'Glass') price = item.priceM || item.price;
    const flavorDisplay = [flavor, refresherFlavor ? `Refresher: ${refresherFlavor}` : ''].filter(Boolean).join(' + ') || undefined;
    const stableId = `${item.id}__${size}__${flavorDisplay || ''}__${addons.sort().join(',')}`;
    addToCart({ id: stableId, name: item.name, category: item.category, size: size || undefined, flavor: flavorDisplay, addons: addons.length > 0 ? addons : undefined, price: price + addonTotal, image: item.image, quantity: qty });
    setModalItem(null);
    setToastMsg(`${item.name} added to cart!`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const focusSearch = () => { searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => searchRef.current?.focus(), 350); };

  const isSoldOut = (item: MenuItemData): boolean => {
    if (!isItemAvailable(item.id)) return true;
    if (item.flavors && item.flavors.length > 0) return allFlavorsUnavailable(item.id, item.flavors.map(f => f.name));
    return false;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="py-10 px-4" style={{ background: 'linear-gradient(135deg, #1a0e05 0%, #2e210e 55%, #4a3010 100%)' }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#b88917', fontWeight: 600 }}>Our Menu</p>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontStyle: 'italic' }} className="mb-2">What's on the Menu?</h1>
          <p className="text-white/70 mb-5 text-sm">Tap an item to customize and add to cart</p>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" color={searchHighlight ? '#b88917' : '#ffffff'} strokeWidth={2.5} />
            <input ref={searchRef} type="text" placeholder="Search for drinks, food, flavors..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full text-sm outline-none transition-all placeholder-white/70"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: searchHighlight ? '2px solid #b88917' : '1.5px solid rgba(255,255,255,0.55)', color: '#fff', boxShadow: searchHighlight ? '0 0 0 4px rgba(184,137,23,0.35)' : 'none', transition: 'border 0.3s, box-shadow 0.3s' }} />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-30 shadow-sm" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(46,33,14,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 py-4">
            {MENU_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all"
                style={{ backgroundColor: activeCategory === cat ? '#b88917' : 'transparent', color: activeCategory === cat ? '#fff' : '#2e210e', borderColor: activeCategory === cat ? '#b88917' : 'rgba(46,33,14,0.2)' }}>
                {getCategoryIcon(cat)}<span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {searchQuery.trim() && (
          <div className="mb-4 flex items-center gap-2">
            <Search className="w-4 h-4" style={{ color: '#b88917' }} />
            <p className="text-sm" style={{ color: '#2e210e' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} for <strong>"{searchQuery}"</strong></p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#2e210e' }} />
            <p className="font-semibold mb-1" style={{ color: '#2e210e', fontFamily: 'var(--font-display)' }}>No items found</p>
            <p className="text-sm" style={{ color: '#5C2A0A' }}>Try a different search term or category</p>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-4 px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90" style={{ backgroundColor: '#b88917', color: '#fff' }}>Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => {
              const soldOut = isSoldOut(item);
              return (
                <div key={item.id}
                  className={`rounded-2xl overflow-hidden shadow-sm transition-all group ${soldOut ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}`}
                  style={{ backgroundColor: '#fff', border: '1px solid rgba(46,33,14,0.07)' }}
                  onClick={() => !soldOut && setModalItem(item)}>
                  <div className="relative h-36 sm:h-44 overflow-hidden">
                    {item.image ? (
                      <ImageWithFallback src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-500 ${soldOut ? '' : 'group-hover:scale-110'}`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: 'linear-gradient(135deg, rgba(46,33,14,0.08), rgba(184,137,23,0.12))' }}>
                        {getCategoryIcon(item.category)}
                      </div>
                    )}

                    {/* Sold out overlay */}
                    {soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#e53e3e', color: '#fff' }}>Sold Out</span>
                      </div>
                    )}

                    {item.isBestseller && !soldOut && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#b88917', color: '#fff' }}>
                        <Star className="w-3 h-3 fill-current" /><span className="hidden sm:inline">Bestseller</span>
                      </div>
                    )}
                    {item.refresherFlavors && item.refresherFlavors.length > 0 && !soldOut && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(46,156,122,0.9)', color: '#fff' }}>
                        <Droplets className="w-2.5 h-2.5" /> +Refresher
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: '#b88917', fontWeight: 600 }}>{item.category}</p>
                    <h3 className="font-semibold leading-snug mb-1 text-sm" style={{ color: '#556419', fontFamily: 'var(--font-display)' }}>{item.name}</h3>
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: '#5C2A0A' }}>{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold" style={{ color: '#2e210e' }}>
                        P{item.priceM || item.price}{item.priceL && <span className="text-xs text-gray-400"> /M</span>}
                      </span>
                      {soldOut ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(229,62,62,0.1)', color: '#e53e3e' }}>Sold Out</span>
                      ) : (
                        <div className="w-11 h-11 rounded-full flex items-center justify-center transition-all group-hover:scale-110 cursor-pointer" style={{ backgroundColor: '#556419' }}
                          onClick={e => { e.stopPropagation(); setModalItem(item); }}>
                          <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalItem && <AddToCartModal item={modalItem} onClose={() => setModalItem(null)} onAdd={handleAdd} />}

      {cartCount > 0 && (
        <button onClick={() => navigate('/cart')} className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl font-semibold text-sm transition-all hover:scale-105" style={{ backgroundColor: '#b88917', color: '#fff' }}>
          <ShoppingCart className="w-5 h-5" /> Cart ({cartCount})
        </button>
      )}

      <button onClick={focusSearch} className="fixed bottom-6 left-4 sm:left-6 z-40 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 md:hidden" style={{ backgroundColor: '#2e210e', color: '#fff' }} aria-label="Jump to search">
        <Search className="w-5 h-5" />
      </button>

      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap" style={{ backgroundColor: '#556419', color: '#fff' }}>
          <Check className="w-4 h-4" /> {toastMsg}
        </div>
      )}
    </div>
  );
}