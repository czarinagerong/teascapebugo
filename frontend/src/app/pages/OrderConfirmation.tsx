import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { CheckCircle, Home, Copy, Search, Save, Clock, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

export default function OrderConfirmation() {
  const { placedOrder, setPlacedOrder, clearCart, cart, cartSubtotal, orderInfo } = useApp();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  // ── FIX 5: STABLE EFFECT LOGIC ──────────────────────────────────────────
  useEffect(() => {
    if (!placedOrder && orderInfo) {
      const orderId = location.state?.orderId || `TSC-${Date.now().toString().slice(-6)}`;
      setPlacedOrder({
        ...orderInfo,
        orderId,
        items: cart,
        subtotal: cartSubtotal,
        total: cartSubtotal + (orderInfo.deliveryFee || 0),
        placedAt: new Date(),
      });
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedOrder]); // only re-run if placedOrder changes
  // ────────────────────────────────────────────────────────────────────────

  const order = placedOrder;
  const now = order?.placedAt || new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const orderId = order?.orderId || location.state?.orderId || 'TSC-XXXXXX';
  const isCOD = order?.payment === 'cash';

  const displayItems = order?.items && order.items.length > 0 ? order.items : [];
  const displaySubtotal = order?.subtotal || 0;
  const displayDelivery = order?.deliveryFee || 0;
  const displayTotal = order?.total || displaySubtotal + displayDelivery;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-lg mx-auto">

        {/* Success Header */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'rgba(61,32,16,0.1)' }}
          >
            <CheckCircle className="w-12 h-12" style={{ color: '#3D2010' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#3D2010', fontSize: '2rem', fontWeight: 700 }}>
            Order Confirmed!
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#5C2A0A' }}>
            Thank you, <strong>{order?.name || 'Customer'}</strong>! Your order has been received.
          </p>
        </div>

        {/* Order Code Card */}
        <div
          className="rounded-2xl p-6 mb-5 text-center shadow-sm"
          style={{ backgroundColor: '#FAF5EE', border: '2px solid rgba(184,137,23,0.3)' }}
        >
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: '#9C7A5A' }}>
            Your Order Code
          </p>
          <p
            className="text-3xl font-bold tracking-widest mb-3"
            style={{ fontFamily: 'var(--font-display)', color: '#3D2010' }}
          >
            {orderId}
          </p>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-80 mb-3"
            style={{ backgroundColor: copied ? '#556419' : '#b88917', color: '#fff' }}
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <div className="flex items-center justify-center gap-1.5">
            <Save className="w-3.5 h-3.5" style={{ color: '#9C7A5A' }} />
            <p className="text-xs" style={{ color: '#5C2A0A' }}>
              Save this code to track your order status anytime.
            </p>
          </div>
        </div>

        {/* Payment status notice */}
        {isCOD ? (
          <div
            className="rounded-xl p-4 mb-5 flex items-start gap-3"
            style={{ backgroundColor: 'rgba(61,32,16,0.05)', border: '1px solid rgba(61,32,16,0.12)' }}
          >
            <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#3D2010' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#3D2010' }}>
              This is a <strong>Cash on Pickup</strong> order. Your order will be prepared before your selected pickup time of{' '}
              <strong>{order?.pickupTime || 'your chosen time'}</strong>. Please arrive on time and pay at the counter.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 mb-5 flex items-start gap-3"
            style={{ backgroundColor: '#EBF3FF', border: '1px solid rgba(0,122,255,0.2)' }}
          >
            <ClipboardList className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0055CC' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#0055CC' }}>
              Your GCash receipt has been submitted. Our team will <strong>manually verify</strong> your payment and update your order status. Use your order code to check for updates.
            </p>
          </div>
        )}

        {/* Track Order CTA */}
        <Link
          to="/track"
          className="w-full mb-5 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: '#b88917', color: '#fff', display: 'flex' }}
        >
          <Search className="w-4 h-4" /> Track My Order
        </Link>

        {/* Digital Receipt */}
        <div id="receipt" className="rounded-2xl overflow-hidden shadow-sm mb-5" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.08)' }}>
          <div className="py-4 px-5 text-center" style={{ backgroundColor: '#3D2010' }}>
            <p className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Teascape Bugo</p>
            <p className="text-white/70 text-xs">Bugo Highway, CDO · 09053957046</p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-4 border-b" style={{ borderColor: '#D4A96A33' }}>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Customer</p>
                <p style={{ color: '#3D2010' }}>{order?.name || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Phone</p>
                <p style={{ color: '#3D2010' }}>{order?.phone || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Date & Time</p>
                <p style={{ color: '#3D2010' }}>{dateStr}, {timeStr}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Order Type</p>
                <p className="capitalize" style={{ color: '#3D2010' }}>{order?.orderType || '—'}</p>
              </div>
              {order?.pickupTime && (
                <div className="col-span-2">
                  <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Pickup Time</p>
                  <p style={{ color: '#3D2010' }}>{order.pickupTime}</p>
                </div>
              )}
              {order?.address && (
                <div className="col-span-2">
                  <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Delivery Address</p>
                  <p style={{ color: '#3D2010' }}>{order.address}</p>
                </div>
              )}
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Payment</p>
                <p className="uppercase" style={{ color: '#3D2010' }}>{order?.payment || '—'}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Order Code</p>
                <p className="font-bold" style={{ color: '#3D2010' }}>{orderId}</p>
              </div>
            </div>

            {displayItems.length > 0 && (
              <div className="space-y-2 mb-4 pb-4 border-b" style={{ borderColor: '#D4A96A33' }}>
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs gap-2">
                    <div className="flex-1">
                      <p style={{ color: '#3D2010' }} className="font-medium">
                        {item.name}{(item as any).size ? ` (${(item as any).size})` : ''}
                      </p>
                      {(item as any).flavor && (
                        <p style={{ color: '#5C2A0A' }}>{(item as any).flavor}</p>
                      )}
                    </div>
                    <p className="text-right whitespace-nowrap" style={{ color: '#3D2010' }}>
                      x{item.quantity} = ₱{item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Subtotal</span><span>₱{displaySubtotal}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Delivery Fee</span><span>₱{displayDelivery}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1.5 border-t" style={{ color: '#3D2010', borderColor: 'rgba(61,32,16,0.2)' }}>
                <span>Total</span><span>₱{displayTotal}</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: '#C8920A', color: '#fff' }}
        >
          <Home className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  );
}