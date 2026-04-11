import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router';
import {
  Search, Package, Clock, CheckCircle, Truck, AlertCircle,
  ChevronRight, RefreshCw, MapPin, FileText, Info, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { trackOrder, cancelOrder } from '../lib/api';
import type { OnlineOrder, OnlineOrderStatus } from '../context/AppContext';

const TEASCAPE_PHONE = '09053957046';
const POLL_INTERVAL_MS = 10_000;

const STATUS_STAGES: OnlineOrderStatus[] = [
  'Payment Pending',
  'Payment Confirmed',
  'Preparing',
  'Delivering / Ready for Pickup',
  'Delivered',
];

const STATUS_LABELS: Record<OnlineOrderStatus, string> = {
  'Payment Pending':               'Payment Pending',
  'Payment Confirmed':             'Payment Confirmed',
  'Preparing':                     'Preparing Your Order',
  'Delivering / Ready for Pickup': 'Ready / On The Way',
  'Delivered':                     'Delivered / Picked Up',
};

const STATUS_DESCRIPTIONS: Record<OnlineOrderStatus, string> = {
  'Payment Pending':               'We received your order. Waiting for our team to verify your GCash receipt.',
  'Payment Confirmed':             'Your payment has been confirmed by our team.',
  'Preparing':                     'Our team is preparing your order now.',
  'Delivering / Ready for Pickup': 'Your order is ready. Pickup available or rider is on the way.',
  'Delivered':                     'Order complete. Thank you for choosing Teascape.',
};

const STATUS_ICONS: Record<OnlineOrderStatus, React.ReactNode> = {
  'Payment Pending':               <Clock className="w-4 h-4" />,
  'Payment Confirmed':             <CheckCircle className="w-4 h-4" />,
  'Preparing':                     <Package className="w-4 h-4" />,
  'Delivering / Ready for Pickup': <Truck className="w-4 h-4" />,
  'Delivered':                     <CheckCircle className="w-4 h-4" />,
};

export default function OrderTracking() {
  const { customerOrders } = useApp();
  const location = useLocation();

  // Pre-fill order ID if navigated from Home "View Full Details"
  const prefillId = (location.state as any)?.prefillId || '';

  const [query, setQuery]       = useState(prefillId);
  const [searched, setSearched] = useState(false);
  const [result, setResult]     = useState<OnlineOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelled, setCancelled] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCancel = async () => {
    if (!result) return;
    if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelOrder(result.id);
      setCancelled(true);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Could not cancel order. Please contact us.');
    } finally {
      setCancelling(false);
    }
  };

  const doSearch = useCallback(
    async (q: string, silent = false) => {
      if (!q.trim()) return;
      if (!silent) setLoading(true);

      const q_normalized = q.trim().toUpperCase();
      const q_phone = q.trim().replace(/\s/g, '');

      // 1. Try backend first (live status from Supabase)
      try {
        const backendResult = await trackOrder(q.trim());
        if (backendResult) {
          setResult(backendResult);
          setNotFound(false);
          setLastRefreshed(new Date());
          setSearched(true);
          if (!silent) setLoading(false);
          return;
        }
      } catch {
        // backend unavailable — fall through to local state
      }

      // 2. Fallback: local AppContext
      const localResult = customerOrders.find(
        o =>
          o.id.toUpperCase() === q_normalized ||
          o.phone.replace(/\s/g, '') === q_phone
      );
      setSearched(true);
      if (localResult) {
        setResult(localResult);
        setNotFound(false);
        setLastRefreshed(new Date());
      } else {
        setResult(null);
        setNotFound(true);
      }
      if (!silent) setLoading(false);
    },
    [customerOrders]
  );

  // Auto-search when prefillId is provided (coming from Home)
  useEffect(() => {
    if (prefillId) {
      doSearch(prefillId);
    }
  }, [prefillId, doSearch]);

  // Poll every 10 seconds when order is active
  useEffect(() => {
    if (result && result.status !== 'Delivered') {
      pollRef.current = setInterval(() => doSearch(query, true), POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [result, query, doSearch]);

  const handleSearch = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSearched(false);
    doSearch(query);
  };

  const currentStageIndex = result ? STATUS_STAGES.indexOf(result.status) : -1;

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(61,32,16,0.08)' }}>
            <Search className="w-8 h-8" style={{ color: '#3D2010' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#3D2010', fontWeight: 700, fontSize: '2rem' }}>
            Track Your Order
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#5C2A0A' }}>
            Enter your order code or phone number to see your order status.
          </p>
        </div>

        {/* Search Box */}
        <div className="rounded-2xl p-5 shadow-sm mb-6" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: '#3D2010' }}>
            Order Code or Phone Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearched(false); }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. TSC-12345 or 09XXXXXXXXX"
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: 'rgba(61,32,16,0.2)', backgroundColor: '#FAFAFA', color: '#3D2010' }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: '#b88917', color: '#fff', opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Track'
              }
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#9C7A5A' }}>
            Your order code was shown on the confirmation page (format: TSC-XXXXX).
          </p>
        </div>

        {/* Not Found */}
        {searched && notFound && (
          <div className="rounded-2xl p-5 mb-6 flex items-start gap-3" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#e53e3e' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#e53e3e' }}>Order not found</p>
              <p className="text-xs mt-1" style={{ color: '#5C2A0A' }}>
                No order found for <strong>"{query}"</strong>. Please double-check your order code or phone number.
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Order Info Card */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: '#9C7A5A' }}>Order Code</p>
                  <p className="text-xl font-bold tracking-widest" style={{ fontFamily: 'var(--font-display)', color: '#3D2010' }}>
                    {result.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                    backgroundColor: result.status === 'Delivered' ? 'rgba(85,100,25,0.12)' : 'rgba(184,137,23,0.12)',
                    color: result.status === 'Delivered' ? '#556419' : '#b88917',
                  }}>
                    {result.status}
                  </span>
                  <button
                    onClick={() => doSearch(query)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: 'rgba(61,32,16,0.06)' }}
                    title="Refresh status"
                  >
                    <RefreshCw className="w-4 h-4" style={{ color: '#3D2010' }} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pb-4 border-b" style={{ borderColor: 'rgba(61,32,16,0.08)' }}>
                <div>
                  <p className="font-semibold mb-0.5" style={{ color: '#C8920A' }}>Customer</p>
                  <p style={{ color: '#3D2010' }}>{result.customer}</p>
                </div>
                <div>
                  <p className="font-semibold mb-0.5" style={{ color: '#C8920A' }}>Order Type</p>
                  <p style={{ color: '#3D2010' }}>{result.type}</p>
                </div>
                <div>
                  <p className="font-semibold mb-0.5" style={{ color: '#C8920A' }}>Payment</p>
                  <p style={{ color: '#3D2010' }}>{result.payment}</p>
                </div>
                <div>
                  <p className="font-semibold mb-0.5" style={{ color: '#C8920A' }}>Total</p>
                  <p className="font-bold" style={{ color: '#3D2010' }}>P{result.total}</p>
                </div>
                {result.pickupTime && (
                  <div className="col-span-2">
                    <p className="font-semibold mb-0.5" style={{ color: '#C8920A' }}>Pickup Time</p>
                    <p style={{ color: '#3D2010' }}>{result.pickupTime}</p>
                  </div>
                )}
                {result.address && (
                  <div className="col-span-2">
                    <p className="font-semibold mb-0.5 flex items-center gap-1" style={{ color: '#C8920A' }}>
                      <MapPin className="w-3 h-3" /> Delivery Address
                    </p>
                    <p style={{ color: '#3D2010' }}>{result.address}</p>
                  </div>
                )}
                {result.specialNotes && (
                  <div className="col-span-2">
                    <p className="font-semibold mb-0.5 flex items-center gap-1" style={{ color: '#C8920A' }}>
                      <FileText className="w-3 h-3" /> Delivery Notes
                    </p>
                    <p style={{ color: '#3D2010' }}>{result.specialNotes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold mb-2" style={{ color: '#9C7A5A' }}>Items</p>
                <p className="text-xs leading-relaxed" style={{ color: '#5C2A0A' }}>{result.items}</p>
              </div>

              {lastRefreshed && result.status !== 'Delivered' && (
                <p className="text-xs mt-3" style={{ color: 'rgba(61,32,16,0.4)' }}>
                  Last updated: {lastRefreshed.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  {' — '}auto-refreshes every 10 seconds
                </p>
              )}
            </div>

            {/* Status Tracker */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid rgba(61,32,16,0.1)' }}>
              <h3 className="font-semibold mb-5" style={{ color: '#3D2010', fontFamily: 'var(--font-display)' }}>
                Order Progress
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-4 w-0.5" style={{ height: `${(STATUS_STAGES.length - 1) * 64}px`, backgroundColor: 'rgba(61,32,16,0.1)' }} />
                {currentStageIndex > 0 && (
                  <div className="absolute left-4 top-4 w-0.5 transition-all duration-700" style={{ height: `${currentStageIndex * 64}px`, backgroundColor: '#b88917' }} />
                )}
                <div className="space-y-4">
                  {STATUS_STAGES.map((stage, idx) => {
                    const done    = idx < currentStageIndex;
                    const current = idx === currentStageIndex;
                    const upcoming = idx > currentStageIndex;
                    return (
                      <div key={stage} className="flex items-start gap-4 relative" style={{ minHeight: '56px' }}>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all"
                          style={{
                            backgroundColor: done ? '#b88917' : current ? '#3D2010' : 'rgba(61,32,16,0.1)',
                            border: current ? '3px solid #b88917' : 'none',
                            color: done || current ? '#fff' : 'rgba(61,32,16,0.3)',
                          }}
                        >
                          {done ? <CheckCircle className="w-4 h-4" /> : STATUS_ICONS[stage]}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold" style={{ color: done ? '#b88917' : current ? '#3D2010' : 'rgba(61,32,16,0.3)' }}>
                              {STATUS_LABELS[stage]}
                            </p>
                            {current && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#3D2010', color: '#fff' }}>Current</span>
                            )}
                          </div>
                          {(done || current) && (
                            <p className="text-xs mt-0.5" style={{ color: upcoming ? 'transparent' : '#9C7A5A' }}>
                              {STATUS_DESCRIPTIONS[stage]}
                            </p>
                          )}
                        </div>
                        {current && <ChevronRight className="w-4 h-4 shrink-0 mt-1" style={{ color: '#b88917' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Help note */}
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: '#FAF5EE', border: '1px solid rgba(61,32,16,0.1)' }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#b88917' }} />
              <p className="text-xs" style={{ color: '#5C2A0A' }}>
                Status is updated by our team. If you have concerns, contact us at{' '}
                <a href={`tel:${TEASCAPE_PHONE}`} className="font-semibold" style={{ color: '#b88917' }}>
                  {TEASCAPE_PHONE}
                </a>.
              </p>
            </div>

            {/* Cancel order — only when Payment Pending */}
            {result.status === 'Payment Pending' && !cancelled && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#e53e3e' }}>Cancel Order</p>
                <p className="text-xs mb-3" style={{ color: '#5C2A0A' }}>
                  You can cancel this order while it is still pending payment confirmation.
                  Once our team confirms your payment, cancellation is no longer possible.
                </p>
                {cancelError && (
                  <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#e53e3e' }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {cancelError}
                  </p>
                )}
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ backgroundColor: '#e53e3e', color: '#fff' }}>
                  {cancelling
                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <X className="w-3.5 h-3.5" />
                  }
                  {cancelling ? 'Cancelling...' : 'Cancel This Order'}
                </button>
              </div>
            )}

            {cancelled && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(61,107,42,0.08)', border: '1px solid rgba(61,107,42,0.2)' }}>
                <p className="text-sm font-semibold" style={{ color: '#3D6B2A' }}>Order Cancelled</p>
                <p className="text-xs mt-1" style={{ color: '#5C2A0A' }}>Your order has been cancelled successfully.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}