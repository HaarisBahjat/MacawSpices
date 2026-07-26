import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiCheck, FiMapPin, FiCreditCard, FiPlus, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authAPI, paymentAPI, orderAPI } from '../services/api';
import useCartStore from '../store/useCartStore';
import SelectDropdown from '../components/SelectDropdown';

const STEPS = ['Address', 'Review', 'Payment'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, fetchCart, isLoading: cartLoading } = useCartStore();
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [cartReady, setCartReady] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Ensure cart is always loaded with fresh product data on checkout mount
  useEffect(() => {
    fetchCart().then(() => setCartReady(true));
  }, []);

  const { data: profileData, refetch } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => authAPI.getMe(),
  });

  const profile = profileData?.data?.user;
  const addresses = profile?.addresses || [];
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const isFreeShipping = appliedCoupon?.freeShipping || subtotal >= 499;
  const shipping = isFreeShipping ? 0 : 60;
  const total = Math.max(0, subtotal - discountAmount + shipping);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await orderAPI.validateCoupon(couponInput.trim(), subtotal);
      if (res.data?.coupon?.valid) {
        setAppliedCoupon(res.data.coupon);
        toast.success(`Coupon ${res.data.coupon.code} applied!`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.error || 'Invalid promo code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
    toast.success('Coupon removed');
  };

  // Guard: redirect to cart if cart is empty after it's done loading
  if (cartReady && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-spice-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiShoppingCart className="text-3xl text-spice-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-bark-900 mb-2">Your cart is empty</h2>
        <p className="text-bark-500 mb-6">Add items to your cart before checking out.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  // Guard: show loading while cart is being fetched
  if (!cartReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-bark-500 text-sm">Loading your cart...</p>
        </div>
      </div>
    );
  }

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('All address fields are required');
      return;
    }
    const cleanPin = String(newAddress.pincode).trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      toast.error('Pincode must be exactly 6 digits (e.g. 560001)');
      return;
    }
    try {
      const res = await authAPI.addAddress({ ...newAddress, pincode: cleanPin });
      toast.success('Address saved!');
      setSelectedAddress(res.data.address.id);
      setShowNewAddr(false);
      setNewAddress({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add address');
    }
  };

  // Load Razorpay script only once — if already loaded, resolve immediately
  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    // Check if a script tag for Razorpay is already in the DOM
    const existing = document.querySelector('script[src*="razorpay"]');
    if (existing) {
      // Wait for it to finish loading
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
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

      // Step 1: Create DB order (with stock validation & server pricing) + pre-create Razorpay order
      const orderRes = await orderAPI.create({
        addressId: selectedAddress,
        couponCode: appliedCoupon?.code,
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
      });

      const dbOrder = orderRes.data.order;
      const razorpayOrder = orderRes.data.razorpayOrder;
      const keyId = orderRes.data.keyId;

      // Fallback if Razorpay credentials are absent in environment
      if (!razorpayOrder) {
        // Direct order fallback (e.g. dev/test mode without live Razorpay keys)
        await clearCart();
        toast.success('Order created successfully!');
        setIsProcessing(false);
        navigate('/order-success', { state: { order: dbOrder }, replace: true });
        return;
      }

      // Step 2: Open Razorpay modal with pre-generated Razorpay order ID
      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'MacawSpices',
        description: `Order #${dbOrder.id.slice(-8).toUpperCase()}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: profile?.name,
          email: profile?.email,
          contact: profile?.phone || '',
        },
        theme: { color: '#B5451B' },
        handler: async (response) => {
          try {
            // Step 3: Verify payment signature and advance order status to PROCESSING
            const verifyRes = await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: dbOrder.id,
            });

            await clearCart();
            toast.success('Payment successful! Order placed 🎉');
            setIsProcessing(false);
            const confirmedOrder = verifyRes?.data?.order || dbOrder;
            navigate('/order-success', { state: { order: confirmedOrder }, replace: true });
          } catch (handlerErr) {
            console.error('❌ Payment handler error:', handlerErr);
            toast.error('Payment verification failed. Contact support.');
            setIsProcessing(false);
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('❌ Payment initiation error:', err?.response?.data || err?.message || err);
      const msg = err?.response?.data?.error || 'Failed to initiate order. Try again.';
      toast.error(msg);
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
                        <SelectDropdown
                          value={newAddress.label || 'Home'}
                          onChange={(val) => setNewAddress({ ...newAddress, label: val })}
                          options={[
                            { value: 'Home', label: 'Home' },
                            { value: 'Work', label: 'Work' },
                            { value: 'Other', label: 'Other' },
                          ]}
                          className="w-full"
                        />
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

            {/* Coupon / Promo Code Field */}
            <div className="mb-4 pt-1 pb-3 border-b border-spice-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-bark-500 mb-1.5">
                Promo / Coupon Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-2.5">
                  <div>
                    <span className="text-xs font-bold text-green-700 block">{appliedCoupon.code}</span>
                    <span className="text-[11px] text-green-600">{appliedCoupon.description}</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 rounded-lg border border-spice-300 bg-white px-3 py-1.5 text-xs text-bark-900 focus:outline-none focus:ring-1 focus:ring-chilli-600"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponInput.trim()}
                    className="px-3 py-1.5 bg-chilli-600 hover:bg-chilli-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-bark-600">
                <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>- ₹{discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-bark-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
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
