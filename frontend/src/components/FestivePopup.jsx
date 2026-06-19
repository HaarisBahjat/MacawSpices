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
              <h2 className="text-5xl font-display font-bold text-white mb-4 drop-shadow-lg">
                Festive Season <br /> <span className="text-spice-400">Special!</span>
              </h2>
              <p className="text-lg text-white/90 mb-8 font-medium drop-shadow-md">
                Get an exclusive 20% OFF on all premium spices and custom blends. Let the aroma of joy fill your home!
              </p>
              
              <div className="bg-black/30 backdrop-blur-sm rounded-xl py-4 px-6 inline-block mb-8 border border-white/10 shadow-inner">
                <p className="text-sm text-white/80 uppercase tracking-widest mb-1">Use Code</p>
                <p className="text-4xl font-bold tracking-widest text-spice-400 drop-shadow-md">FESTIVE20</p>
              </div>

              <div className="flex justify-center">
                <Link
                  to="/products"
                  onClick={() => setIsOpen(false)}
                  className="px-8 py-4 bg-chilli-600 hover:bg-chilli-500 text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-105"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
