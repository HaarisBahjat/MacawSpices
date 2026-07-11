import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { orderAPI } from '../services/api';

// ── Status configuration ──────────────────────────────────────────────────
const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const STATUS_META = {
  PENDING:    { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', emoji: '⏳', label: 'Allocation Pending' },
  CONFIRMED:  { color: 'text-primary bg-primary/10 border-primary/30',   emoji: '✨', label: 'Allocation Confirmed' },
  PROCESSING: { color: 'text-primary bg-secondary-container border-outline-variant', emoji: '🌿', label: 'Apothecary Curing' },
  SHIPPED:    { color: 'text-orange-700 bg-orange-50 border-orange-200', emoji: '🚚', label: 'In Transit' },
  DELIVERED:  { color: 'text-primary bg-primary-fixed border-primary/40',emoji: '📦', label: 'Delivered to Estate' },
  CANCELLED:  { color: 'text-error bg-error-container border-error/30',  emoji: '✕',  label: 'Allocation Cancelled' },
  REFUNDED:   { color: 'text-outline bg-surface-container border-outline', emoji: '↩',  label: 'Remittance Refunded' },
};

const TIMELINE_STEPS = [
  {
    key: 'CONFIRMED',
    label: 'Order Confirmed',
    icon: 'check_circle',
    desc: 'Remittance verified & botanical reserve allocated',
    getTime: (o) => o.createdAt,
  },
  {
    key: 'PROCESSING',
    label: 'Apothecary Preparation',
    icon: 'skillet',
    desc: 'Master blenders milling & sealing jars in vacuum chambers',
    getTime: (o) => o.processedAt,  // ← Fixed: was always returning null
  },
  {
    key: 'SHIPPED',
    label: 'Dispatched from Estate',
    icon: 'local_shipping',
    desc: 'Courier manifest generated & package in transit',
    getTime: (o) => o.shippedAt,
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: 'task_alt',
    desc: 'Delivered safely to your discerning kitchen',
    getTime: (o) => o.deliveredAt,
  },
];

// Timeline event icon map
const EVENT_ICONS = {
  PROCESSING:        'skillet',
  CONFIRMED:         'check_circle',
  SHIPPED:           'local_shipping',
  HUB_SCAN:          'qr_code_scanner',
  IN_TRANSIT:        'directions_bus',
  OUT_FOR_DELIVERY:  'delivery_dining',
  FAILED_ATTEMPT:    'warning',
  DELIVERED:         'task_alt',
  CANCELLED:         'cancel',
  REFUNDED:          'currency_rupee',
};

const EVENT_COLORS = {
  PROCESSING:       'bg-primary text-on-primary',
  CONFIRMED:        'bg-primary text-on-primary',
  SHIPPED:          'bg-orange-500 text-white',
  HUB_SCAN:         'bg-blue-500 text-white',
  IN_TRANSIT:       'bg-sky-500 text-white',
  OUT_FOR_DELIVERY: 'bg-amber-500 text-white',
  FAILED_ATTEMPT:   'bg-red-400 text-white',
  DELIVERED:        'bg-primary text-on-primary',
  CANCELLED:        'bg-error text-on-error',
  REFUNDED:         'bg-outline text-surface',
};

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

function fmtFull(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// ── Live badge ────────────────────────────────────────────────────────────
function LiveBadge({ lastUpdated }) {
  return (
    <div className="flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      Live Telemetry · 30s Poll
      {lastUpdated && (
        <span className="text-outline font-medium lowercase">
          · checked {lastUpdated}
        </span>
      )}
    </div>
  );
}

// ── Print Invoice ─────────────────────────────────────────────────────────
function printInvoice(order) {
  const shortId = order.id?.slice(-8).toUpperCase();
  const shipping = order.totalAmount >= 499 ? 0 : 60;
  const subtotal = order.totalAmount - shipping;

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;">
        ${item.product?.name || item.blendName || 'Bespoke Blend'}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${item.quantity}g</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;">₹${item.unitPrice?.toFixed(2)}/g</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600;">₹${item.totalPrice?.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice — MacawSpices #${shortId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0e804f; padding-bottom: 24px; margin-bottom: 28px; }
    .brand { font-size: 28px; font-weight: 700; color: #0e804f; letter-spacing: 1px; }
    .brand-sub { font-size: 12px; color: #888; margin-top: 4px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 22px; font-weight: 700; color: #1a1a1a; }
    .invoice-title p { font-size: 12px; color: #888; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-box { background: #f5f5f5; border-radius: 8px; padding: 16px 20px; }
    .meta-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; font-weight: 600; }
    .meta-box p { font-size: 13px; color: #1a1a1a; line-height: 1.6; }
    .meta-box .mono { font-family: monospace; font-weight: 700; font-size: 15px; color: #0e804f; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: #0e804f; color: white; }
    thead th { padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    thead th:not(:first-child) { text-align: right; }
    .totals { margin-left: auto; width: 320px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #eee; }
    .total-final { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 700; color: #0e804f; border-top: 2px solid #0e804f; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #aaa; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-top: 4px; }
    @media print {
      body { padding: 20px; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">🌿 MacawSpices</div>
      <div class="brand-sub">Premium Botanical Apothecary · India</div>
      <div class="brand-sub" style="margin-top:8px;">GSTIN: 29XXXXX1234X1ZX (if applicable)</div>
    </div>
    <div class="invoice-title">
      <h2>TAX INVOICE</h2>
      <p>Invoice No: MS-${shortId}</p>
      <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <span class="badge">${order.isPaid ? '✓ PAID' : 'UNPAID'}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Bill To / Ship To</h4>
      <p><strong>${order.address?.label || 'Delivery Address'}</strong></p>
      <p>${order.address?.line1 || ''}</p>
      <p>${order.address?.line2 ? order.address.line2 + ', ' : ''}${order.address?.city || ''}</p>
      <p>${order.address?.state || ''} — ${order.address?.pincode || ''}</p>
    </div>
    <div class="meta-box">
      <h4>Order & Payment Details</h4>
      <p>Order Ref: <span class="mono">#${shortId}</span></p>
      <p style="margin-top:6px;font-size:12px;color:#555;">Full ID: ${order.id}</p>
      ${order.razorpayPaymentId ? `<p style="margin-top:6px;font-size:12px;color:#555;">Payment ID: ${order.razorpayPaymentId}</p>` : ''}
      ${order.courierName ? `<p style="margin-top:6px;font-size:12px;color:#555;">Courier: ${order.courierName} · AWB: ${order.trackingNumber || 'N/A'}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;">Item Description</th>
        <th>Qty (g)</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
    <div class="total-row"><span>Shipping & Logistics</span><span>${shipping === 0 ? 'FREE (Order ≥ ₹499)' : '₹' + shipping.toFixed(2)}</span></div>
    <div class="total-row"><span>Tax (GST incl. if any)</span><span>Inclusive</span></div>
    <div class="total-final"><span>Total Paid</span><span>₹${order.totalAmount?.toFixed(2)}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for your order from MacawSpices Botanical Apothecary.</p>
    <p style="margin-top:4px;">For queries: concierge@macawspices.com · This is a computer-generated invoice.</p>
  </div>

  <script>setTimeout(() => window.print(), 400);</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    toast.error('Please allow pop-ups for invoice printing.');
  }
}

// ── Cancel Order Modal ────────────────────────────────────────────────────
function CancelModal({ orderId, shortId, onClose, onSuccess }) {
  const [confirmed, setConfirmed] = useState(false);
  const cancelMutation = useMutation({
    mutationFn: () => orderAPI.cancel(orderId),
    onSuccess: () => {
      toast.success('Order cancelled successfully.');
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Cancellation failed.'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-outline-variant/60 rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-error text-[48px] mb-3 block">cancel</span>
          <h3 className="font-serif text-2xl font-bold text-on-surface">Cancel Allocation #{shortId}?</h3>
          <p className="text-sm text-outline mt-2 leading-relaxed">
            This action is <strong>irreversible</strong>. Stock will be restored automatically. If payment was made, a refund will be initiated within 5–7 business days.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 bg-error-container/30 rounded-xl border border-error/20">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 cursor-pointer"
          />
          <span className="text-sm text-on-surface-variant leading-relaxed">
            I understand this cancellation cannot be undone and agree to proceed.
          </span>
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => cancelMutation.mutate()}
            disabled={!confirmed || cancelMutation.isPending}
            className="flex-1 py-3 rounded-xl bg-error text-on-error font-bold text-sm uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-outline-variant/60 text-on-surface-variant font-semibold text-sm cursor-pointer hover:bg-surface-container transition-colors"
          >
            Keep Order
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Return Modal ──────────────────────────────────────────────────────────
const RETURN_REASONS = [
  'Wrong item received',
  'Item arrived damaged',
  'Quality not as described',
  'Missing items in order',
  'Changed my mind',
  'Other',
];

function ReturnModal({ orderId, shortId, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const returnMutation = useMutation({
    mutationFn: () => orderAPI.requestReturn(orderId, { reason, notes }),
    onSuccess: () => {
      toast.success("Return request submitted! We'll contact you within 24 hours.");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Return request failed.'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-surface border border-outline-variant/60 rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-primary text-[48px] mb-3 block">assignment_return</span>
          <h3 className="font-serif text-2xl font-bold text-on-surface">Return / Replacement</h3>
          <p className="text-sm text-outline mt-1">Allocation #{shortId} · 7-day return window</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Reason for Return *</label>
            <div className="grid grid-cols-2 gap-2">
              {RETURN_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`text-xs py-2.5 px-3 rounded-lg border text-left transition-all cursor-pointer ${
                    reason === r
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Additional Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the issue in detail..."
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => returnMutation.mutate()}
            disabled={!reason || returnMutation.isPending}
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm uppercase tracking-wider disabled:opacity-40 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {returnMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-outline-variant/60 text-on-surface-variant font-semibold text-sm cursor-pointer hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────
function ActivityFeed({ events }) {
  if (!events?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-surface border border-outline-variant/60 rounded-xl p-6 lg:p-8 shadow-sm"
    >
      <h2 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
        <span className="material-symbols-outlined text-primary text-[24px]">timeline</span>
        Live Activity Feed
        <span className="ml-auto text-[10px] font-sans font-bold text-outline uppercase tracking-widest bg-surface-container-low px-2.5 py-1 rounded-full border border-outline-variant/30">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </h2>

      <div className="relative border-l-2 border-outline-variant/40 pl-6 space-y-5 ml-3">
        {events.map((event, i) => {
          const icon = EVENT_ICONS[event.eventStatus] || 'radio_button_checked';
          const colorClass = EVENT_COLORS[event.eventStatus] || 'bg-outline text-surface';
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <div className={`absolute -left-[33px] w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${colorClass}`}>
                <span className="material-symbols-outlined text-[13px]">{icon}</span>
              </div>
              <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-serif font-bold text-sm text-on-surface leading-tight">{event.title}</p>
                  <span className="text-[10px] font-mono text-outline shrink-0">{fmtFull(event.createdAt)}</span>
                </div>
                {event.location && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{event.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    onSuccess: () => {
      const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(now);
    },
  });

  const order = data?.data?.order;

  // Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface py-12 px-4">
        <div className="max-w-container-max mx-auto animate-pulse space-y-8">
          <div className="h-8 bg-surface-container-high rounded-xl w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(n => <div key={n} className="h-24 bg-surface-container-high rounded-xl" />)}
          </div>
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-7 h-96 bg-surface-container-high rounded-xl" />
            <div className="col-span-5 h-96 bg-surface-container-high rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-container-max mx-auto px-4 py-32 text-center font-sans">
        <h2 className="font-serif text-3xl font-bold text-on-surface mb-3">Manifest Archive Not Found</h2>
        <p className="text-outline mb-8">The requested order manifest identifier is invalid or expired.</p>
        <Link to="/account" className="btn-primary">Return to Account</Link>
      </div>
    );
  }

  const statusInfo = STATUS_META[order.status] || STATUS_META.PENDING;
  const currentStepIdx = STATUS_STEPS.indexOf(order.status);
  const shortId = order.id?.slice(-8).toUpperCase();
  const estimatedDelivery = order.status === 'DELIVERED'
    ? 'Arrived at Estate'
    : getEstimatedDelivery(order.createdAt, order.shippedAt);
  const shipping = order.totalAmount >= 499 ? 0 : 60;

  // Return window check (within 7 days of delivery)
  const deliveredAt = order.deliveredAt || order.updatedAt;
  const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
  const canReturn = order.status === 'DELIVERED' && daysSinceDelivery <= 7;
  const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
  const canCancel = cancellableStatuses.includes(order.status);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, {
      style: { background: '#1a1c1c', color: '#f9f9f9' }
    });
  };

  const handleOrderSuccess = () => {
    qc.invalidateQueries(['order', id]);
    qc.invalidateQueries(['my-orders']);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface py-12 lg:py-20 font-sans">
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            orderId={order.id}
            shortId={shortId}
            onClose={() => setShowCancelModal(false)}
            onSuccess={handleOrderSuccess}
          />
        )}
        {showReturnModal && (
          <ReturnModal
            orderId={order.id}
            shortId={shortId}
            onClose={() => setShowReturnModal(false)}
            onSuccess={handleOrderSuccess}
          />
        )}
      </AnimatePresence>

      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">

        {/* Back + Live badge */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4 border-b border-outline-variant/30 pb-6">
          <Link to="/account?tab=orders" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span> Return to Manifests
          </Link>
          <div className="flex items-center gap-4 flex-wrap">
            <LiveBadge lastUpdated={lastUpdated} />
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className={`btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5 border border-outline-variant/40 rounded-lg cursor-pointer ${isFetching ? 'opacity-50' : ''}`}
              title="Refresh status now"
            >
              <span className={`material-symbols-outlined text-[16px] ${isFetching ? 'animate-spin' : ''}`}>refresh</span>
              Telemetry Poll
            </button>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
              <span>{statusInfo.emoji}</span>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-outline mb-1 block">Apothecary Manifest</span>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-primary tracking-tight">
              Allocation #{shortId}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Download Invoice */}
            <button
              onClick={() => printInvoice(order)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2.5 rounded-lg border border-primary/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              Download Tax Invoice
            </button>
            <button
              onClick={() => copyText(order.id, 'Full Order Ref')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-outline hover:text-primary bg-surface-container-low px-3.5 py-2 rounded-lg border border-outline-variant/40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span> Copy Full Ref ID
            </button>
          </div>
        </div>

        {/* Action Buttons (Cancel / Return) */}
        {(canCancel || canReturn) && (
          <div className="flex gap-3 mb-8 flex-wrap">
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-error border border-error/40 bg-error-container/20 hover:bg-error-container/50 px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Cancel This Order
              </button>
            )}
            {canReturn && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/40 bg-primary/10 hover:bg-primary/20 px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                Request Return / Replacement
              </button>
            )}
          </div>
        )}

        {/* Quick info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[24px] mb-2 block">schedule</span>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Allocated On</p>
            <p className="font-serif font-bold text-on-surface text-base mt-0.5 truncate">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[24px] mb-2 block">payments</span>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Remitted</p>
            <p className="font-serif font-bold text-primary text-base mt-0.5">₹{order.totalAmount?.toFixed(0)}</p>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[24px] mb-2 block">inventory_2</span>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Reserve Count</p>
            <p className="font-serif font-bold text-on-surface text-base mt-0.5">{order.items?.length || 0} Specimens</p>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-5 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[24px] mb-2 block">local_shipping</span>
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Expected Arrival</p>
            <p className="font-serif font-bold text-primary text-base mt-0.5 truncate">{estimatedDelivery}</p>
          </div>
        </div>

        {/* ── TRACKING NUMBER CARD (if SHIPPED/DELIVERED) ── */}
        <AnimatePresence>
          {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (order.trackingNumber || order.courierName) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-secondary-container border border-primary/30 rounded-2xl p-6 mb-10 text-on-secondary-container shadow-sm"
            >
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[36px] text-primary">local_shipping</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Active Shipment Dispatch</p>
                    <p className="text-sm font-semibold">
                      Courier: <strong className="text-on-surface">{order.courierName || 'Artisanal Courier'}</strong>
                      {order.trackingNumber && <> · Waybill <span className="font-mono font-bold">{order.trackingNumber}</span></>}
                    </p>
                  </div>
                </div>
                {order.trackingNumber && (
                  <a
                    href={`https://www.google.com/search?q=${order.courierName || 'courier'}+tracking+${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary px-6 py-3 text-xs shrink-0 inline-flex items-center gap-2"
                  >
                    Track Dispatch Live <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Grid Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column (Span 7) */}
          <div className="lg:col-span-7 space-y-8">

            {/* Allocation Progression Card */}
            {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface border border-outline-variant/60 rounded-xl p-6 lg:p-8 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-primary text-[24px]">trending_up</span>
                  Allocation Progression
                </h2>

                {/* Horizontal Progress Bar */}
                <div className="flex items-center justify-between mb-10 overflow-x-auto pb-4 pt-2 px-2 scrollbar-hide">
                  {STATUS_STEPS.map((status, i) => {
                    const isPassed  = i < currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    return (
                      <React.Fragment key={status}>
                        <div className="flex flex-col items-center min-w-[70px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isPassed
                              ? 'bg-primary text-on-primary shadow-sm'
                              : isCurrent
                              ? 'bg-primary text-on-primary ring-4 ring-primary/20 scale-110 shadow-md font-serif text-sm'
                              : 'bg-surface-container-low border border-outline-variant text-outline'
                          }`}>
                            {isPassed ? <span className="material-symbols-outlined text-[18px]">check</span> : i + 1}
                          </div>
                          <span className={`text-[10px] mt-2.5 font-bold uppercase tracking-wider text-center ${
                            isCurrent ? 'text-primary font-extrabold' : isPassed ? 'text-on-surface' : 'text-outline opacity-60'
                          }`}>
                            {status}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 -mt-6 transition-all duration-500 min-w-[20px] ${
                            i < currentStepIdx ? 'bg-primary' : 'bg-outline-variant/40'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Detailed Vertical Timeline */}
                <div className="relative border-l-2 border-outline-variant/40 pl-6 space-y-6 ml-5">
                  {TIMELINE_STEPS.map((step) => {
                    const isCompleted = STATUS_STEPS.indexOf(step.key) < currentStepIdx;
                    const isCurrent   = step.key === order.status || (step.key === 'CONFIRMED' && ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status));
                    const isActive = isCompleted || isCurrent;
                    const timestamp = step.getTime(order);
                    return (
                      <div key={step.key} className="relative">
                        <div className={`absolute -left-[33px] w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isCompleted ? 'bg-primary text-on-primary' : isActive ? 'bg-primary text-on-primary ring-4 ring-primary/20' : 'bg-surface-container border border-outline-variant text-outline'
                        }`}>
                          <span className="material-symbols-outlined text-[12px]">{step.icon}</span>
                        </div>
                        <div className={`${isActive ? 'opacity-100' : 'opacity-40'}`}>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <p className="font-serif font-bold text-base text-on-surface">{step.label}</p>
                            {isCompleted && (
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded">Verified</span>
                            )}
                            {!isCompleted && isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded animate-pulse">In Progress</span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{step.desc}</p>
                          {timestamp && (
                            <p className="text-[10px] font-mono font-semibold text-primary mt-1">Logged: {fmtTime(timestamp)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Cancelled / Refunded Banner */}
            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
              <div className="bg-error-container/40 border border-error rounded-xl p-8 text-center text-on-error-container">
                <span className="material-symbols-outlined text-[48px] text-error mb-2 block">cancel</span>
                <p className="font-serif text-2xl font-bold text-error">{statusInfo.label}</p>
                <p className="text-sm mt-1 opacity-90">
                  {order.status === 'REFUNDED' ? 'Remittance has been credited back to your original source.' : 'This botanical allocation was cancelled.'}
                </p>
              </div>
            )}

            {/* Activity Feed */}
            <ActivityFeed events={order.timelineEvents} />

            {/* Items Ordered Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-outline-variant/60 rounded-xl p-6 lg:p-8 shadow-sm"
            >
              <h2 className="font-serif text-2xl font-bold text-primary mb-6 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">shopping_bag</span>
                Allocated Specimens
              </h2>

              <div className="divide-y divide-outline-variant/30">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-14 h-14 bg-surface-container-low rounded-lg overflow-hidden shrink-0 border border-outline-variant/40 flex items-center justify-center">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-[24px]">energy_savings_leaf</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-bold text-on-surface text-base truncate">
                        {item.product?.name || item.blendName || 'Bespoke Craft Blend'}
                      </p>
                      <p className="text-xs text-outline font-medium mt-0.5">
                        {item.quantity}g jar reserve · ₹{item.unitPrice}/g
                      </p>
                    </div>
                    <p className="font-sans font-bold text-primary text-base shrink-0">₹{item.totalPrice.toFixed(0)}</p>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-outline-variant/60 mt-8 pt-6 space-y-2.5 text-sm bg-surface-container-low -mx-6 -mb-6 p-6 rounded-b-xl">
                <div className="flex justify-between text-on-surface-variant text-xs font-semibold">
                  <span>Logistics & Transit Fee</span>
                  <span className={shipping === 0 ? 'text-primary font-bold' : ''}>{shipping === 0 ? 'COMPLIMENTARY' : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-2xl text-primary pt-2 border-t border-outline-variant/40">
                  <span>Total Remitted</span>
                  <span>₹{order.totalAmount.toFixed(0)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column (Span 5) */}
          <div className="lg:col-span-5 space-y-8">

            {/* Remittance Telemetry Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface border border-outline-variant/60 rounded-xl p-6 lg:p-8 shadow-sm space-y-4"
            >
              <h2 className="font-serif text-2xl font-bold text-primary mb-2 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                Remittance Telemetry
              </h2>

              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Internal Order Identifier</p>
                  <p className="font-mono text-xs font-bold text-on-surface mt-0.5 truncate max-w-[200px]">{order.id}</p>
                </div>
                <button onClick={() => copyText(order.id, 'Internal ID')} className="text-outline hover:text-primary p-1.5 cursor-pointer" title="Copy">
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>

              {order.razorpayPaymentId && (
                <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Payment Gateway Token</p>
                    <p className="font-mono text-xs font-bold text-on-surface mt-0.5 truncate max-w-[200px]">{order.razorpayPaymentId}</p>
                  </div>
                  <button onClick={() => copyText(order.razorpayPaymentId, 'Gateway Token')} className="text-outline hover:text-primary p-1.5 cursor-pointer" title="Copy">
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-2 pt-2">
                {[
                  { label: 'Order Placed', ts: order.createdAt, icon: 'schedule' },
                  { label: 'Curing Begun', ts: order.processedAt, icon: 'skillet' },
                  { label: 'Dispatched', ts: order.shippedAt, icon: 'local_shipping' },
                  { label: 'Delivered', ts: order.deliveredAt, icon: 'task_alt' },
                ].map(({ label, ts, icon }) => ts && (
                  <div key={label} className="flex items-center gap-3 text-xs">
                    <span className="material-symbols-outlined text-primary text-[14px]">{icon}</span>
                    <span className="text-outline font-medium w-28">{label}</span>
                    <span className="font-mono text-on-surface font-semibold">{fmtFull(ts)}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Destination Estate Address Card */}
            {order.address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface border border-outline-variant/60 rounded-xl p-6 lg:p-8 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold text-primary mb-4 flex items-center gap-2.5 border-b border-outline-variant/30 pb-4">
                  <span className="material-symbols-outlined text-primary text-[24px]">domain</span>
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

            {/* Concierge Assistance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-primary text-on-primary rounded-xl p-8 shadow-md text-center flex flex-col items-center"
            >
              <span className="material-symbols-outlined text-[40px] opacity-80 mb-3">support_agent</span>
              <h3 className="font-serif text-2xl font-bold mb-2">Concierge Assistance</h3>
              <p className="text-xs opacity-90 leading-relaxed mb-6 max-w-xs">
                Need to amend transit instructions or request expedited courier dispatch? Our master concierge is at your service.
              </p>
              <a
                href={`mailto:concierge@macawspices.com?subject=Manifest Query #${shortId}`}
                className="btn-secondary bg-surface text-primary border-none hover:bg-surface/90 w-full justify-center py-3.5 text-xs font-bold tracking-widest uppercase"
              >
                Email Apothecary Concierge
              </a>
            </motion.div>

            <div className="flex justify-center pt-2">
              <Link to="/products" className="btn-secondary w-full justify-center py-4 text-xs tracking-[0.2em]">
                Browse Further Reserves
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
