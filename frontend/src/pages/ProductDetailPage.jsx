import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiStar, FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiPackage } from 'react-icons/fi';
import { productAPI } from '../services/api';
import useCartStore from '../store/useCartStore';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCartStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(50);
  const [activeTab, setActiveTab] = useState('description');

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getBySlug(slug),
  });

  const product = data?.data?.product;

  if (isLoading) {
    return (
      <div className="section py-12 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-spice-100 rounded-2xl" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-spice-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="section py-20 text-center text-bark-400">
        <p className="text-xl">Product not found.</p>
        <Link to="/products" className="btn-primary mt-4 inline-flex">Back to Products</Link>
      </div>
    );
  }

  const totalPrice = product.pricePerGram * quantity;
  const avgRating = product.avgRating || 0;

  return (
    <div className="min-h-screen">
      <div className="section py-8">
        {/* Breadcrumb */}
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-bark-500 hover:text-chilli-600 transition-colors mb-6">
          <FiArrowLeft /> Back to Products
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div>
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-square rounded-2xl overflow-hidden bg-spice-50 mb-4"
            >
              <img
                src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </motion.div>
            {product.images?.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    id={`product-image-${i}`}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-chilli-600' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div>
            <span className="badge-gold mb-2">{product.category?.name}</span>
            <h1 className="font-display text-4xl font-bold text-bark-900 mb-2">{product.name}</h1>

            {/* Rating */}
            {product._count?.reviews > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <FiStar key={s} className={`${s <= Math.round(avgRating) ? 'text-spice-400 fill-current' : 'text-bark-200'}`} />
                  ))}
                </div>
                <span className="text-bark-600 text-sm">{avgRating.toFixed(1)} ({product._count.reviews} reviews)</span>
              </div>
            )}

            {/* Origin & Flavor */}
            <div className="flex gap-3 flex-wrap mb-5">
              {product.origin && <span className="spice-tag">📍 {product.origin}</span>}
              {product.flavorProfile && <span className="spice-tag">🌿 {product.flavorProfile}</span>}
            </div>

            {/* Price */}
            <div className="bg-spice-50 rounded-2xl p-4 mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-bark-900">₹{totalPrice.toFixed(0)}</span>
                <span className="text-bark-500">for {quantity}g</span>
              </div>
              <p className="text-sm text-bark-500 mt-1">₹{product.pricePerGram.toFixed(2)} per gram</p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="label">Select Quantity (grams)</label>
              <div className="flex items-center gap-4">
                <div className="flex gap-3 w-full">
                  {[50, 150, 250].map((g) => (
                    <button
                      key={g}
                      id={`qty-preset-${g}`}
                      onClick={() => setQuantity(g)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                        quantity === g ? 'bg-chilli-600 text-white border-chilli-600' : 'bg-white text-bark-700 border-spice-200 hover:border-chilli-300'
                      }`}
                    >
                      {g}g
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-bark-400 mt-2">Minimum order: {product.minOrderGram}g · Stock: {product.stock.toFixed(0)}g</p>
            </div>

            {/* Add to Cart */}
            <button
              id="product-add-to-cart-btn"
              onClick={() => addItem({ productId: product.id, quantity, type: 'product' })}
              className="w-full btn-primary py-4 text-base mb-4"
            >
              <FiShoppingCart /> Add {quantity}g to Cart — ₹{totalPrice.toFixed(0)}
            </button>

            {/* Stock warning */}
            {product.stock < 500 && (
              <p className="text-sm text-chilli-600 font-medium flex items-center gap-1">
                <FiPackage /> Only {product.stock.toFixed(0)}g left in stock!
              </p>
            )}
          </div>
        </div>

        {/* Tabs: Description / Reviews */}
        <div className="mt-16">
          <div className="flex border-b border-spice-200 mb-6">
            {['description', 'reviews'].map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold text-sm capitalize transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-chilli-600 text-chilli-600'
                    : 'border-transparent text-bark-500 hover:text-bark-800'
                }`}
              >
                {tab} {tab === 'reviews' && product._count?.reviews > 0 && `(${product._count.reviews})`}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-2xl">
              <p className="text-bark-700 leading-relaxed text-base">{product.description || 'No description available.'}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {product.origin && (
                  <div className="bg-spice-50 rounded-xl p-4">
                    <p className="text-xs text-bark-400 uppercase tracking-wide mb-1">Origin</p>
                    <p className="font-semibold text-bark-800">{product.origin}</p>
                  </div>
                )}
                {product.flavorProfile && (
                  <div className="bg-spice-50 rounded-xl p-4">
                    <p className="text-xs text-bark-400 uppercase tracking-wide mb-1">Flavor Profile</p>
                    <p className="font-semibold text-bark-800">{product.flavorProfile}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-2xl space-y-4">
              {product.reviews?.length > 0 ? product.reviews.map((review) => (
                <div key={review.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-chilli-100 rounded-full flex items-center justify-center text-chilli-600 font-bold text-sm">
                        {review.user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-bark-900 text-sm">{review.user?.name}</p>
                        <p className="text-xs text-bark-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <FiStar key={s} className={`text-sm ${s <= review.rating ? 'text-spice-400 fill-current' : 'text-bark-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-bark-700 text-sm">{review.comment}</p>
                </div>
              )) : (
                <p className="text-bark-400 text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
