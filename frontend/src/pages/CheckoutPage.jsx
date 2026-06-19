import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiCheck, FiMapPin, FiCreditCard, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI, paymentAPI, orderAPI } from '../services/api';
import useCartStore from '../store/useCartStore';

const STEPS = ['Address', 'Review', 'Payment'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [showNewAddr, setShowNewAddr] = useState(false);

  const { data: profileData, refetch } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => authAPI.getMe(),
  });

  const profile = profileData?.data?.user;
  const addresses = profile?.addresses || [];
  const shipping = subtotal >= 499 ? 0 : 60;
  const total = subtotal + shipping;

  const handleAddAddress = async () => {
    try {
      await authAPI.addAddress({ ...newAddress, isDefault: addresses.length === 0 });
      await refetch();
      setShowNewAddr(false);
      toast.success('Address saved!');
    } catch {
      toast.error('Failed to save address');
    }
  };

  const loadRazorpay = () => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handlePayment = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }
    setIsProcessing(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        setIsProcessing(false);
        return;
      }

      // Create Razorpay order
      const { data } = await paymentAPI.createOrder({ amount: total });

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'SpiceWallah',
        description: `Order of ${items.length} items`,
        order_id: data.orderId,
        prefill: {
          name: profile?.name,
          email: profile?.email,
          contact: profile?.phone || '',
        },
        theme: { color: '#B5451B' },
        handler: async (response) => {
          try {
            // Create order in DB
            const orderRes = await orderAPI.create({
              addressId: selectedAddress,
              items: items.map((item) => ({
                productId: item.type === 'product' ? item.productId : null,
                blendName: item.type === 'blend' ? (item.blendData?.blendName || 'Custom Blend') : null,
                blendData: item.blendData || null,
                quantity: item.quantity || 1,
                unitPrice: item.product?.pricePerGram || (item.price || 0),
                totalPrice: item.type === 'product'
                  ? (item.product?.pricePerGram || 0) * item.quantity
                  : item.price || 0,
              })),
              totalAmount: total,
              razorpayOrderId: data.orderId,
            });

            // Verify payment
            await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderRes.data.order.id,
            });

            await clearCart();
            toast.success('Payment successful! Order placed 🎉');
            navigate(`/orders/${orderRes.data.order.id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-spice-50 py-8">
      <div className="section max-w-5xl">
        <h1 className="font-display text-4xl font-bold text-bark-900 mb-8">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-chilli-600 text-white' : 'bg-spice-200 text-bark-500'
                }`}>
                  {i < step ? <FiCheck /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-chilli-600' : 'text-bark-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-spice-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 0: Address */}
            {step === 0 && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold text-bark-900 mb-4 flex items-center gap-2">
                  <FiMapPin className="text-chilli-600" /> Delivery Address
                </h2>
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      id={`address-option-${addr.id}`}
                      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedAddress === addr.id ? 'border-chilli-600 bg-chilli-50' : 'border-spice-200 hover:border-spice-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => setSelectedAddress(addr.id)}
                        className="mt-1 accent-chilli-600"
                      />
                      <div>
                        <span className="font-semibold text-bark-900">{addr.label}</span>
                        {addr.isDefault && <span className="ml-2 badge-green text-xs">Default</span>}
                        <p className="text-sm text-bark-600 mt-0.5">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* New Address Form */}
                {showNewAddr ? (
                  <div className="border-2 border-dashed border-spice-300 rounded-xl p-4 space-y-3">
                    <h3 className="font-semibold text-bark-800 mb-2">New Address</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="label">Address Line 1</label>
                        <input className="input" placeholder="Flat / House No, Street" value={newAddress.line1}
                          onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Address Line 2 (Optional)</label>
                        <input className="input" placeholder="Area, Landmark" value={newAddress.line2}
                          onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">City</label>
                        <input className="input" placeholder="City" value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input className="input" placeholder="State" value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Pincode</label>
                        <input className="input" placeholder="6-digit pincode" value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                      </div>
                      <div>
                        <label className="label">Label</label>
                        <select className="input" value={newAddress.label}
                          onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}>
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddAddress} className="btn-primary text-sm py-2">Save Address</button>
                      <button onClick={() => setShowNewAddr(false)} className="btn-ghost text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    id="add-new-address-btn"
                    onClick={() => setShowNewAddr(true)}
                    className="flex items-center gap-2 text-chilli-600 font-medium text-sm hover:text-chilli-700 transition-colors mt-2"
                  >
                    <FiPlus /> Add New Address
                  </button>
                )}

                <button
                  id="checkout-continue-btn"
                  disabled={!selectedAddress}
                  onClick={() => setStep(1)}
                  className="btn-primary w-full mt-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Review
                </button>
              </div>
            )}

            {/* Step 1: Review */}
            {step === 1 && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold text-bark-900 mb-4">Review Your Order</h2>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 p-3 bg-spice-50 rounded-xl">
                      <div className="w-12 h-12 bg-spice-100 rounded-lg overflow-hidden shrink-0">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-bark-900 text-sm truncate">
                          {item.type === 'blend' ? item.blendData?.blendName : item.product?.name}
                        </p>
                        <p className="text-xs text-bark-500">{item.quantity}g</p>
                      </div>
                      <p className="font-semibold text-bark-900 text-sm shrink-0">
                        ₹{item.type === 'product'
                          ? ((item.product?.pricePerGram || 0) * item.quantity).toFixed(0)
                          : item.price?.toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-ghost flex-1">← Back</button>
                  <button id="checkout-to-payment-btn" onClick={() => setStep(2)} className="btn-primary flex-1 py-3">
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-chilli-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiCreditCard className="text-3xl text-chilli-600" />
                </div>
                <h2 className="font-display text-xl font-bold text-bark-900 mb-2">Secure Payment</h2>
                <p className="text-bark-500 mb-6">You'll be redirected to Razorpay's secure checkout. Supports UPI, Cards, Net Banking & Wallets.</p>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-ghost flex-1">← Back</button>
                  <button
                    id="pay-now-btn"
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="btn-primary flex-1 py-4 text-base"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2"><span className="spinner" /> Processing...</span>
                    ) : (
                      `Pay ₹${total.toFixed(0)}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="card p-6 h-fit sticky top-24">
            <h3 className="font-semibold text-bark-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-bark-600">
                <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-bark-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="border-t border-spice-200 pt-2 flex justify-between font-bold text-bark-900">
                <span>Total</span><span>₹{total.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
