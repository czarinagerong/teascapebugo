import { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  CreditCard, Banknote, ArrowRight, Store, Truck, AlertCircle,
  ChevronLeft, Clock, MapPin, FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { OnlineOrder } from '../context/AppContext';
import { DeliveryMap } from '../components/DeliveryMap';
import { isOrderingOpen, generateTimeSlots } from '../hooks/useStoreStatus';
import { getStoreStatus } from '../lib/api';

const STEPS = ['Cart', 'Checkout', 'Payment', 'Confirmation'];

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartSubtotal, setOrderInfo, addCustomerOrder, setPlacedOrder, clearCart } = useApp();

  const [name, setName]                       = useState('');
  const [phone, setPhone]                     = useState('');
  const [orderType, setOrderType]             = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDistKm, setDeliveryDistKm]   = useState(0);
  const [deliveryFeeAmt, setDeliveryFeeAmt]   = useState(0);
  const [payment, setPayment]                 = useState<'gcash' | 'cash'>('gcash');
  const [pickupTime, setPickupTime]           = useState('');
  const [specialNotes, setSpecialNotes]       = useState('');
  const [errors, setErrors]                   = useState<Record<string, string>>({});

  // Store status from backend (manual open/close by staff)
  const [manuallyOpen, setManuallyOpen]   = useState(true);
  const [closeReason, setCloseReason]     = useState('');

  useEffect(() => {
    getStoreStatus()
    .then(data => {
      setManuallyOpen(data.isOpen);
      setCloseReason(data.closeReason || '');
    })
    .catch(() => {}); // fallback: assume open
  }, []);

  const nameRef  = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const total = cartSubtotal + deliveryFeeAmt;
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  // Store is open if: manually open AND within ordering hours (30 min before open, 30 min before close)
  const orderingOpen = useMemo(() => manuallyOpen && isOrderingOpen(), [manuallyOpen]);

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleLocationChange = (addr: string, dist: number, fee: number) => {
    setDeliveryAddress(addr);
    setDeliveryDistKm(dist);
    setDeliveryFeeAmt(fee);
    clearError('address');
  };

  const handlePickup = () => { 
    setOrderType('pickup'); 
    setDeliveryFeeAmt(0); 
    clearError('address'); 
  };
  
  const handleDelivery = () => { 
    setOrderType('delivery'); 
    setPayment('gcash'); 
    setPickupTime(''); // Clear pickup time if they switch to delivery
    clearError('pickupTime');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) { e.name = 'Full name is required'; }
    else if (name.trim().length < 2) { e.name = 'Please enter your full name'; }
    else if (!/^[a-zA-ZÀ-ÿ\s.'-]+$/.test(name.trim())) { e.name = 'Name must contain letters only'; }
    
    if (!phone.trim()) { e.phone = 'Phone number is required'; }
    else if (!/^(09|\+639)\d{9}$/.test(phone.replace(/\s/g, ''))) { e.phone = 'Enter a valid PH number (e.g. 09XX XXX XXXX)'; }
    
    if (!orderingOpen) {
      e.store = !manuallyOpen
        ? `Store is currently closed${closeReason ? `: ${closeReason}` : ''}. Please check back later.`
        : 'Ordering is not available right now. Store hours: Mon–Sat 7AM–9PM, Sun 1PM–7PM.';
    } else {
      // REQUIRE A TIME SLOT ONLY FOR PICKUP
      if (orderType === 'pickup' && !pickupTime) { 
        e.pickupTime = 'Please select a pickup time'; 
      }
      if (orderType === 'delivery' && !deliveryAddress) { 
        e.address = 'Please set your delivery address on the map above'; 
      }
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      if (e.name && nameRef.current) { nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); nameRef.current.focus(); }
      else if (e.phone && phoneRef.current) { phoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); phoneRef.current.focus(); }
      return;
    }

    const orderId = `TSC-${Date.now().toString().slice(-6)}`;
    const timeStr = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    
    // If delivery, hardcode the scheduled time to our estimated string
    const finalScheduledTime = orderType === 'delivery' ? 'ASAP (30-45 mins)' : pickupTime;

    const orderInfoData = {
      name: name.trim(), phone: phone.trim(), orderType,
      address: orderType === 'delivery' ? deliveryAddress : undefined,
      distance: orderType === 'delivery' ? deliveryDistKm : undefined,
      deliveryFee: deliveryFeeAmt, payment,
      pickupTime: finalScheduledTime, 
      specialNotes: specialNotes.trim() || undefined,
    };

    setOrderInfo(orderInfoData);

    const itemsStr = cart.map(i => `${i.name}${i.flavor ? ` – ${i.flavor}` : ''}${i.size ? ` (${i.size})` : ''} x${i.quantity}`).join(', ');
    const fullAddress = orderType === 'delivery'
      ? [deliveryAddress, specialNotes.trim() ? `Notes: ${specialNotes.trim()}` : ''].filter(Boolean).join(' | ')
      : undefined;

    const adminOrder: OnlineOrder = {
      id: orderId, customer: name.trim(), phone: phone.trim(), items: itemsStr, total,
      payment: payment === 'gcash' ? 'GCash' : 'Cash',
      type: orderType === 'delivery' ? 'Delivery' : 'Pickup', time: timeStr,
      status: payment === 'gcash' ? 'Payment Pending' : 'Payment Confirmed',
      address: fullAddress, 
      pickupTime: finalScheduledTime, 
      isCustomerOrder: true, specialNotes: specialNotes.trim() || undefined,
    };

    if (payment === 'gcash') {
      await addCustomerOrder(adminOrder);
      sessionStorage.setItem('teascape_pending_order_id', orderId);
      navigate('/payment');
    } else {
      await addCustomerOrder(adminOrder);
      setPlacedOrder({ ...orderInfoData, orderId, items: cart, subtotal: cartSubtotal, total, placedAt: new Date() });
      clearCart();
      navigate('/confirmation', { state: { orderId } });
    }
  };

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-3xl mx-auto mb-4">
        <button onClick={() => navigate('/cart')} className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all" style={{ color: '#b88917' }}>
          <ChevronLeft className="w-4 h-4" /> Back to Cart
        </button>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                  style={{ backgroundColor: idx <= 1 ? '#3D2010' : 'rgba(61,32,16,0.12)', color: idx <= 1 ? '#fff' : '#3D2010' }}>
                  {idx + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: idx === 1 ? '#3D2010' : 'rgba(61,32,16,0.4)' }}>{step}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-4" style={{ backgroundColor: idx < 1 ? '#3D2010' : 'rgba(61,32,16,0.15)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Store closed banner */}
      {!orderingOpen && (
        <div className="max-w-3xl mx-auto mb-6 rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#e53e3e' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#e53e3e' }}>
              {!manuallyOpen ? 'Store is currently closed' : 'Ordering not available right now'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#5C2A0A' }}>
              {!manuallyOpen
                ? closeReason || 'We are temporarily closed. Please check back later.'
                : 'Ordering opens 30 minutes before store hours. Mon–Sat 7AM–9PM, Sun 1PM–7PM.'}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#3D2010', fontWeight: 700, fontSize: '2rem' }}>Checkout</h1>

          {/* Contact */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>Contact Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#3D2010' }}>Full Name *</label>
                <input ref={nameRef} type="text" value={name} onChange={e => { setName(e.target.value); clearError('name'); }} placeholder="Juan dela Cruz"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: errors.name ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: errors.name ? '#fff5f5' : '#FAFAFA', color: '#3D2010' }} />
                {errors.name && <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#e53e3e' }}><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#3D2010' }}>Phone Number *</label>
                <input ref={phoneRef} type="tel" value={phone} onChange={e => { setPhone(e.target.value); clearError('phone'); }} placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: errors.phone ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: errors.phone ? '#fff5f5' : '#FAFAFA', color: '#3D2010' }} />
                {errors.phone && <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#e53e3e' }}><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>Order Type</h3>
            <div className="flex gap-3 mb-4">
              <button onClick={handlePickup} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ backgroundColor: orderType === 'pickup' ? '#3D2010' : 'transparent', color: orderType === 'pickup' ? '#fff' : '#3D2010', borderColor: orderType === 'pickup' ? '#3D2010' : 'rgba(61,32,16,0.2)' }}>
                <Store className="w-4 h-4" /> Pickup
              </button>
              <button onClick={handleDelivery} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ backgroundColor: orderType === 'delivery' ? '#3D2010' : 'transparent', color: orderType === 'delivery' ? '#fff' : '#3D2010', borderColor: orderType === 'delivery' ? '#3D2010' : 'rgba(61,32,16,0.2)' }}>
                <Truck className="w-4 h-4" /> Delivery
              </button>
            </div>

            {/* Pickup */}
            {orderType === 'pickup' && (
              <div className="space-y-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: '#FAF5EE', border: '1px solid rgba(61,32,16,0.1)' }}>
                  <p className="text-xs" style={{ color: '#3D2010' }}>Pick up your order at <strong>Bugo Highway, Beside Diesto Clinic, CDO</strong>.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1" style={{ color: '#3D2010' }}>Pickup Time *</label>
                  <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#9C7A5A' }}>
                    <Clock className="w-3 h-3" /> At least 30 minutes preparation time.
                  </p>
                  {!orderingOpen ? (
                    <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#e53e3e' }} />
                      <p className="text-xs" style={{ color: '#e53e3e' }}>
                        {!manuallyOpen ? 'Store is currently closed.' : 'Ordering is not available at this time.'}
                      </p>
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
                      <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#e53e3e' }} />
                      <p className="text-xs" style={{ color: '#e53e3e' }}>No available pickup slots. We are closing soon.</p>
                    </div>
                  ) : (
                    <>
                      <select value={pickupTime} onChange={e => { setPickupTime(e.target.value); clearError('pickupTime'); }}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                        style={{ borderColor: errors.pickupTime ? '#e53e3e' : 'rgba(61,32,16,0.2)', backgroundColor: errors.pickupTime ? '#fff5f5' : '#FAFAFA', color: '#3D2010' }}>
                        <option value="">Select pickup time...</option>
                        {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                      {errors.pickupTime && <p className="flex items-center gap-1 text-xs mt-1.5" style={{ color: '#e53e3e' }}><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.pickupTime}</p>}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Delivery */}
            {orderType === 'delivery' && (
              <div className="space-y-4">
                {!orderingOpen && (
                  <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#e53e3e' }} />
                    <p className="text-xs" style={{ color: '#e53e3e' }}>
                      {!manuallyOpen ? 'Store is closed.' : 'Delivery not available right now. Mon–Sat 7AM–9PM, Sun 1PM–7PM.'}
                    </p>
                  </div>
                )}
                
                {/* --- DELIVERY ESTIMATE --- */}
                {orderingOpen && (
                  <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7F4', border: '1px solid #C6E0D4' }}>
                    <Clock className="w-5 h-5 shrink-0" style={{ color: '#2C7A53' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#2C7A53' }}>Estimated Delivery Time: 30-45 mins</p>
                      <p className="text-xs mt-0.5" style={{ color: '#3E8C66' }}>Our rider will head your way as soon as your order is prepared!</p>
                    </div>
                  </div>
                )}

                {errors.address && <p className="flex items-center gap-1 text-xs" style={{ color: '#e53e3e' }}><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.address}</p>}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" style={{ color: '#3D2010' }} />
                    <p className="text-sm font-semibold" style={{ color: '#3D2010' }}>Delivery Address</p>
                  </div>
                  <DeliveryMap onLocationChange={handleLocationChange} hasError={!!errors.address} errorMsg={errors.address} />
                  {deliveryAddress && (
                    <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#FAF5EE', border: '1px solid rgba(61,32,16,0.1)' }}>
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#b88917' }} />
                      <p className="text-xs" style={{ color: '#3D2010' }}>{deliveryAddress}</p>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4" style={{ color: '#3D2010' }} />
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3D2010' }}>Specific Details</label>
                    <span className="text-xs" style={{ color: '#9C7A5A' }}>(optional)</span>
                  </div>
                  <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)}
                    placeholder="Unit number, floor, landmark, gate code, color of house, or any notes for the rider..."
                    rows={3} className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all"
                    style={{ borderColor: 'rgba(61,32,16,0.2)', backgroundColor: '#FAFAFA', color: '#3D2010' }} />
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: '#FAFAFA', border: '1px solid rgba(61,32,16,0.1)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#3D2010' }}>Delivery Fee Schedule</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>Within 5 km: Flat P40</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>Beyond 5 km: P40 + P10 per km</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>Payment Method</h3>
            {orderType === 'delivery' && (
              <div className="mb-3 rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: '#EBF3FF', border: '1px solid rgba(0,122,255,0.2)' }}>
                <Truck className="w-4 h-4 shrink-0" style={{ color: '#007AFF' }} />
                <p className="text-xs" style={{ color: '#007AFF' }}>Delivery orders require GCash payment only.</p>
              </div>
            )}
            <div className="space-y-3">
              <label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: payment === 'gcash' ? '#007AFF' : 'rgba(61,32,16,0.15)', backgroundColor: payment === 'gcash' ? '#EBF3FF' : 'transparent' }}>
                <input type="radio" name="payment" value="gcash" checked={payment === 'gcash'} onChange={() => setPayment('gcash')} className="hidden" />
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#007AFF' }}>
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: '#007AFF' }}>GCash</p>
                  <p className="text-xs" style={{ color: '#5C2A0A' }}>Scan QR code and upload receipt</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: payment === 'gcash' ? '#007AFF' : '#D4A96A' }}>
                  {payment === 'gcash' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#007AFF' }} />}
                </div>
              </label>
              {orderType === 'pickup' && (
                <label className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                  style={{ borderColor: payment === 'cash' ? '#3D2010' : 'rgba(61,32,16,0.15)', backgroundColor: payment === 'cash' ? 'rgba(61,32,16,0.05)' : 'transparent' }}>
                  <input type="radio" name="payment" value="cash" checked={payment === 'cash'} onChange={() => setPayment('cash')} className="hidden" />
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#3D2010' }}>
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: '#3D2010' }}>Cash on Pickup</p>
                    <p className="text-xs" style={{ color: '#5C2A0A' }}>Pay at the counter upon pickup</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: payment === 'cash' ? '#3D2010' : 'rgba(61,32,16,0.3)' }}>
                    {payment === 'cash' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3D2010' }} />}
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-5 shadow-sm lg:sticky lg:top-24" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs gap-2">
                  <span className="flex-1 min-w-0" style={{ color: '#5C2A0A' }}>
                    {item.name}{item.size && ` (${item.size})`}{item.flavor && ` – ${item.flavor}`} x{item.quantity}
                  </span>
                  <span className="font-semibold shrink-0" style={{ color: '#3D2010' }}>P{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* SHOW SCHEDULED TIME IN SUMMARY FOR BOTH DELIVERY AND PICKUP */}
            {(pickupTime || orderType === 'delivery') && (
              <div className="mb-3 px-3 py-2 rounded-xl flex items-center gap-2" style={{ backgroundColor: '#FAF5EE', border: '1px solid rgba(61,32,16,0.1)' }}>
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: '#b88917' }} />
                <span className="text-xs font-semibold" style={{ color: '#3D2010' }}>
                  {orderType === 'delivery' ? 'Estimated Delivery: 30-45 mins' : `Pickup at ${pickupTime}`}
                </span>
              </div>
            )}

            <div className="space-y-2 pt-3 border-t text-sm" style={{ borderColor: 'rgba(61,32,16,0.1)' }}>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}><span>Subtotal</span><span>P{cartSubtotal}</span></div>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Delivery Fee</span>
                <span>{orderType === 'delivery' ? deliveryFeeAmt > 0 ? `P${deliveryFeeAmt}` : 'Set address on map' : 'P0'}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t" style={{ color: '#3D2010', borderColor: 'rgba(61,32,16,0.1)', fontSize: '1rem' }}>
                <span>Total</span>
                <span>{orderType === 'delivery' && deliveryFeeAmt === 0 ? `P${cartSubtotal} + fee` : `P${total}`}</span>
              </div>
            </div>
            <button onClick={handleSubmit}
              className="w-full mt-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#b88917', color: '#fff' }}>
              {payment === 'gcash' ? 'Proceed to Payment' : 'Place Order'} <ArrowRight className="w-4 h-4" />
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