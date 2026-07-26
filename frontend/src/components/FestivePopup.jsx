import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import useAuthStore from '../store/useAuthStore';
import { Link } from 'react-router-dom';

export default function FestivePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const [hasShownThisLogin, setHasShownThisLogin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Reset when user logs out so it can show again on next login
      setHasShownThisLogin(false);
      setIsOpen(false);
      return;
    }

    if (hasShownThisLogin) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasShownThisLogin(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasShownThisLogin]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Transparent Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          {/* Big Glassmorphism Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-bark-900/60 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden text-center z-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-spice-500/20 to-transparent pointer-events-none" />
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20"
            >
              <FiX className="text-xl" />
            </button>
            
            <div className="p-10 relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-spice-400 mb-2 block">
                Exclusive Welcome Benefit
              </span>
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4 drop-shadow-lg">
                Welcome Offer <br /> <span className="text-spice-400">10% OFF</span>
              </h2>
              <p className="text-sm sm:text-base text-white/90 mb-8 font-medium drop-shadow-md max-w-md mx-auto">
                Enjoy 10% OFF on your first order of estate-fresh spices and custom botanical blends. Single use per account.
              </p>
              
              <div className="bg-black/40 backdrop-blur-md rounded-2xl py-4 px-6 inline-block mb-8 border border-white/20 shadow-inner">
                <p className="text-xs text-white/70 uppercase tracking-widest mb-1 font-bold">Use Promo Code</p>
                <p className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-spice-400 drop-shadow-md">WELCOME10</p>
              </div>

              <div className="flex justify-center">
                <Link
                  to="/products"
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-4 bg-chilli-600 hover:bg-chilli-500 text-white rounded-xl font-bold text-base shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
                >
                  Explore Catalog
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
