import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// ── Estimated delivery calculator ──────────────────────────────────────────
function getEstimatedDelivery(createdAt) {
  const created = new Date(createdAt || Date.now());
  const minDays = 3;
  const maxDays = 7;
  const minDate = new Date(created);
  const maxDate = new Date(created);
  minDate.setDate(minDate.getDate() + minDays);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const fmt = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  return { minDate: fmt(minDate), maxDate: fmt(maxDate) };
}

// ── Confetti burst component ────────────────────────────────────────────────
function ConfettiBurst() {
  const COLORS = ['#0e804f', '#38ad72', '#64c493', '#94d9b4', '#c2ebd5'];
  const pieces = Array.from({ length: 35 }, (_, i) => i);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map((i) => {
        const color = COLORS[i % COLORS.length];
        const left = `${Math.random() * 100}%`;
        const delay = Math.random() * 0.8;
        const size = Math.random() * 8 + 6;
        const rotation = Math.random() * 360;
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{ left, top: '-20px', width: size, height: size, backgroundColor: color }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{ y: '110vh', opacity: 0, rotate: rotation + 720 }}
            transition={{ duration: 2.5 + Math.random(), delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}

// ── Status timeline step ────────────────────────────────────────────────────
const STATUS_TIMELINE = [
  { key: 'CONFIRMED',  label: 'Order Confirmed',  icon: 'check_circle', desc: 'Your order has been confirmed and payment received.' },
  { key: 'PROCESSING', label: 'Apothecary Curing', icon: 'skillet',      desc: 'Our master blenders are milling and sealing your reserve.' },
  { key: 'SHIPPED',    label: 'Dispatched',        icon: 'local_shipping', desc: 'Your package has left our botanical estate.' },
  { key: 'DELIVERED',  label: 'Delivered',         icon: 'task_alt',       desc: 'Delivered directly to your discerning kitchen.' },
];

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Order data passed via router state from CheckoutPage
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      navigate('/', { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  const { minDate, maxDate } = getEstimatedDelivery(order.createdAt);
  const shortId = order.id?.slice(-8).toUpperCase() || '—';
  const paymentId = order.razorpayPaymentId || '—';

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied!`, {
        style: { background: '#1a1c1c', color: '#f9f9f9' }
      });
    });
  };

  return (
    <>
      <ConfettiBurst />

      <div className="min-h-screen bg-surface text-on-surface py-12 lg:py-20 font-sans">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">

          {/* ── Wide Hero Success Banner ──────────────────────────────────────── */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-8 lg:p-12 mb-12 relative overflow-hidden shadow-sm"
          >
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/5 rounded-full pointer-events-none blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.15, 1] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-20 h-20 bg-primary text-on-primary rounded-full flex items-center justify-center shrink-0 shadow-md"
                >
                  <span className="material-symbols-outlined text-[44px]">check</span>
                </motion.div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-outline mb-1 block">
                    Botanical Allocation Secured
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
                    Payment Successful
                  </h1>
                  <p className="text-on-surface-variant text-sm sm:text-base mt-2 max-w-xl leading-relaxed font-normal">
                    Thank you for your order. Your single-origin spices are being freshly milled and vacuum-sealed in our apothecary jars.
                  </p>
                </div>
              </div>

              {/* Express Delivery Badge */}
              <div className="bg-surface px-6 py-4 rounded-xl border border-outline-variant/60 text-center shrink-0 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-1 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span> Estimated Arrival
                </p>
                <p className="font-serif text-xl font-bold text-primary">{minDate} – {maxDate}</p>
              </div>
            </div>
          </motion.div>

          {/* ── Wide Horizontal Layout Spacing ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left Column (Span 7) - Tracking Timeline & Ordered Items */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Tracking Timeline Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-surface rounded-xl border border-outline-variant/60 p-6 lg:p-8 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
                  Allocation Tracking
                </h2>

                <div className="relative pl-2">
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-outline-variant/40" />

                  <div className="space-y-8">
                    {STATUS_TIMELINE.map((step, idx) => {
                      const isActive = idx === 0; // Currently CONFIRMED
                      return (
                        <div key={step.key} className="flex items-start gap-5 relative">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                            isActive
                              ? 'bg-primary text-on-primary shadow-md ring-4 ring-primary/10'
                              : 'bg-surface-container border border-outline-variant text-outline'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className={`font-serif font-bold text-base ${isActive ? 'text-on-surface' : 'text-outline'}`}>
                                {step.label}
                              </p>
                              {isActive && (
                                <span className="text-[10px] uppercase font-bold tracking-wider bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full">
                                  Current Status
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                              {isActive ? step.desc : 'Pending progression'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Items in Order Card */}
              {order.items?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-surface rounded-xl border border-outline-variant/60 p-6 lg:p-8 shadow-sm"
                >
                  <h2 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">inventory_2</span>
                    Artisanal Reserves Ordered
                  </h2>

                  <div className="divide-y divide-outline-variant/30">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="w-14 h-14 bg-surface-container-low rounded-lg overflow-hidden shrink-0 border border-outline-variant/40 flex items-center justify-center">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-primary text-[24px]">spa</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-on-surface text-base truncate">
                            {item.product?.name || item.blendName || 'Bespoke Craft Blend'}
                          </p>
                          <p className="text-xs text-outline font-medium mt-0.5">
                            {item.quantity}g reserve · ₹{item.unitPrice}/g
                          </p>
                        </div>
                        <p className="font-sans font-bold text-primary text-base shrink-0">
                          ₹{item.totalPrice?.toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-outline-variant/60 mt-6 pt-6 flex justify-between items-center bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-xl">
                    <span className="text-xs uppercase tracking-wider font-bold text-outline">Total Remitted</span>
                    <span className="font-serif font-bold text-2xl text-primary">₹{order.totalAmount?.toFixed(0)}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column (Span 5) - Order Info, Address & CTAs */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Order Information Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface rounded-xl border border-outline-variant/60 p-6 lg:p-8 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-primary text-[24px]">receipt_long</span>
                  Manifest Details
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Order ID</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono font-bold text-on-surface text-sm truncate">#{shortId}</p>
                      <button
                        onClick={() => copyToClipboard(order.id, 'Order ID')}
                        className="text-outline hover:text-primary transition-colors cursor-pointer"
                        title="Copy Order ID"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Remittance Ref</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono font-bold text-on-surface text-xs truncate">{paymentId.slice(0, 12)}…</p>
                      <button
                        onClick={() => copyToClipboard(paymentId, 'Payment Ref')}
                        className="text-outline hover:text-primary transition-colors cursor-pointer shrink-0"
                        title="Copy Payment ID"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-4 col-span-2 border border-outline-variant/30 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Placed On</p>
                      <p className="text-xs font-semibold text-on-surface">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Remittance</p>
                      <p className="font-serif font-bold text-base text-primary">₹{order.totalAmount?.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Delivery Address Card */}
              {order.address && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-surface rounded-xl border border-outline-variant/60 p-6 lg:p-8 shadow-sm"
                >
                  <h2 className="font-serif text-2xl font-bold text-primary mb-4 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                    <span className="material-symbols-outlined text-primary text-[24px]">location_on</span>
                    Destination Estate
                  </h2>
                  <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30 text-sm">
                    {order.address.label && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded mb-3">
                        {order.address.label}
                      </span>
                    )}
                    <p className="text-on-surface-variant leading-relaxed font-normal">
                      <strong className="text-on-surface">{order.address.line1}</strong><br />
                      {order.address.line2 ? `${order.address.line2}, ` : ''}{order.address.city}<br />
                      {order.address.state} — <span className="font-mono font-semibold">{order.address.pincode}</span>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons Stack */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-3 pt-2"
              >
                <Link
                  to={`/orders/${order.id}`}
                  className="btn-primary w-full py-4 text-xs tracking-[0.2em]"
                >
                  View Complete Manifest
                </Link>
                <Link
                  to="/products"
                  className="btn-secondary w-full py-4 text-xs tracking-[0.2em]"
                >
                  Return to Collection
                </Link>
              </motion.div>

              <p className="text-center text-xs text-outline pt-2">
                Questions regarding allocation? Email{' '}
                <a href="mailto:concierge@macawspices.com" className="text-primary font-semibold hover:underline">
                  concierge@macawspices.com
                </a>
              </p>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
