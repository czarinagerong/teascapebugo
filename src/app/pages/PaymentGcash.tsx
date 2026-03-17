import { useNavigate } from 'react-router';
import { Shield, X, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';

const STEPS = ['Cart', 'Checkout', 'Payment', 'Confirmation'];

export default function PaymentGcash() {
  const navigate = useNavigate();
  const { cartSubtotal, orderInfo, cart, setPlacedOrder, clearCart } = useApp();

  const deliveryFee = orderInfo?.deliveryFee || 0;
  const total = cartSubtotal + deliveryFee;

  const handlePay = () => {
    const orderId = `TSC-${Date.now().toString().slice(-6)}`;
    if (orderInfo) {
      setPlacedOrder({
        ...orderInfo,
        orderId,
        items: cart,
        subtotal: cartSubtotal,
        total,
        placedAt: new Date(),
      });
    }
    clearCart();
    navigate('/confirmation', { state: { orderId } });
  };

  const handleCancel = () => {
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{
                    backgroundColor: idx <= 2 ? '#3D2010' : 'rgba(61,32,16,0.2)',
                    color: idx <= 2 ? '#fff' : '#3D2010',
                  }}
                >
                  {idx + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: idx === 2 ? '#3D2010' : 'rgba(61,32,16,0.4)' }}>{step}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-4" style={{ backgroundColor: idx < 2 ? '#3D2010' : 'rgba(61,32,16,0.2)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Card */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: '#fff' }}>
        {/* GCash Header */}
        <div className="py-6 px-6 text-center" style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)' }}>
          <div className="w-14 h-14 rounded-2xl bg-white mx-auto flex items-center justify-center mb-3">
            <span className="font-bold text-lg" style={{ color: '#007AFF' }}>G</span>
          </div>
          <h2 className="text-white text-lg font-semibold">Complete Your Payment</h2>
          <p className="text-white/70 text-sm mt-1">GCash Mobile Payment</p>
        </div>

        <div className="p-6">
          {/* Amount */}
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#5C2A0A' }}>Amount Due</p>
            <p style={{ fontFamily: 'var(--font-display)', color: '#007AFF', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>
              ₱{total}
            </p>
          </div>

          {/* Order Details */}
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#F8F9FA' }}>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#5C2A0A' }}>Customer</span>
                <span className="font-semibold" style={{ color: '#3D2010' }}>{orderInfo?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#5C2A0A' }}>Order Type</span>
                <span className="font-semibold capitalize" style={{ color: '#3D2010' }}>{orderInfo?.orderType || 'Pickup'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#5C2A0A' }}>Subtotal</span>
                <span style={{ color: '#5C2A0A' }}>P{cartSubtotal}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: '#5C2A0A' }}>Delivery Fee</span>
                  <span style={{ color: '#5C2A0A' }}>P{deliveryFee}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1.5 border-t" style={{ borderColor: '#eee', color: '#3D2010' }}>
                <span>Total</span>
                <span>P{total}</span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            className="w-full py-3.5 rounded-xl font-semibold text-white mb-3 flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ backgroundColor: '#007AFF' }}
          >
            <CreditCard className="w-5 h-5" />
            Pay with GCash
          </button>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="w-full py-2 text-sm transition-colors flex items-center justify-center gap-1.5"
            style={{ color: '#e53e3e' }}
          >
            <X className="w-4 h-4" /> Cancel Order
          </button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: '#eee' }}>
            <Shield className="w-4 h-4" style={{ color: '#5C2A0A' }} />
            <p className="text-xs" style={{ color: '#5C2A0A' }}>Secured by PayMongo · 256-bit SSL</p>
          </div>
        </div>
      </div>
    </div>
  );
}