import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiCheck, FiTruck, FiMapPin, FiArrowLeft,
  FiClock, FiCreditCard, FiCopy, FiCalendar, FiCheckCircle,
  FiRefreshCw, FiExternalLink,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { orderAPI } from '../services/api';

// ── Status configuration ──────────────────────────────────────────────────
const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_META = {
  PENDING:    { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', emoji: '⏳', label: 'Pending' },
  CONFIRMED:  { color: 'text-blue-600 bg-blue-50 border-blue-200',       emoji: '✅', label: 'Confirmed' },
  PROCESSING: { color: 'text-purple-600 bg-purple-50 border-purple-200', emoji: '🏭', label: 'Processing' },
  SHIPPED:    { color: 'text-orange-600 bg-orange-50 border-orange-200', emoji: '🚚', label: 'Shipped' },
  DELIVERED:  { color: 'text-green-600 bg-green-50 border-green-200',    emoji: '🎉', label: 'Delivered' },
  CANCELLED:  { color: 'text-red-600 bg-red-50 border-red-200',          emoji: '❌', label: 'Cancelled' },
  REFUNDED:   { color: 'text-gray-600 bg-gray-50 border-gray-200',       emoji: '💸', label: 'Refunded' },
};

const TIMELINE_STEPS = [
  {
    key: 'CONFIRMED',
    label: 'Order Confirmed',
    icon: FiCheckCircle,
    desc: 'Payment received & order confirmed',
    getTime: (o) => o.createdAt,
  },
  {
    key: 'PROCESSING',
    label: 'Being Prepared',
    icon: FiPackage,
    desc: 'Our team is carefully packing your spices',
    getTime: () => null,
  },
  {
    key: 'SHIPPED',
    label: 'Out for Delivery',
    icon: FiTruck,
    desc: 'Package dispatched for delivery',
    getTime: (o) => o.shippedAt,
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: FiCheck,
    desc: 'Delivered to your doorstep',
    getTime: (o) => o.deliveredAt,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
function getEstimatedDelivery(createdAt, shippedAt) {
  const base = shippedAt ? new Date(shippedAt) : new Date(createdAt || Date.now());
  const minDate = new Date(base);
  const maxDate = new Date(base);
  if (shippedAt) {
    minDate.setDate(minDate.getDate() + 1);
    maxDate.setDate(maxDate.getDate() + 3);
  } else {
    minDate.setDate(minDate.getDate() + 3);
    maxDate.setDate(maxDate.getDate() + 7);
  }
  const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}

function fmtTime(ts) {
  if (!ts) return null;
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

// ── Live badge ────────────────────────────────────────────────────────────
function LiveBadge({ lastUpdated }) {
  return (
    <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      Live · Updates every 30s
      {lastUpdated && (
        <span className="text-bark-400 font-normal">
          · Last checked {lastUpdated}
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams();
  const [lastUpdated, setLastUpdated] = React.useState(null);

  const { data, isLoading, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id),
    // ← Auto-poll every 30 seconds — this is how live tracking works!
    refetchInterval: 30_000,
    refetchIntervalInBackground: false, // pause when tab is hidden
    onSuccess: () => {
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(now);
    },
  });

  const order = data?.data?.order;

  // Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-spice-50 py-8">
        <div className="section max-w-3xl animate-pulse space-y-4">
          <div className="h-8 bg-spice-200 rounded-xl w-1/3" />
          <div className="h-48 bg-spice-100 rounded-2xl" />
          <div className="h-64 bg-spice-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="section py-20 text-center">
        <p className="text-bark-400 text-xl mb-4">Order not found</p>
        <Link to="/account" className="btn-primary">Go to Account</Link>
      </div>
    );
  }

  const statusInfo = STATUS_META[order.status] || STATUS_META.PENDING;
  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const shortId = order.id?.slice(-8).toUpperCase();
  const estimatedDelivery = order.status === 'DELIVERED'
    ? 'Delivered!'
    : getEstimatedDelivery(order.createdAt, order.shippedAt);
  const shipping = order.totalAmount >= 499 ? 0 : 60;

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="min-h-screen bg-spice-50 py-8">
      <div className="section max-w-3xl">

        {/* Back + Live badge */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link to="/account" className="inline-flex items-center gap-2 text-sm text-bark-500 hover:text-chilli-600 transition-colors">
            <FiArrowLeft /> Back to Orders
          </Link>
          <LiveBadge lastUpdated={lastUpdated} />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-5 flex-wrap gap-3"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-bark-900">Order Details</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-bark-500 text-sm font-mono font-semibold">#{shortId}</p>
              <button onClick={() => copyText(order.id, 'Order ID')} className="text-bark-400 hover:text-chilli-600 transition-colors" title="Copy Order ID">
                <FiCopy size={13} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className={`btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5 ${isFetching ? 'opacity-50' : ''}`}
              title="Refresh status now"
            >
              <FiRefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              Refresh
            </button>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${statusInfo.color}`}>
              <span>{statusInfo.emoji}</span>
              {statusInfo.label}
            </span>
          </div>
        </motion.div>

        {/* Quick info strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        >
          <div className="card p-4 text-center">
            <FiClock className="mx-auto text-bark-400 mb-1" size={18} />
            <p className="text-xs text-bark-400 mb-0.5">Placed On</p>
            <p className="font-semibold text-bark-900 text-xs leading-tight">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="card p-4 text-center">
            <FiCreditCard className="mx-auto text-bark-400 mb-1" size={18} />
            <p className="text-xs text-bark-400 mb-0.5">Total Paid</p>
            <p className="font-bold text-bark-900 text-sm">₹{order.totalAmount?.toFixed(0)}</p>
          </div>
          <div className="card p-4 text-center">
            <FiPackage className="mx-auto text-bark-400 mb-1" size={18} />
            <p className="text-xs text-bark-400 mb-0.5">Items</p>
            <p className="font-bold text-bark-900 text-sm">{order.items?.length || 0}</p>
          </div>
          <div className="card p-4 text-center">
            <FiCalendar className={`mx-auto mb-1 ${order.status === 'DELIVERED' ? 'text-green-500' : 'text-bark-400'}`} size={18} />
            <p className="text-xs text-bark-400 mb-0.5">
              {order.status === 'DELIVERED' ? 'Status' : 'Est. Delivery'}
            </p>
            <p className={`font-semibold text-xs leading-tight ${order.status === 'DELIVERED' ? 'text-green-600' : 'text-bark-800'}`}>
              {estimatedDelivery}
            </p>
          </div>
        </motion.div>

        {/* ── TRACKING NUMBER CARD (shows only when SHIPPED) ── */}
        <AnimatePresence>
          {order.status === 'SHIPPED' && (order.trackingNumber || order.courierName) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card p-5 mb-5 border-2 border-orange-200 bg-orange-50"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-2 flex items-center gap-1">
                    <FiTruck size={12} /> Shipment Tracking
                  </p>
                  {order.courierName && (
                    <p className="font-semibold text-bark-800 text-sm mb-1">
                      Courier: <span className="text-orange-700">{order.courierName}</span>
                    </p>
                  )}
                  {order.trackingNumber && (
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-bark-900">{order.trackingNumber}</p>
                      <button
                        onClick={() => copyText(order.trackingNumber, 'Tracking number')}
                        className="text-bark-400 hover:text-orange-600 transition-colors"
                      >
                        <FiCopy size={14} />
                      </button>
                    </div>
                  )}
                  {order.shippedAt && (
                    <p className="text-xs text-bark-400 mt-1">Shipped on {fmtTime(order.shippedAt)}</p>
                  )}
                </div>
                {order.trackingNumber && (
                  <a
                    href={`https://www.google.com/search?q=${order.courierName || 'courier'}+tracking+${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
                  >
                    Track Package <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment ID */}
        {order.razorpayPaymentId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card p-4 mb-5 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-xs font-semibold text-bark-400 uppercase tracking-wide">Payment ID</p>
              <p className="font-mono text-sm font-bold text-bark-800 mt-0.5">{order.razorpayPaymentId}</p>
            </div>
            <button
              onClick={() => copyText(order.razorpayPaymentId, 'Payment ID')}
              className="text-bark-400 hover:text-chilli-600 transition-colors shrink-0"
            >
              <FiCopy />
            </button>
          </motion.div>
        )}

        {/* ── STATUS TIMELINE ── */}
        {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 mb-5"
          >
            <h2 className="font-semibold text-bark-800 mb-5 flex items-center gap-2">
              <FiTruck className="text-chilli-600" /> Order Progress
            </h2>

            {/* Horizontal progress bar */}
            <div className="flex items-center mb-6">
              {STATUS_STEPS.map((status, i) => (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i < currentStepIdx
                        ? 'bg-green-500 text-white shadow-sm'
                        : i === currentStepIdx
                        ? 'bg-chilli-600 text-white shadow-md shadow-chilli-200 ring-4 ring-chilli-100'
                        : 'bg-spice-100 text-bark-400'
                    }`}>
                      {i < currentStepIdx ? <FiCheck size={14} /> : i + 1}
                    </div>
                    <span className={`text-xs mt-1.5 text-center w-16 leading-tight ${
                      i <= currentStepIdx ? 'text-chilli-600 font-medium' : 'text-bark-300'
                    }`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 mb-5 rounded-full transition-all duration-500 ${
                      i < currentStepIdx ? 'bg-green-400' : 'bg-spice-100'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Vertical detailed timeline */}
            <div className="relative border-l-2 border-spice-100 pl-6 space-y-5 ml-4">
              {TIMELINE_STEPS.map((step, idx) => {
                const isCompleted = STATUS_STEPS.indexOf(step.key) < currentStepIdx;
                const isCurrent   = step.key === order.status ||
                  (step.key === 'CONFIRMED' && ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status));
                const isActive = isCompleted || (step.key === STATUS_STEPS[currentStepIdx]);
                const Icon = step.icon;
                const timestamp = step.getTime(order);
                return (
                  <div key={step.key} className="relative">
                    <div className={`absolute -left-[33px] w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isCompleted ? 'bg-green-500' : isActive ? 'bg-chilli-600' : 'bg-spice-200'
                    }`}>
                      <Icon size={10} className="text-white" />
                    </div>
                    <div className={`${isActive ? 'opacity-100' : 'opacity-35'}`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-bark-800">{step.label}</p>
                        {isCompleted && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Done</span>
                        )}
                        {!isCompleted && isActive && (
                          <span className="text-xs bg-chilli-100 text-chilli-700 px-2 py-0.5 rounded-full">In Progress</span>
                        )}
                      </div>
                      <p className="text-xs text-bark-400 mt-0.5">{step.desc}</p>
                      {timestamp && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">{fmtTime(timestamp)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Cancelled / Refunded banner */}
        {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
          <div className="card p-5 mb-5 border-2 border-red-200 bg-red-50 text-center">
            <p className="text-2xl mb-1">{statusInfo.emoji}</p>
            <p className="font-bold text-red-700">{statusInfo.label}</p>
            <p className="text-sm text-red-500 mt-1">
              {order.status === 'REFUNDED' ? 'Your refund is being processed.' : 'This order was cancelled.'}
            </p>
          </div>
        )}

        {/* Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-6 mb-5"
        >
          <h2 className="font-semibold text-bark-800 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-spice-50 rounded-xl">
                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-spice-100">
                  {item.product?.images?.[0] ? (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🌶️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-bark-900 text-sm truncate">
                    {item.product?.name || item.blendName || 'Custom Blend'}
                  </p>
                  <p className="text-xs text-bark-400">{item.quantity}g · ₹{item.unitPrice}/g</p>
                </div>
                <p className="font-semibold text-bark-900 shrink-0">₹{item.totalPrice.toFixed(0)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-spice-100 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-bark-500">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between font-bold text-bark-900 text-base pt-1 border-t border-spice-100">
              <span>Total Paid</span>
              <span>₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>

        {/* Delivery Address */}
        {order.address && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6 mb-6"
          >
            <h2 className="font-semibold text-bark-800 mb-3 flex items-center gap-2">
              <FiMapPin className="text-chilli-600" /> Delivery Address
            </h2>
            <div className="bg-spice-50 rounded-xl p-4">
              {order.address.label && (
                <span className="inline-block text-xs font-bold uppercase tracking-wide text-chilli-600 bg-chilli-50 px-2 py-0.5 rounded mb-2">
                  {order.address.label}
                </span>
              )}
              <p className="text-bark-700 text-sm leading-relaxed">
                {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-bark-400">
          Questions about your order?{' '}
          <a href="mailto:support@macawspices.com" className="text-chilli-600 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
