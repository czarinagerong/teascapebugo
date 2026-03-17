import heroImg from '@/assets/d6c24e94846d956e5710f2f3064c11139d2a077e.png';
import storyImg from '@/assets/29d9d733f781ea77b0616d2d30c896e0303063fc.png';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Star, ShoppingCart, X, Check, Minus, Plus, ChevronLeft, ChevronRight, Coffee } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getFeaturedItems, menuItems } from '../data/menuData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// ── Fade-in animation wrapper ─────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Flavor gradient helper ────────────────────────────────────────────────────
function getFlavorGradient(flavor: string): string {
  const l = flavor.toLowerCase();
  if (l.includes('matcha')) return 'linear-gradient(135deg,#2a5c1a,#4a8a30)';
  if (l.includes('dark choc') || (l.includes('chocolate') && l.includes('dark'))) return 'linear-gradient(135deg,#2c1208,#5c2c14)';
  if (l.includes('chocolate') || l.includes('cocoa')) return 'linear-gradient(135deg,#4a200a,#7a4020)';
  if (l.includes('strawberry')) return 'linear-gradient(135deg,#a82838,#d45060)';
  if (l.includes('taro')) return 'linear-gradient(135deg,#5a3878,#8a60a8)';
  if (l.includes('mango')) return 'linear-gradient(135deg,#b86a10,#d89030)';
  if (l.includes('caramel')) return 'linear-gradient(135deg,#986010,#c88830)';
  if (l.includes('cappuccino') || l.includes('macchiato')) return 'linear-gradient(135deg,#3a2010,#6a4020)';
  if (l.includes('hazelnut')) return 'linear-gradient(135deg,#6a4010,#9a6830)';
  if (l.includes('red velvet')) return 'linear-gradient(135deg,#6a1010,#a03030)';
  if (l.includes('cookies')) return 'linear-gradient(135deg,#1a1a1a,#484848)';
  if (l.includes('okinawa')) return 'linear-gradient(135deg,#7a4808,#a87028)';
  if (l.includes('hokkaido')) return 'linear-gradient(135deg,#c09030,#e0b850)';
  return 'linear-gradient(135deg,#4A2810,#6B3F1E)';
}

