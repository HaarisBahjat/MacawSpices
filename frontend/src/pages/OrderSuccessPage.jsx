import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPackage, FiTruck, FiMapPin, FiClock, FiCheckCircle,
  FiDownload, FiShoppingBag, FiCalendar, FiCreditCard, FiCopy
} from 'react-icons/fi';
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
  const COLORS = ['#B5451B', '#D97706', '#16A34A', '#7C3AED', '#0EA5E9', '#EC4899'];
  const pieces = Array.from({ length: 30 }, (_, i) => i);

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
  { key: 'CONFIRMED',  label: 'Order Confirmed',  icon: FiCheckCircle, desc: 'Your order has been confirmed and payment received.' },
  { key: 'PROCESSING', label: 'Being Prepared',   icon: FiPackage,     desc: 'Our team is carefully packing your spices.' },
  { key: 'SHIPPED',    label: 'Out for Delivery', icon: FiTruck,       desc: 'Your package is on its way to you.' },
  { key: 'DELIVERED',  label: 'Delivered',        icon: FiCheckCircle, desc: 'Package delivered to your doorstep.' },
];

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const confettiShown = useRef(false);

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
      toast.success(`${label} copied!`);
    });
  };

  return (
    <>
      <ConfettiBurst />

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-spice-50 to-cream py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* ── Hero success card ──────────────────────────────────────── */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="card p-8 text-center mb-6 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-100 rounded-full opacity-40" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-spice-100 rounded-full opacity-30" />

            <div className="relative z-10">
              {/* Animated check circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-200"
              >
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="font-display text-3xl sm:text-4xl font-bold text-bark-900 mb-2"
              >
                Payment Successful! 🎉
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-bark-500 text-base"
              >
                Thank you for your order. Your spices are being prepared!
              </motion.p>
            </div>
          </motion.div>

          {/* ── Order ID & Tracking Info ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6 mb-5"
          >
            <h2 className="font-display text-lg font-bold text-bark-900 mb-4 flex items-center gap-2">
              <FiPackage className="text-chilli-600" />
              Order Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Order ID */}
              <div className="bg-spice-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-bark-400 uppercase tracking-wide mb-1">Order ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-bark-900 text-lg">#{shortId}</p>
                  <button
                    onClick={() => copyToClipboard(order.id, 'Order ID')}
                    className="text-bark-400 hover:text-chilli-600 transition-colors"
                    title="Copy Order ID"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
                <p className="text-xs text-bark-400 mt-1">Use this to track your parcel</p>
              </div>

              {/* Payment ID */}
              <div className="bg-spice-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-bark-400 uppercase tracking-wide mb-1">Payment ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-bark-900 text-sm truncate">{paymentId.slice(0, 16)}{paymentId.length > 16 ? '…' : ''}</p>
                  <button
                    onClick={() => copyToClipboard(paymentId, 'Payment ID')}
                    className="text-bark-400 hover:text-chilli-600 transition-colors shrink-0"
                    title="Copy Payment ID"
                  >
                    <FiCopy size={14} />
                  </button>
                </div>
                <p className="text-xs text-bark-400 mt-1">Razorpay reference</p>
              </div>

              {/* Estimated Delivery */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 sm:col-span-2">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <FiCalendar size={12} /> Estimated Delivery
                </p>
                <p className="font-bold text-bark-900 text-lg">{minDate} – {maxDate}</p>
                <p className="text-xs text-bark-500 mt-1">
                  Delivery within 3–7 business days · Standard shipping
                </p>
              </div>

              {/* Amount paid */}
              <div className="bg-spice-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-bark-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <FiCreditCard size={12} /> Amount Paid
                </p>
                <p className="font-bold text-bark-900 text-2xl">₹{order.totalAmount?.toFixed(0)}</p>
              </div>

              {/* Order placed date */}
              <div className="bg-spice-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-bark-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <FiClock size={12} /> Placed On
                </p>
                <p className="font-semibold text-bark-900">
                  {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Tracking Timeline ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6 mb-5"
          >
            <h2 className="font-display text-lg font-bold text-bark-900 mb-5 flex items-center gap-2">
              <FiTruck className="text-chilli-600" />
              Order Tracking
            </h2>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-spice-200" />

              <div className="space-y-6">
                {STATUS_TIMELINE.map((step, idx) => {
                  const isActive = idx === 0; // Currently CONFIRMED
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      {/* Dot */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        isActive
                          ? 'bg-green-500 text-white shadow-md shadow-green-200'
                          : 'bg-white border-2 border-spice-200 text-bark-300'
                      }`}>
                        <Icon size={14} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm ${isActive ? 'text-bark-900' : 'text-bark-400'}`}>
                            {step.label}
                          </p>
                          {isActive && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isActive ? 'text-bark-500' : 'text-bark-300'}`}>
                          {isActive ? step.desc : 'Pending'}
                        </p>
                        {isActive && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            {new Date(order.createdAt || Date.now()).toLocaleTimeString('en-IN', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* ── Items Ordered ─────────────────────────────────────────── */}
          {order.items?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card p-6 mb-5"
            >
              <h2 className="font-display text-lg font-bold text-bark-900 mb-4 flex items-center gap-2">
                <FiShoppingBag className="text-chilli-600" />
                Items in Your Order
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-spice-50 rounded-xl">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-spice-100">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🌶️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-bark-900 text-sm truncate">
                        {item.product?.name || item.blendName || 'Custom Blend'}
                      </p>
                      <p className="text-xs text-bark-400">{item.quantity}g · ₹{item.unitPrice}/g</p>
                    </div>
                    <p className="font-bold text-bark-900 text-sm shrink-0">
                      ₹{item.totalPrice?.toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-spice-100 mt-4 pt-4 flex justify-between items-center">
                <span className="text-bark-500 text-sm">Total Paid</span>
                <span className="font-bold text-xl text-bark-900">₹{order.totalAmount?.toFixed(0)}</span>
              </div>
            </motion.div>
          )}

          {/* ── Delivery Address ──────────────────────────────────────── */}
          {order.address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card p-6 mb-6"
            >
              <h2 className="font-display text-lg font-bold text-bark-900 mb-3 flex items-center gap-2">
                <FiMapPin className="text-chilli-600" />
                Delivery Address
              </h2>
              <div className="bg-spice-50 rounded-xl p-4">
                {order.address.label && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wide text-chilli-600 bg-chilli-50 px-2 py-0.5 rounded mb-2">
                    {order.address.label}
                  </span>
                )}
                <p className="text-bark-800 text-sm leading-relaxed">
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                  {order.address.city}, {order.address.state} — {order.address.pincode}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Action Buttons ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              to={`/orders/${order.id}`}
              className="btn-primary flex-1 py-4 text-base justify-center"
            >
              <FiPackage /> View Full Order Details
            </Link>
            <Link
              to="/products"
              className="btn-secondary flex-1 py-4 text-base justify-center"
            >
              <FiShoppingBag /> Continue Shopping
            </Link>
          </motion.div>

          {/* ── Footer note ───────────────────────────────────────────── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs text-bark-400 mt-6"
          >
            Questions? Contact us at{' '}
            <a href="mailto:support@macawspices.com" className="text-chilli-600 hover:underline">
              support@macawspices.com
            </a>
          </motion.p>
        </div>
      </div>
    </>
  );
}
