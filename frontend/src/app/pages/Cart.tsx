import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Utensils, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// ── Remove confirmation modal ─────────────────────────────────────────────────
function RemoveConfirmModal({
  itemName,
  onConfirm,
  onCancel,
}: {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#fff' }}
      >
        <div className="p-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(229,62,62,0.1)' }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: '#e53e3e' }} />
          </div>
          <h3
            className="text-center font-semibold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: '#2e210e', fontSize: '1rem' }}
          >
            Remove Item?
          </h3>
          <p className="text-center text-sm mb-5" style={{ color: '#5C2A0A' }}>
            Remove <strong>"{itemName}"</strong> from your cart?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: 'rgba(107,63,30,0.2)', color: '#6B3F1E' }}
            >
              Keep It
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#e53e3e' }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartSubtotal } = useApp();
  const navigate = useNavigate();

  // Track which item is pending removal confirmation
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);

  const handleMinusClick = (id: string, name: string, quantity: number) => {
    if (quantity === 1) {
      // Instead of removing silently, show confirmation
      setPendingRemove({ id, name });
    } else {
      updateQuantity(id, quantity - 1);
    }
  };

  const handleTrashClick = (id: string, name: string) => {
    setPendingRemove({ id, name });
  };

  const handleConfirmRemove = () => {
    if (pendingRemove) {
      removeFromCart(pendingRemove.id);
      setPendingRemove(null);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(107,63,30,0.08)' }}
        >
          <ShoppingBag className="w-12 h-12" style={{ color: '#6B3F1E' }} />
        </div>
        <h2
          style={{ fontFamily: 'var(--font-display)', color: '#2e210e', fontWeight: 700, fontSize: '1.6rem' }}
          className="mb-2"
        >
          Your cart is empty
        </h2>
        <p className="mb-7 text-sm" style={{ color: '#5C2A0A', fontFamily: 'var(--font-body)' }}>
          Add some delicious items to get started!
        </p>
        <Link
          to="/menu"
          className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#2e210e', fontWeight: 700, fontSize: '2rem' }}>
            Your Cart
          </h1>
          <p className="text-sm" style={{ color: '#5C2A0A' }}>
            {cart.length} item{cart.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Cart Items */}
        <div
          className="rounded-2xl overflow-hidden mb-5 shadow-sm"
          style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.08)' }}
        >
          {cart.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4"
              style={{ borderBottom: idx < cart.length - 1 ? '1px solid rgba(107,63,30,0.07)' : 'none' }}
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                {item.image ? (
                  <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(107,63,30,0.08)' }}
                  >
                    <Utensils className="w-6 h-6" style={{ color: '#6B3F1E', opacity: 0.4 }} />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm leading-snug" style={{ color: '#6B3F1E' }}>
                  {item.name}
                </h4>
                {(item.size || item.flavor) && (
                  <p className="text-xs mt-0.5" style={{ color: '#5C2A0A' }}>
                    {[item.size, item.flavor].filter(Boolean).join(' · ')}
                  </p>
                )}
                {item.addons && item.addons.length > 0 && (
                  <p className="text-xs" style={{ color: '#5A9B42' }}>+ {item.addons.join(', ')}</p>
                )}
                <p className="text-xs font-semibold mt-1" style={{ color: '#6B3F1E' }}>
                  P{item.price} each
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Trash button — triggers confirmation */}
                <button
                  onClick={() => handleTrashClick(item.id, item.name)}
                  className="p-1 rounded-full transition-colors hover:bg-red-50"
                  style={{ color: '#e53e3e' }}
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMinusClick(item.id, item.name, item.quantity)}
                    className="w-7 h-7 rounded-full flex items-center justify-center border transition-all"
                    style={{ borderColor: '#3D6B2A', color: '#6B3F1E' }}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold" style={{ color: '#6B3F1E' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ backgroundColor: '#b88917', color: '#fff' }}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-sm font-semibold" style={{ color: '#6B3F1E' }}>
                  P{item.price * item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div
          className="rounded-2xl p-5 mb-5 shadow-sm"
          style={{ backgroundColor: '#fff', border: '1px solid rgba(107,63,30,0.08)' }}
        >
          <h3 className="font-semibold mb-4" style={{ color: '#6B3F1E', fontFamily: 'var(--font-display)' }}>
            Order Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
              <span>Subtotal</span>
              <span>P{cartSubtotal}</span>
            </div>
            <div
              className="flex justify-between font-semibold pt-2 border-t"
              style={{ color: '#6B3F1E', borderColor: '#D4A96A33' }}
            >
              <span>Estimated Total</span>
              <span>P{cartSubtotal}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleCheckout}
          className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] text-base"
          style={{ backgroundColor: '#b88917', color: '#fff', fontFamily: 'var(--font-body)' }}
        >
          Proceed to Checkout <ArrowRight className="w-5 h-5" />
        </button>

        <div className="text-center mt-4">
          <Link to="/menu" className="text-sm" style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>

      {/* Remove confirmation modal */}
      {pendingRemove && (
        <RemoveConfirmModal
          itemName={pendingRemove.name}
          onConfirm={handleConfirmRemove}
          onCancel={() => setPendingRemove(null)}
        />
      )}
    </div>
  );
}