import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Shield, X, Upload, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadReceipt, attachReceipt } from '../lib/api';
import qrCodeImg from '@/assets/qrcode.png';

const STEPS = ['Cart', 'Checkout', 'Payment', 'Confirmation'];
const GCASH_NUMBER = '0905 395 7046';
const GCASH_NAME = 'Teascape Bugo';

export default function PaymentGcash() {
  const navigate = useNavigate();
  const { cartSubtotal, orderInfo, cart, setPlacedOrder, clearCart, attachReceiptToOrder } = useApp();

  const deliveryFee = orderInfo?.deliveryFee || 0;
  const total = cartSubtotal + deliveryFee;

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setError('Please upload a JPG or PNG image only.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('File size must be under 5MB.'); return; }
    setError('');
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaid = async () => {
    if (!receiptFile) { setError('Please upload your GCash receipt before confirming.'); return; }
    if (!orderInfo) { setError('Order info missing. Please go back to checkout.'); return; }

    setSubmitting(true);
    try {
      const savedOrderId = sessionStorage.getItem('teascape_pending_order_id');
      const orderId = savedOrderId || `TSC-${Date.now().toString().slice(-6)}`;

      let receiptUrl: string | undefined;
      if (receiptPreview && receiptFile) {
        try {
          receiptUrl = await uploadReceipt(receiptPreview, orderId, receiptFile.type);
          await attachReceipt(orderId, receiptUrl);
          if (attachReceiptToOrder) await attachReceiptToOrder(orderId, receiptUrl);
        } catch (err) {
          console.warn('[Teascape] Receipt upload failed:', err);
        }
      }

      sessionStorage.removeItem('teascape_pending_order_id');

      // ── FIX 4: SNAPSHOT CART BEFORE CLEARING ────────────────────────────────
      const cartSnapshot = [...cart];
      const subtotalSnapshot = cartSubtotal;

      setPlacedOrder({
        ...orderInfo, 
        orderId, 
        items: cartSnapshot, // Use snapshot
        subtotal: subtotalSnapshot, 
        total, 
        placedAt: new Date(),
        receiptImage: receiptUrl || receiptPreview || undefined,
      });

      clearCart();
      // ────────────────────────────────────────────────────────────────────────

      navigate('/confirmation', { state: { orderId } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 flex flex-col items-center" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ backgroundColor: idx <= 2 ? '#3D2010' : 'rgba(61,32,16,0.2)', color: idx <= 2 ? '#fff' : '#3D2010' }}>
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

      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: '#fff' }}>
        {/* Header */}
        <div className="py-6 px-6 text-center" style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0055CC 100%)' }}>
          <div className="w-14 h-14 rounded-2xl bg-white mx-auto flex items-center justify-center mb-3">
            <span className="font-bold text-2xl" style={{ color: '#007AFF' }}>G</span>
          </div>
          <h2 className="text-white text-lg font-semibold">Pay via GCash</h2>
          <p className="text-white/70 text-sm mt-1">Scan the QR code below to pay</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#5C2A0A' }}>Amount Due</p>
            <p style={{ fontFamily: 'var(--font-display)', color: '#007AFF', fontSize: '2.5rem', fontWeight: 700, lineHeight: 1 }}>₱{total}</p>
          </div>

          {/* Real QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-52 h-52 rounded-2xl overflow-hidden border-2 p-2" style={{ borderColor: '#007AFF', backgroundColor: '#F0F7FF' }}>
              <img src={qrCodeImg} alt="GCash QR Code" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: '#5C2A0A' }}>Or send to GCash number</p>
              <p className="font-bold text-lg tracking-widest" style={{ color: '#007AFF' }}>{GCASH_NUMBER}</p>
              <p className="text-xs font-semibold" style={{ color: '#3D2010' }}>{GCASH_NAME}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="rounded-xl p-3" style={{ backgroundColor: '#F8F9FA', border: '1px solid rgba(61,32,16,0.08)' }}>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Customer</span>
                <span className="font-semibold" style={{ color: '#3D2010' }}>{orderInfo?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                <span>Order Type</span>
                <span className="capitalize font-semibold" style={{ color: '#3D2010' }}>{orderInfo?.orderType || 'Pickup'}</span>
              </div>
              {orderInfo?.pickupTime && (
                <div className="flex justify-between" style={{ color: '#5C2A0A' }}>
                  <span>Pickup Time</span>
                  <span className="font-semibold" style={{ color: '#3D2010' }}>{orderInfo.pickupTime}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ color: '#5C2A0A' }}><span>Subtotal</span><span>₱{cartSubtotal}</span></div>
              {deliveryFee > 0 && <div className="flex justify-between" style={{ color: '#5C2A0A' }}><span>Delivery Fee</span><span>₱{deliveryFee}</span></div>}
              <div className="flex justify-between font-semibold pt-1 border-t" style={{ borderColor: '#eee', color: '#3D2010' }}>
                <span>Total</span><span>₱{total}</span>
              </div>
            </div>
          </div>

          {/* Upload Receipt */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#3D2010' }}>Upload GCash Receipt *</p>
            <p className="text-xs mb-3" style={{ color: '#9C7A5A' }}>After paying, screenshot your GCash receipt and upload it here. Our team will verify manually.</p>

            {!receiptPreview ? (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all hover:opacity-80"
                style={{ borderColor: error ? '#e53e3e' : 'rgba(0,122,255,0.4)', backgroundColor: error ? '#fff5f5' : '#F0F7FF' }}>
                <Upload className="w-6 h-6" style={{ color: '#007AFF' }} />
                <span className="text-xs font-semibold" style={{ color: '#007AFF' }}>Tap to upload receipt</span>
                <span className="text-xs" style={{ color: '#9C7A5A' }}>JPG or PNG, max 5MB</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(0,122,255,0.3)' }}>
                <img src={receiptPreview} alt="Receipt preview" className="w-full object-contain max-h-48" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button onClick={() => setPreviewOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={handleRemoveReceipt} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(229,62,62,0.85)' }}>
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1" style={{ backgroundColor: 'rgba(0,122,255,0.85)', color: '#fff' }}>
                  <CheckCircle className="w-3 h-3" /> Receipt uploaded
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
            {error && <p className="flex items-center gap-1 text-xs mt-2" style={{ color: '#e53e3e' }}><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</p>}
          </div>

          {/* Confirm Button */}
          <button onClick={handlePaid} disabled={!receiptFile || submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:cursor-not-allowed"
            style={{ backgroundColor: receiptFile && !submitting ? '#007AFF' : 'rgba(0,122,255,0.4)' }}>
            {submitting
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <CheckCircle className="w-5 h-5" />
            }
            {submitting ? 'Confirming...' : "I've Paid — Confirm Order"}
          </button>

          <p className="text-center text-xs" style={{ color: '#9C7A5A' }}>Our team will verify your payment manually.</p>

          <button onClick={() => navigate('/checkout')} className="w-full py-2 text-sm transition-colors flex items-center justify-center gap-1.5" style={{ color: '#e53e3e' }}>
            <X className="w-4 h-4" /> Cancel & Go Back
          </button>

          <div className="flex items-center justify-center gap-2 pt-2 border-t" style={{ borderColor: '#eee' }}>
            <Shield className="w-4 h-4" style={{ color: '#5C2A0A' }} />
            <p className="text-xs" style={{ color: '#5C2A0A' }}>No automatic charges · Team verifies manually</p>
          </div>
        </div>
      </div>

      {previewOpen && receiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setPreviewOpen(false)}>
          <div className="relative max-w-sm w-full">
            <button onClick={() => setPreviewOpen(false)} className="absolute -top-10 right-0 text-white text-sm flex items-center gap-1">
              <X className="w-4 h-4" /> Close
            </button>
            <img src={receiptPreview} alt="Receipt full view" className="w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}