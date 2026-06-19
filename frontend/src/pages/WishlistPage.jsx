import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useWishlistStore from '../store/useWishlistStore';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="py-12 section">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-bark-900 flex items-center gap-3">
            <FiHeart className="text-chilli-600" />
            My Wishlist
          </h1>
          <p className="text-bark-500 mt-2">Items you've saved for later</p>
        </div>
        {items.length > 0 && (
          <button 
            onClick={clearWishlist}
            className="text-sm text-bark-400 hover:text-chilli-600 font-medium transition-colors"
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-white rounded-3xl shadow-glass border border-spice-100"
        >
          <div className="w-20 h-20 bg-spice-50 rounded-full flex items-center justify-center mx-auto mb-6 text-spice-300">
            <FiHeart className="text-4xl" />
          </div>
          <h2 className="text-2xl font-display font-bold text-bark-900 mb-2">Your wishlist is empty</h2>
          <p className="text-bark-500 mb-8 max-w-md mx-auto">
            You haven't saved any spices yet. Explore our collection and find your new favorite flavors!
          </p>
          <Link to="/products" className="btn-primary">
            <FiShoppingBag />
            Browse Products
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
