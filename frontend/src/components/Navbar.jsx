import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

const navLinks = [
  { label: 'Shop', to: '/products' },
  { label: 'Collections', to: '/products?featured=true' },
  { label: 'Spice Mixer', to: '/mixer' },
  { label: 'Our Story', to: '/about' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (location.pathname.startsWith('/admin')) {
        if (location.pathname.includes('/orders')) {
          navigate(`/admin/orders?search=${encodeURIComponent(searchQuery)}`);
        } else {
          navigate(`/admin/products?search=${encodeURIComponent(searchQuery)}`);
        }
      } else {
        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      }
      setSearchQuery('');
    }
  };

  return (
    <nav className="docked full-width top-0 sticky z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 flex justify-between items-center h-20">
        {/* Brand Logo */}
        <Link to="/" className="font-serif text-2xl md:text-3xl text-primary tracking-tight font-bold">
          MACAW
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-8 lg:gap-10 items-center">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to || (link.to.includes('?') && location.search.includes('featured=true'));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  isActive
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4 lg:gap-6">
          <form onSubmit={handleSearch} className="hidden lg:block relative">
            <input
              id="navbar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-low border-none rounded-full px-6 py-2 w-64 text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder-outline"
              placeholder="Search spices..."
            />
            <button type="submit" className="absolute right-4 top-2 text-outline hover:text-primary transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          </form>

          {/* Wishlist */}
          <Link to="/wishlist" className="hover:opacity-80 transition-opacity flex items-center relative p-1" id="navbar-wishlist-btn" title="Wishlist">
            <span className="material-symbols-outlined text-primary text-[24px]">favorite</span>
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary text-[10px] rounded-full flex items-center justify-center font-bold">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="hover:opacity-80 transition-opacity flex items-center relative p-1" id="navbar-cart-btn" title="Shopping Cart">
            <span className="material-symbols-outlined text-primary text-[24px]">shopping_cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-on-primary text-[10px] rounded-full flex items-center justify-center font-bold">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </Link>

          {/* User Account / Auth */}
          <div className="relative">
            <button
              id="navbar-profile-btn"
              onClick={() => isAuthenticated ? setProfileOpen(!profileOpen) : navigate('/login')}
              className="hover:opacity-80 transition-opacity flex items-center p-1 cursor-pointer"
              title="Account"
            >
              <span className="material-symbols-outlined text-primary text-[24px]">person</span>
            </button>

            <AnimatePresence>
              {profileOpen && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-3 w-48 bg-surface rounded-xl shadow-lg border border-outline-variant py-2 z-50 font-sans"
                >
                  <div className="px-4 py-2 border-b border-outline-variant/40">
                    <p className="text-xs text-outline font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-on-surface truncate">{user?.name || 'Customer'}</p>
                  </div>
                  <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container hover:text-primary">
                    <span className="material-symbols-outlined text-[18px]">account_circle</span> My Account
                  </Link>
                  <Link to="/account?tab=orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container hover:text-primary">
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span> Orders
                  </Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-semibold hover:bg-surface-container">
                      <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span> Admin Panel
                    </Link>
                  )}
                  <hr className="my-1 border-outline-variant/40" />
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/20 w-full text-left font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden hover:opacity-80 transition-opacity flex items-center p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="navbar-mobile-menu-btn"
          >
            <span className="material-symbols-outlined text-primary text-[26px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-surface border-t border-outline-variant/40 px-6 py-4 space-y-3 shadow-md"
          >
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-container-low border-none rounded-full px-5 py-2.5 w-full text-sm text-on-surface focus:ring-1 focus:ring-primary placeholder-outline"
                placeholder="Search spices..."
              />
              <button type="submit" className="absolute right-4 top-2.5 text-outline">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            </form>

            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-2 font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
