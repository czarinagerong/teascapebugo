import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle, Printer, Home, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

const STATUS_STEPS = ['Order Placed', 'Preparing', 'Rider Assigned', 'On the Way', 'Delivered'];
const PICKUP_STATUS_STEPS = ['Order Placed', 'Preparing', 'Ready for Pickup', 'Picked Up'];

export default function OrderConfirmation() {
  const { placedOrder, setPlacedOrder, clearCart, cart, cartSubtotal, orderInfo, setOrderInfo } = useApp();
  const [activeStatus, setActiveStatus] = useState(0);
  const navigate = useNavigate();

  // If no placedOrder but we have orderInfo (cash order from checkout directly)
  useEffect(() => {
    if (!placedOrder && orderInfo) {
      const orderId = `TSC-${Date.now().toString().slice(-6)}`;
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
  }, []);

  // Simulate status progression
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStatus(prev => {
        const max = (placedOrder?.orderType === 'delivery' ? STATUS_STEPS : PICKUP_STATUS_STEPS).length - 1;
        return prev < max ? prev + 1 : prev;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [placedOrder]);

  const order = placedOrder;
  const now = order?.placedAt || new Date();
  const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const steps = order?.orderType === 'delivery' ? STATUS_STEPS : PICKUP_STATUS_STEPS;

  // Sample items if no real order
  const displayItems = order?.items && order.items.length > 0
    ? order.items
    : [
        { id: '1', name: 'Cheesecake Series Milk Tea', category: 'Milk Tea', size: 'L', flavor: 'Matcha', price: 135, quantity: 1 },
        { id: '2', name: 'Korean Ramen', category: 'Ramen', price: 130, quantity: 1 },
      ];
  const displaySubtotal = order?.subtotal || displayItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const displayDelivery = order?.deliveryFee || (order?.orderType === 'delivery' ? 40 : 0);
  const displayTotal = order?.total || displaySubtotal + displayDelivery;

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
            Thank you, <strong>{order?.name || 'Customer'}</strong>! Your order has been confirmed.
          </p>
          <div className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#C8920A', color: '#fff' }}>
            Order ID: {order?.orderId || 'TSC-XXXXXX'}
          </div>
        </div>

        {/* Digital Receipt */}
        <div id="receipt" className="rounded-2xl overflow-hidden shadow-sm mb-5" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.08)' }}>
          {/* Receipt Header */}
          <div className="py-4 px-5 text-center" style={{ backgroundColor: '#3D2010' }}>
            <p className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Teascape Bugo</p>
            <p className="text-white/70 text-xs">Bugo Highway, CDO · 092385589</p>
          </div>

          <div className="p-5">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-4 border-b" style={{ borderColor: '#D4A96A33' }}>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Customer</p>
                <p style={{ color: '#3D2010' }}>{order?.name || 'Juan dela Cruz'}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Phone</p>
                <p style={{ color: '#3D2010' }}>{order?.phone || '09XX XXX XXXX'}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Date &amp; Time</p>
                <p style={{ color: '#3D2010' }}>{dateStr}, {timeStr}</p>
              </div>
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Order Type</p>
                <p className="capitalize" style={{ color: '#3D2010' }}>{order?.orderType || 'Delivery'}</p>
              </div>
              {order?.address && (
                <div className="col-span-2">
                  <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Delivery Address</p>
                  <p style={{ color: '#3D2010' }}>{order.address}</p>
                </div>
              )}
              <div>
                <p style={{ color: '#C8920A' }} className="font-semibold mb-0.5">Payment</p>
                <p className="uppercase" style={{ color: '#3D2010' }}>{order?.payment || 'GCash'}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4 pb-4 border-b" style={{ borderColor: '#D4A96A33' }}>
              {displayItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs gap-2">
                  <div className="flex-1">
                    <p style={{ color: '#3D2010' }} className="font-medium">
                      {item.name}
                      {(item as any).size ? ` (${(item as any).size})` : ''}
                    </p>
                    {(item as any).flavor && (
                      <p style={{ color: '#5C2A0A' }}>{(item as any).flavor}</p>
                    )}
                    {(item as any).addons && (item as any).addons.length > 0 && (
                      <p style={{ color: '#C8920A' }}>+ {(item as any).addons.join(', ')}</p>
                    )}
                  </div>
                  <p className="text-right whitespace-nowrap" style={{ color: '#3D2010' }}>
                    x{item.quantity} = P{item.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm mb-1">
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Subtotal</span><span>P{displaySubtotal}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Delivery Fee</span><span>P{displayDelivery}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1.5 border-t" style={{ color: '#3D2010', borderColor: 'rgba(61,32,16,0.2)' }}>
                <span>Total</span><span>P{displayTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="rounded-2xl p-5 shadow-sm mb-5" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.08)' }}>
          <h3 className="font-semibold mb-5" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>Order Status</h3>
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5" style={{ backgroundColor: 'rgba(61,32,16,0.15)' }} />
            <div className="space-y-5">
              {steps.map((step, idx) => {
                const done = idx < activeStatus;
                const current = idx === activeStatus;
                return (
                  <div key={step} className="flex items-center gap-4 relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all"
                      style={{
                        backgroundColor: done || current ? '#3D2010' : 'rgba(61,32,16,0.15)',
                        border: current ? '3px solid #C8920A' : 'none',
                      }}
                    >
                      {done ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: current ? '#fff' : '#C8920A' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: done || current ? '#3D2010' : 'rgba(61,32,16,0.3)' }}>
                        {step}
                      </p>
                      {current && (
                        <p className="text-xs" style={{ color: '#C8920A' }}>In progress...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SMS Notice */}
        <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{ backgroundColor: 'rgba(61,32,16,0.05)', border: '1px solid rgba(61,32,16,0.12)' }}>
          <MessageSquare className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#3D2010' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#3D2010' }}>
            An SMS confirmation has been sent to <strong>{order?.phone || '09XX XXX XXXX'}</strong>.
            You will receive updates as your order is prepared and dispatched.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all hover:opacity-80"
            style={{ borderColor: '#3D2010', color: '#3D2010' }}
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <Link
            to="/"
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: '#C8920A', color: '#fff' }}
          >
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}