// ── Customization Modal ────────────────────────────────────────────────────────
interface CustomizeModalProps {
  item: ReturnType<typeof getFeaturedItems>[0];
  onClose: () => void;
  onAdd: (opts: { size: string; flavor: string; addons: string[]; qty: number }) => void;
}
function CustomizeModal({ item, onClose, onAdd }: CustomizeModalProps) {
  // find full data with flavors/addons from menuItems
  const full = menuItems.find(m => m.id === item.id) || item;
  const [size, setSize] = useState((full as any).sizes?.[0] || '');
  const [flavor, setFlavor] = useState((full as any).flavors?.[0]?.name || '');
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const toggleAddon = (name: string) => setAddons(prev => prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]);

  const getPrice = () => {
    let base = (full as any).priceM || (full as any).price || 0;
    if (size === 'L' || size === '11in') base = (full as any).priceL || base;
    const addonSum = ((full as any).addons || []).filter((a: any) => addons.includes(a.name)).reduce((s: number, a: any) => s + (a.price || 0), 0);
    return (base + addonSum) * qty;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 pt-3" style={{ backgroundColor: 'rgba(0,0,0,0.58)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#FFFFFF', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Header image */}
        {item.image ? (
          <div className="h-40 overflow-hidden relative">
            <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#2e210e,#6B3F1E)' }}>
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#2e210e', fontWeight: 700, fontSize: '1.1rem' }}>{item.name}</h3>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7A5030', fontFamily: 'var(--font-body)' }}>{item.description}</p>
          </div>

          {/* 1. Flavor */}
          {(full as any).flavors && (full as any).flavors.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>Flavor</p>
              <div className="flex flex-wrap gap-2">
                {(full as any).flavors.map((f: { name: string; image?: string }) => (
                  <button
                    key={f.name}
                    onClick={() => setFlavor(f.name)}
                    className="rounded-xl overflow-hidden border-2 transition-all"
                    style={{ borderColor: flavor === f.name ? '#b88917' : 'rgba(46,33,14,0.15)', width: '64px' }}
                  >
                    <div
                      className="h-9 flex items-center justify-center relative overflow-hidden"
                      style={{ backgroundColor: f.image ? undefined : '#f4efe4' }}
                    >
                      {f.image ? (
                        <img src={f.image} alt={f.name} className="w-full h-full object-contain" />
                      ) : (
                        <Coffee className="w-4 h-4" style={{ color: '#b88917', opacity: 0.55 }} />
                      )}
                      {flavor === f.name ? (
                        <span className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                          <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                      ) : null}
                    </div>
                    <div className="py-1 px-0.5 text-center" style={{ backgroundColor: flavor === f.name ? 'rgba(184,137,23,0.08)' : '#fafafa' }}>
                      <span className="block leading-tight" style={{ color: '#2e210e', fontSize: '8px', fontFamily: 'var(--font-body)' }}>{f.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Size */}
          {(full as any).sizes && (full as any).sizes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>Size</p>
              <div className="flex gap-2">
                {(full as any).sizes.map((s: string) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className="flex-1 py-2.5 rounded-xl text-sm border transition-all"
                    style={{ backgroundColor: size === s ? '#b88917' : 'transparent', color: size === s ? '#fff' : '#2e210e', borderColor: size === s ? '#b88917' : 'rgba(46,33,14,0.15)', fontFamily: 'var(--font-body)' }}
                  >
                    {s}
                    <span className="block text-xs opacity-75">P{s === 'M' || s === '8in' ? ((full as any).priceM || (full as any).price) : ((full as any).priceL || (full as any).price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Add-ons — pill buttons (no image) */}
          {((full as any).addons || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>Add-ons</p>
              <div className="flex flex-wrap gap-2">
                {((full as any).addons as { name: string; price: number }[]).map((a) => {
                  const sel = addons.includes(a.name);
                  return (
                    <button
                      key={a.name}
                      onClick={() => toggleAddon(a.name)}
                      className="px-3 py-2 rounded-xl text-xs border-2 transition-all focus:outline-none"
                      style={{
                        backgroundColor: sel ? '#b88917' : 'transparent',
                        color: sel ? '#fff' : '#2e210e',
                        borderColor: sel ? '#b88917' : 'rgba(46,33,14,0.2)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {a.name}
                      <span className="block opacity-80" style={{ fontSize: '10px' }}>+₱{a.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Quantity */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>Quantity</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: '#b88917', color: '#2e210e' }}>
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-semibold w-6 text-center" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#b88917', color: '#fff' }}>
                <Plus className="w-4 h-4" />
              </button>
              <span className="ml-auto font-semibold" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>P{getPrice()}</span>
            </div>
          </div>

          <button
            onClick={() => onAdd({ size, flavor, addons, qty })}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#b88917', fontFamily: 'var(--font-body)' }}
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart — P{getPrice()}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────────────
interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
}

const SEED_REVIEWS: Review[] = [
  { id: 'r1', name: 'Ramila', rating: 5, text: 'The Cheesecake Series milk tea is absolutely divine! Creamy, sweet, and just perfect. Will definitely order again and again!', date: 'March 10, 2026' },
  { id: 'r2', name: 'Mary Jean', rating: 5, text: 'Korean Ramen hits different here. Super flavorful with all the toppings — egg, crab meat, nori. A must-try!', date: 'March 8, 2026' },
  { id: 'r3', name: 'Dane', rating: 4, text: 'Love the cozy vibe and the food is consistently good. The Hawaiianscape Pizza is my go-to every visit!', date: 'March 5, 2026' },
  { id: 'r4', name: 'Czarina', rating: 5, text: 'Best milk tea in Bugo! The Classic Series is so good, especially the Wintermelon flavor with pearls.', date: 'March 3, 2026' },
  { id: 'r7', name: 'Keigh Anne', rating: 5, text: 'masarap ang ramen mapapa ahh dadi ka talaga', date: 'March 12, 2026' },
];

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
          style={{ background: 'none', border: 'none', padding: '1px' }}
        >
          <Star
            className="w-5 h-5"
            style={{
              fill: i <= (hovered || rating) ? '#b88917' : 'none',
              color: i <= (hovered || rating) ? '#b88917' : '#d4c8b0',
              transition: 'all 0.15s',
            }}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ hasOrdered }: { hasOrdered: boolean }) {
  const REVIEWS_PER_PAGE = 3;
  const [allReviews, setAllReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('teascape_reviews');
      if (saved) return [...JSON.parse(saved), ...SEED_REVIEWS.filter(s => !JSON.parse(saved).find((r: Review) => r.id === s.id))];
    } catch {}
    return SEED_REVIEWS;
  });
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const totalPages = Math.ceil(allReviews.length / REVIEWS_PER_PAGE);
  const visible = allReviews.slice(page * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE + REVIEWS_PER_PAGE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const newReview: Review = {
      id: `r-${Date.now()}`,
      name: name.trim(),
      rating,
      text: text.trim(),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    const updated = [newReview, ...allReviews];
    setAllReviews(updated);
    try { localStorage.setItem('teascape_reviews', JSON.stringify(updated.filter(r => !SEED_REVIEWS.find(s => s.id === r.id)))); } catch {}
    setName(''); setRating(5); setText('');
    setSubmitted(true);
    setShowForm(false);
    setPage(0);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <section className="py-14 sm:py-20 px-6" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.22em] mb-3" style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            What Our Customers Say
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#556419', fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 700, fontStyle: 'italic' }}>
            Customer Reviews
          </h2>
        </FadeIn>

        {/* Review Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {visible.map((review, i) => (
            <FadeIn key={review.id} delay={i * 0.07}>
              <div className="rounded-2xl p-5 h-full flex flex-col" style={{ backgroundColor: '#fff', border: '1px solid rgba(46,33,14,0.07)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <StarRating rating={review.rating} />
                <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: '#5C3A1A', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                  "{review.text}"
                </p>
                <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(46,33,14,0.08)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#2e210e', fontFamily: 'var(--font-display)' }}>{review.name}</p>
                  <p className="text-xs" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>{review.date}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ backgroundColor: page === 0 ? 'rgba(46,33,14,0.08)' : '#b88917', color: page === 0 ? '#2e210e' : '#fff' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="rounded-full transition-all"
                style={{ width: i === page ? '24px' : '8px', height: '8px', backgroundColor: i === page ? '#b88917' : 'rgba(46,33,14,0.2)' }}
              />
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ backgroundColor: page >= totalPages - 1 ? 'rgba(46,33,14,0.08)' : '#b88917', color: page >= totalPages - 1 ? '#2e210e' : '#fff' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Write Review CTA */}
        <div className="text-center">
          {submitted && (
            <div className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ backgroundColor: '#556419', color: '#fff', fontFamily: 'var(--font-body)' }}>
              <Check className="w-4 h-4" /> Review submitted! Thank you.
            </div>
          )}
          {!hasOrdered ? (
            <div className="inline-block px-6 py-3 rounded-2xl text-sm" style={{ backgroundColor: 'rgba(46,33,14,0.06)', color: '#5C3A1A', fontFamily: 'var(--font-body)' }}>
              🛒 Place an order first to leave a review
            </div>
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
            >
              Write a Review
            </button>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-w-md mx-auto rounded-2xl p-5 text-left"
              style={{ backgroundColor: '#fff', border: '1px solid rgba(46,33,14,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}
            >
              <h3 className="mb-4" style={{ fontFamily: 'var(--font-display)', color: '#2e210e', fontWeight: 700 }}>Share your experience</h3>
              <div className="mb-3">
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#2e210e' }}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'rgba(46,33,14,0.2)', backgroundColor: '#FAFAFA', color: '#2e210e', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div className="mb-3">
                <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: '#2e210e' }}>Rating</label>
                <StarRating rating={rating} onChange={setRating} />
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#2e210e' }}>Review</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  required
                  placeholder="Tell us about your experience..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: 'rgba(46,33,14,0.2)', backgroundColor: '#FAFAFA', color: '#2e210e', fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                  style={{ backgroundColor: 'rgba(46,33,14,0.08)', color: '#2e210e', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { addToCart, placedOrder } = useApp();
  const featured = getFeaturedItems();
  const [scrollY, setScrollY] = useState(0);
  const [customizeItem, setCustomizeItem] = useState<typeof featured[0] | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const handleAdd = (item: typeof featured[0], opts: { size: string; flavor: string; addons: string[]; qty: number }) => {
    for (let i = 0; i < opts.qty; i++) {
      addToCart({
        id: `${item.id}-${Date.now()}-${i}`,
        name: item.name,
        category: item.category,
        price: item.price,
        image: item.image,
        size: opts.size || undefined,
        flavor: opts.flavor || undefined,
        addons: opts.addons.length > 0 ? opts.addons : undefined,
      });
    }
    setCustomizeItem(null);
    showToast();
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Parallax image */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            style={{
              position: 'absolute',
              inset: '-15%',
              transform: `translateY(${scrollY * 0.38}px)`,
              willChange: 'transform',
            }}
          >
            <ImageWithFallback
              src={heroImg}
              alt="Teascape Bugo Cafe"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 10%' }}
            />
          </div>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(20,12,4,0.55) 0%, rgba(20,12,4,0.42) 45%, rgba(20,12,4,0.78) 100%)' }}
          />
        </div>

        <div className="relative z-10 px-6 max-w-4xl mx-auto w-full">
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="text-white mb-4"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '64px',
              fontWeight: 700,
              fontStyle: 'italic',
              lineHeight: 1.1,
              letterSpacing: 0,
              textShadow: '0 2px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            Escape the<br />
            Reality with us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: 'easeOut' }}
            className="text-white/85 mb-8 leading-relaxed"
            style={{
              fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
              fontFamily: 'var(--font-body)',
              maxWidth: '560px',
              textShadow: '0 1px 8px rgba(0,0,0,0.45)',
            }}
          >
            Your cozy escape in the heart of Bugo CDO.<br />
            Good tea, great food, and a warm atmosphere to call your own.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: 'easeOut' }}
            className="flex flex-wrap gap-3"
          >
            <Link
              to="/menu"
              className="px-6 py-3 rounded-md font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
              style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
            >
              ORDER NOW
            </Link>
            <Link
              to="/menu"
              className="px-6 py-3 rounded-md font-semibold text-sm transition-all hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#fff',
                fontFamily: 'var(--font-body)',
              }}
            >
              VIEW MENU
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Our Story ─────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-6" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Polaroid photo */}
            <FadeIn delay={0.05} className="flex items-center justify-center order-2 md:order-1">
              <div
                style={{
                  transform: 'rotate(-3deg)',
                  backgroundColor: '#fff',
                  padding: '10px 10px 28px 10px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
                  maxWidth: '380px',
                  width: '100%',
                }}
              >
                <div className="overflow-hidden h-64 md:h-80">
                  <ImageWithFallback
                    src={storyImg}
                    alt="Teascape Bugo interior"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </FadeIn>

            {/* Text */}
            <FadeIn delay={0.15} className="order-1 md:order-2">
              <p
                className="text-xs uppercase tracking-[0.22em] mb-3"
                style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Our Story
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  color: '#556419',
                  fontSize: 'clamp(1.7rem, 3vw, 2.2rem)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  lineHeight: 1.25,
                }}
                className="mb-4"
              >
                More than just a milk tea
              </h2>
              <p className="leading-relaxed mb-4 text-sm" style={{ color: '#5C3A1A', fontFamily: 'var(--font-body)' }}>
                Teascape Bugo was born from a love of cozy spaces and great flavors, bringing the best of Thai-inspired milk tea culture to the heart of Bugo, CDO. We believe every visit should feel like a warm escape from the everyday.
              </p>
              <p className="leading-relaxed mb-6 text-sm" style={{ color: '#5C3A1A', fontFamily: 'var(--font-body)' }}>
                From our signature Cheesecake Milk Tea to hearty Korean Ramen and crispy pizzas, we've crafted a menu that has something for everyone — because food tastes better when shared.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 font-semibold text-sm"
                style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}
              >
                Read our full story <ArrowRight className="w-4 h-4" />
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Favorites ─────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 px-6" style={{ backgroundColor: '#f4efe4' }}>
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-10">
            <p
              className="text-xs uppercase tracking-[0.22em] mb-3"
              style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Favorites
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                color: '#556419',
                fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
                fontWeight: 700,
                fontStyle: 'italic',
              }}
            >
              Must-Try Items
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((item, i) => (
              <FadeIn key={item.id} delay={i * 0.07}>
                <div
                  className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer h-full"
                  style={{ backgroundColor: '#fff', border: '1px solid rgba(46,33,14,0.08)' }}
                  onClick={() => setCustomizeItem(item)}
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    {item.image ? (
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f4efe4' }}>
                        <ShoppingCart className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {item.isBestseller && (
                      <div
                        className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
                      >
                        <Star className="w-3 h-3 fill-current" /> Bestseller
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col">
                    <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{item.category}</p>
                    <h3
                      className="font-semibold mb-1 leading-snug text-sm"
                      style={{ color: '#556419', fontFamily: 'var(--font-display)' }}
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: '#7A5030', fontFamily: 'var(--font-body)' }}>{item.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-semibold text-sm" style={{ color: '#2e210e', fontFamily: 'var(--font-body)' }}>
                        P{item.priceM || item.price}
                        {item.priceL && <span className="text-xs text-gray-400"> /M</span>}
                      </span>
                      <div
                        onClick={e => {e.stopPropagation();setCustomizeItem(item); }}
                        className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: '#556419', color: '#fff', fontFamily: 'var(--font-body)' }}
                      >
                        <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
            >
              View Full Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      <ReviewsSection hasOrdered={!!placedOrder} />

      {/* ── Ready to Order ────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 px-6">
        <FadeIn>
          <div
            className="max-w-4xl mx-auto rounded-3xl text-center py-14 px-6"
            style={{ background: 'linear-gradient(135deg, #1a0e05 0%, #2e210e 55%, #4a3010 100%)' }}
          >
            <p
              className="text-xs uppercase tracking-[0.22em] mb-3"
              style={{ color: '#b88917', fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Ready to Order?
            </p>
            <h2
              className="text-white mb-4"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                fontStyle: 'normal',
              }}
            >
              Order Online, Pick Up or Delivery
            </h2>
            <p
              className="text-white/70 mb-7 max-w-md mx-auto text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Skip the wait. Order your favorites online and enjoy fast delivery or pickup from Teascape.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold transition-all hover:scale-105 text-sm"
              style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
            >
              Order Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Customize Modal ───────────────────────────────────────────────── */}
      {customizeItem && (
        <CustomizeModal
          item={customizeItem}
          onClose={() => setCustomizeItem(null)}
          onAdd={opts => handleAdd(customizeItem, opts)}
        />
      )}

      {/* ── Added to Cart Toast ───────────────────────────────────────────── */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-xl"
          style={{ backgroundColor: '#556419', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Check className="w-4 h-4" /> Added to cart.
        </motion.div>
      )}
    </div>
  );
}