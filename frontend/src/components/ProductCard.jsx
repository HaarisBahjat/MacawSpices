import React from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

export default function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  
  const isWishlisted = isInWishlist(product.id);
  const price = product.pricePerGram ? (product.pricePerGram * (product.minOrderGram || 50)) : (product.price || 18);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productId: product.id, quantity: product.minOrderGram || 50, type: 'product' });
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="group font-sans">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="aspect-[3/4] bg-surface-container-low rounded-xl mb-5 overflow-hidden relative border border-outline-variant/40">
          <img
            src={product.images?.[0] || '/images/spices/black_pepper.png'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {product.featured && (
            <span className="absolute top-3 left-3 bg-secondary-container text-on-secondary-container text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded">
              Featured
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2 bg-surface/80 backdrop-blur rounded-full text-on-surface-variant hover:text-error transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
            title="Add to wishlist"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isWishlisted ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 300" }}>
              favorite
            </span>
          </button>

          {/* Add to Cart Overlay Button */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-4 right-4 bg-surface/95 backdrop-blur text-primary p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-md hover:scale-110 z-10 cursor-pointer flex items-center justify-center"
            title="Quick Add"
          >
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
          </button>
        </div>

        <div className="flex justify-between items-start gap-2">
          <div>
            {product.category?.name && (
              <p className="text-[10px] uppercase tracking-wider text-outline font-semibold mb-1">
                {product.category.name}
              </p>
            )}
            <h4 className="font-serif text-lg font-semibold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h4>
            {product.flavorProfile && (
              <p className="text-xs text-on-surface-variant/80 mt-0.5 line-clamp-1">
                {product.flavorProfile}
              </p>
            )}
          </div>
          <p className="font-sans text-sm font-bold text-primary shrink-0 mt-1">
            ₹{price.toFixed(0)}
          </p>
        </div>
      </Link>
    </div>
  );
}
