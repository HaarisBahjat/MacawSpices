import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiMinus, FiPlus, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { GiChiliPepper } from 'react-icons/gi';
import useCartStore from '../store/useCartStore';

export default function CartPage() {
  const { items, subtotal, updateItem, removeItem } = useCartStore();

  const shipping = subtotal >= 499 ? 0 : 60;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="w-24 h-24 bg-spice-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShoppingCart className="text-4xl text-spice-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-bark-900 mb-2">Your cart is empty</h1>
          <p className="text-bark-500 mb-8">Add some spices to get started!</p>
          <Link to="/products" className="btn-primary px-8" id="cart-continue-shopping-btn">
            <GiChiliPepper /> Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spice-50 py-8">
      <div className="section">
        <h1 className="font-display text-4xl font-bold text-bark-900 mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card p-5"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 shrink-0 bg-spice-100 rounded-xl overflow-hidden">
                      {item.type === 'product' && item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-spice-400">
                          <GiChiliPepper className="text-3xl" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-bark-900 text-base">
                            {item.type === 'blend'
                              ? (item.blendData?.blendName || 'Custom Blend')
                              : item.product?.name || 'Spice Item'}
                          </h3>
                          {item.type === 'blend' && (
                            <p className="text-xs text-bark-500 mt-0.5">
                              {item.blendData?.totalWeight?.toFixed(0)}g blend · {item.blendData?.items?.length} spices
                            </p>
                          )}
                          {item.type === 'product' && (
                            <p className="text-xs text-bark-500 mt-0.5">
                              ₹{item.product?.pricePerGram}/gram
                            </p>
                          )}
                        </div>
                        <button
                          id={`cart-remove-${item.productId}`}
                          onClick={() => removeItem(item.productId)}
                          className="text-bark-400 hover:text-chilli-600 transition-colors p-1"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity adjuster */}
                        {item.type === 'product' ? (
                          <div className="flex items-center border border-spice-200 rounded-lg overflow-hidden">
                            <button
                              id={`cart-decrease-${item.productId}`}
                              onClick={() => updateItem(item.productId, Math.max(50, item.quantity - 50))}
                              className="px-3 py-2 hover:bg-spice-50 transition-colors text-bark-600 text-sm"
                            >
                              <FiMinus />
                            </button>
                            <span className="px-4 py-2 font-medium text-bark-900 text-sm">{item.quantity}g</span>
                            <button
                              id={`cart-increase-${item.productId}`}
                              onClick={() => updateItem(item.productId, item.quantity + 50)}
                              className="px-3 py-2 hover:bg-spice-50 transition-colors text-bark-600 text-sm"
                            >
                              <FiPlus />
                            </button>
                          </div>
                        ) : (
                          <span className="badge-gold">Custom Blend</span>
                        )}

                        {/* Price */}
                        <p className="font-bold text-bark-900 text-lg">
                          ₹{item.type === 'product'
                            ? ((item.product?.pricePerGram || 0) * item.quantity).toFixed(0)
                            : item.price?.toFixed(0) || '—'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex gap-3">
              <Link to="/products" className="btn-ghost text-sm" id="cart-continue-btn">
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-bark-900 mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-bark-700">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-bark-700">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                    {shipping === 0 ? 'FREE' : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-bark-400 bg-spice-50 p-2 rounded-lg">
                    Add ₹{(499 - subtotal).toFixed(0)} more for free shipping
                  </p>
                )}
                <div className="border-t border-spice-200 pt-3 flex justify-between font-bold text-base text-bark-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <Link to="/checkout" className="w-full btn-primary mt-6 py-4 text-base justify-center" id="cart-checkout-btn">
                Proceed to Checkout <FiArrowRight />
              </Link>

              {/* Trust badges */}
              <div className="mt-4 flex justify-center gap-4 text-xs text-bark-400">
                <span>🔒 Secure Checkout</span>
                <span>✅ Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
