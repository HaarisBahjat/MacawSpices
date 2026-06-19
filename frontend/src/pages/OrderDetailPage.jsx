import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiPackage, FiCheck, FiTruck, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import { orderAPI } from '../services/api';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const STATUS_ICONS = {
  PENDING: '⏳',
  CONFIRMED: '✅',
  PROCESSING: '🏭',
  SHIPPED: '🚚',
  DELIVERED: '🎉',
  CANCELLED: '❌',
};

export default function OrderDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id),
  });

  const order = data?.data?.order;

  if (isLoading) {
    return <div className="section py-12 animate-pulse"><div className="h-64 bg-spice-100 rounded-2xl" /></div>;
  }

  if (!order) {
    return (
      <div className="section py-20 text-center">
        <p className="text-bark-400 text-xl mb-4">Order not found</p>
        <Link to="/account" className="btn-primary">Go to Account</Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-spice-50 py-8">
      <div className="section max-w-3xl">
        <Link to="/account" className="inline-flex items-center gap-2 text-sm text-bark-500 hover:text-chilli-600 mb-6">
          <FiArrowLeft /> Back to Orders
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-bark-900">Order Details</h1>
            <p className="text-bark-500 text-sm mt-1">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <span className="text-2xl">{STATUS_ICONS[order.status] || '📦'}</span>
            <p className="font-bold text-bark-900 mt-1">{order.status}</p>
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== 'CANCELLED' && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-bark-800 mb-4">Order Progress</h2>
            <div className="flex items-center">
              {STATUS_STEPS.map((status, i) => (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i <= currentStepIdx ? 'bg-chilli-600 text-white' : 'bg-spice-200 text-bark-400'
                    }`}>
                      {i < currentStepIdx ? <FiCheck /> : i + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center w-16 ${i <= currentStepIdx ? 'text-chilli-600 font-medium' : 'text-bark-400'}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${i < currentStepIdx ? 'bg-chilli-600' : 'bg-spice-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-bark-800 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-spice-50 rounded-xl">
                <div className="w-12 h-12 bg-spice-100 rounded-lg overflow-hidden shrink-0">
                  {item.product?.images?.[0] && (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-bark-900 text-sm">{item.product?.name || item.blendName || 'Custom Blend'}</p>
                  <p className="text-xs text-bark-500">{item.quantity}g · ₹{item.unitPrice}/g</p>
                </div>
                <p className="font-semibold text-bark-900">₹{item.totalPrice.toFixed(0)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-spice-200 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-bark-600">
              <span>Subtotal</span>
              <span>₹{(order.totalAmount - 60).toFixed(0)}</span>
            </div>
            <div className="flex justify-between font-bold text-bark-900 text-base">
              <span>Total Paid</span>
              <span>₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Address */}
        {order.address && (
          <div className="card p-6">
            <h2 className="font-semibold text-bark-800 mb-2 flex items-center gap-2">
              <FiMapPin className="text-chilli-600" /> Delivery Address
            </h2>
            <p className="text-bark-700 text-sm leading-relaxed">
              {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
              {order.address.city}, {order.address.state} — {order.address.pincode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
