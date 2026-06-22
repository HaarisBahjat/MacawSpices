import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiShoppingCart, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

const DEFAULT_GRAMS = 50;

export default function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const [selectedWeight, setSelectedWeight] = useState(product.minOrderGram || DEFAULT_GRAMS);
  
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem({ productId: product.id, quantity: selectedWeight, type: 'product' });
  };

  const avgRating = product.avgRating || 0;
  const reviewCount = product._count?.reviews || 0;
  const price = product.pricePerGram;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group card-hover flex flex-col"
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden aspect-square bg-spice-50">
          <img
            src={product.images?.[0] || `https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400`}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.featured && (
            <span className="absolute top-3 left-3 badge-gold">Featured</span>
          )}
          {product.stock < 200 && (
            <span className="absolute top-3 right-3 badge-red">Low Stock</span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product);
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-bark-400 hover:text-chilli-600 hover:scale-110 transition-all shadow-sm z-10"
            style={{ right: product.stock < 200 ? '5rem' : '0.75rem' }}
          >
            <FiHeart className={`text-lg ${isWishlisted ? 'fill-chilli-600 text-chilli-600' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {product.category && (
            <span className="text-xs text-spice-600 font-semibold uppercase tracking-wide">
              {product.category.name}
            </span>
          )}

          <h3 className="font-display font-semibold text-bark-900 text-lg leading-tight group-hover:text-chilli-600 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.flavorProfile && (
            <p className="text-xs text-bark-500">{product.flavorProfile}</p>
          )}

          {product.origin && (
            <p className="text-xs text-bark-400">📍 {product.origin}</p>
          )}

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`text-sm ${star <= Math.round(avgRating) ? 'text-spice-400 fill-current' : 'text-bark-200'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-bark-500">({reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-2 flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-bark-900">₹{price.toFixed(2)}</span>
              <span className="text-xs text-bark-400 ml-1">/gram</span>
              <p className="text-xs text-bark-500 mt-0.5">
                Min. {product.minOrderGram}g — ₹{(price * product.minOrderGram).toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Add to Cart */}
      <div className="px-4 pb-4 flex flex-col xl:flex-row gap-2" onClick={(e) => e.preventDefault()}>
        <select
          value={selectedWeight}
          onChange={(e) => setSelectedWeight(Number(e.target.value))}
          className="bg-spice-50 text-bark-800 text-sm font-semibold rounded-xl px-2 py-2 outline-none cursor-pointer border border-spice-200 hover:border-chilli-300 transition-colors text-center xl:text-left"
        >
          {[50, 150, 250].map((w) => (
            <option key={w} value={w}>{w}g</option>
          ))}
        </select>
        <button
          id={`add-to-cart-${product.slug}`}
          onClick={handleAddToCart}
          className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
        >
          <FiShoppingCart />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
