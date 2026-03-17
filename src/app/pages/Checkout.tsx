import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Banknote, ArrowRight, Store, Truck, AlertCircle, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OnlineOrder } from '../context/AppContext';
import { DeliveryMap } from '../components/DeliveryMap';

const STEPS = ['Cart', 'Checkout', 'Payment', 'Confirmation'];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartSubtotal, setOrderInfo, addCustomerOrder } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDistKm, setDeliveryDistKm] = useState(0);
  const [deliveryFeeAmt, setDeliveryFeeAmt] = useState(0);
  const [payment, setPayment] = useState<'gcash' | 'cash'>('gcash');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const total = cartSubtotal + deliveryFeeAmt;

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleLocationChange = (addr: string, dist: number, fee: number) => {
    setDeliveryAddress(addr);
    setDeliveryDistKm(dist);
    setDeliveryFeeAmt(fee);
    clearError('address');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required';
    else if (name.trim().length < 2) e.name = 'Please enter your full name';

    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(09|\+639)\d{9}$/.test(phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid PH number (e.g. 09XX XXX XXXX)';

    if (orderType === 'delivery' && !deliveryAddress)
      e.address = 'Please select your delivery address on the map above';

    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      if (e.name && nameRef.current) { nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); nameRef.current.focus(); }
      else if (e.phone && phoneRef.current) { phoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); phoneRef.current.focus(); }
      return;
    }

    setOrderInfo({
      name: name.trim(),
      phone: phone.trim(),
      orderType,
      address: orderType === 'delivery' ? deliveryAddress : undefined,
      distance: orderType === 'delivery' ? deliveryDistKm : undefined,
      deliveryFee: deliveryFeeAmt,
      payment,
    });

    const itemsStr = cart
      .map(i => `${i.name}${i.flavor ? ` – ${i.flavor}` : ''}${i.size ? ` (${i.size})` : ''} x${i.quantity}`)
      .join(', ');
    const timeStr = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const adminOrder: OnlineOrder = {
      id: `TSC-${Date.now().toString().slice(-5)}`,
      customer: name.trim(),
      phone: phone.trim(),
      items: itemsStr,
      total,
      payment: payment === 'gcash' ? 'GCash' : 'Cash',
      type: orderType === 'delivery' ? 'Delivery' : 'Pickup',
      time: timeStr,
      status: 'Pending',
      address: orderType === 'delivery' ? deliveryAddress : undefined,
      isCustomerOrder: true,
    };
    addCustomerOrder(adminOrder);

    if (payment === 'gcash') {
      navigate('/payment');
    } else {
      navigate('/confirmation', { state: { orderId: adminOrder.id } });
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Back */}
      <div className="max-w-3xl mx-auto mb-4">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all"
          style={{ color: '#b88917', fontFamily: 'var(--font-body)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Cart
        </button>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                  style={{ backgroundColor: idx <= 1 ? '#3D2010' : 'rgba(61,32,16,0.12)', color: idx <= 1 ? '#fff' : '#3D2010' }}
                >
                  {idx + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: idx === 1 ? '#3D2010' : 'rgba(61,32,16,0.4)' }}>
                  {step}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-4" style={{ backgroundColor: idx < 1 ? '#3D2010' : 'rgba(61,32,16,0.15)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#3D2010', fontWeight: 700, fontSize: '2rem' }}>
            Checkout
          </h1>

          {/* Contact */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>
              Contact Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#3D2010' }}>
                  Full Name *
                </label>
                <input
                  id="checkout-name" ref={nameRef} type="text" value={name}
                  onChange={e => { setName(e.target.value); clearError('name'); }}
                  placeholder="Juan dela Cruz"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: errors.name ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: errors.name ? '#fff5f5' : '#FAFAFA', color: '#3D2010' }}
                />
                {errors.name && (
                  <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#e53e3e' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#3D2010' }}>
                  Phone Number *
                </label>
                <input
                  id="checkout-phone" ref={phoneRef} type="tel" value={phone}
                  onChange={e => { setPhone(e.target.value); clearError('phone'); }}
                  placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: errors.phone ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: errors.phone ? '#fff5f5' : '#FAFAFA', color: '#3D2010' }}
                />
                {errors.phone && (
                  <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#e53e3e' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>
              Order Type
            </h3>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => { setOrderType('pickup'); setDeliveryFeeAmt(0); clearError('address'); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  backgroundColor: orderType === 'pickup' ? '#3D2010' : 'transparent',
                  color: orderType === 'pickup' ? '#fff' : '#3D2010',
                  borderColor: orderType === 'pickup' ? '#3D2010' : 'rgba(61,32,16,0.2)',
                }}
              >
                <Store className="w-4 h-4" /> Pickup
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{
                  backgroundColor: orderType === 'delivery' ? '#3D2010' : 'transparent',
                  color: orderType === 'delivery' ? '#fff' : '#3D2010',
                  borderColor: orderType === 'delivery' ? '#3D2010' : 'rgba(61,32,16,0.2)',
                }}
              >
                <Truck className="w-4 h-4" /> Delivery
              </button>
            </div>

            {/* Pickup note */}
            {orderType === 'pickup' && (
              <div className="rounded-xl p-3" style={{ backgroundColor: '#FAF5EE', border: '1px solid rgba(61,32,16,0.1)' }}>
                <p className="text-xs" style={{ color: '#3D2010' }}>
                  Pick up your order at <strong>Bugo Highway, Beside Diesto Clinic, CDO</strong>. We'll notify you when it's ready!
                </p>
              </div>
            )}

            {/* Delivery map */}
            {orderType === 'delivery' && (
              <div className="space-y-3">
                <p className="text-xs" style={{ color: '#3D2010' }}>
                  Search your address below — predictions are powered by OpenStreetMap. Drag the pin to set your exact location.
                </p>
                <DeliveryMap
                  onLocationChange={handleLocationChange}
                  hasError={!!errors.address}
                  errorMsg={errors.address}
                />
                {/* Fee info */}
                <div className="rounded-xl p-3" style={{ backgroundColor: '#FAFAFA', border: '1px solid rgba(61,32,16,0.1)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#3D2010' }}>Delivery Fee Schedule</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>Within 5 km: Flat ₱40</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>Beyond 5 km: ₱40 + ₱10 per km</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>
              Payment Method
            </h3>
            <div className="space-y-3">
              {/* GCash */}
              <label
                className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: payment === 'gcash' ? '#007AFF' : 'rgba(61,32,16,0.15)', backgroundColor: payment === 'gcash' ? '#EBF3FF' : 'transparent' }}
              >
                <input type="radio" name="payment" value="gcash" checked={payment === 'gcash'} onChange={() => setPayment('gcash')} className="hidden" />
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#007AFF' }}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: '#007AFF' }}>GCash</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>You will be redirected to GCash to complete payment</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: payment === 'gcash' ? '#007AFF' : '#D4A96A' }}>
                  {payment === 'gcash' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#007AFF' }} />}
                </div>
              </label>

              {/* Cash */}
              <label
                className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: payment === 'cash' ? '#3D2010' : 'rgba(61,32,16,0.15)', backgroundColor: payment === 'cash' ? 'rgba(61,32,16,0.05)' : 'transparent' }}
              >
                <input type="radio" name="payment" value="cash" checked={payment === 'cash'} onChange={() => setPayment('cash')} className="hidden" />
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#3D2010' }}>
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: '#3D2010' }}>Cash</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>
                    {orderType === 'pickup' ? 'Pay at the counter upon pickup' : 'Pay the rider upon delivery'}
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: payment === 'cash' ? '#3D2010' : 'rgba(61,32,16,0.3)' }}>
                  {payment === 'cash' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3D2010' }} />}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-5 shadow-sm lg:sticky lg:top-24" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>
              Order Summary
            </h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs gap-2">
                  <span className="flex-1 min-w-0" style={{ color: '#5C2A0A' }}>
                    {item.name}{item.size && ` (${item.size})`}{item.flavor && ` – ${item.flavor}`} ×{item.quantity}
                  </span>
                  <span className="font-semibold shrink-0" style={{ color: '#3D2010' }}>₱{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-3 border-t text-sm" style={{ borderColor: 'rgba(61,32,16,0.1)' }}>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Subtotal</span><span>₱{cartSubtotal}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Delivery Fee</span>
                <span>
                  {orderType === 'delivery'
                    ? deliveryFeeAmt > 0 ? `₱${deliveryFeeAmt}` : 'Set address on map'
                    : '₱0'}
                </span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t" style={{ color: '#3D2010', borderColor: 'rgba(61,32,16,0.1)', fontSize: '1rem' }}>
                <span>Total</span>
                <span>₱{orderType === 'delivery' && deliveryFeeAmt === 0 ? `${cartSubtotal}+fee` : total}</span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#b88917', color: '#fff' }}
            >
              Place Order <ArrowRight className="w-4 h-4" />
            </button>

            {Object.keys(errors).length > 0 && (
              <div className="mt-3 p-3 rounded-xl flex items-start gap-2" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#e53e3e' }} />
                <p className="text-xs" style={{ color: '#e53e3e' }}>Please fix the errors above before placing your order.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
