import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiSearch, FiLogOut, FiPackage, FiSettings, FiHeart } from 'react-icons/fi';
import { GiChiliPepper } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

const navLinks = [
  { label: 'Products', to: '/products' },
  { label: 'Spice Mixer', to: '/mixer' },
  { label: 'About Us', to: '/about' },
  { label: 'Blog', to: '/blog' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const items = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-glass' : 'bg-white'
    } border-b border-spice-100`}>
      <div className="section">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-chilli-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <GiChiliPepper className="text-white text-xl" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-bark-900">Spice</span>
              <span className="font-display font-bold text-xl text-chilli-600">Spice</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  location.pathname.startsWith(link.to)
                    ? 'bg-chilli-50 text-chilli-600'
                    : 'text-bark-700 hover:bg-spice-50 hover:text-chilli-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              id="navbar-search-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              className="btn-ghost p-2"
            >
              <FiSearch className="text-lg" />
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="relative btn-ghost p-2" id="navbar-wishlist-btn">
              <FiHeart className="text-xl" />
              {wishlistItems.length > 0 && (
                <motion.span
                  key={wishlistItems.length}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-spice-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                >
                  {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
                </motion.span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative btn-ghost p-2" id="navbar-cart-btn">
              <FiShoppingCart className="text-xl" />
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-chilli-600 text-white text-xs rounded-full flex items-center justify-center font-bold"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="navbar-profile-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-spice-50 transition-all"
                >
                  <div className="w-8 h-8 bg-chilli-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.[0]?.toUpperCase() || <FiUser />}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-bark-800 max-w-24 truncate">
                    {user?.name?.split(' ')[0] || 'Account'}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-glass border border-spice-100 py-2 z-50"
                    >
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-bark-700 hover:bg-spice-50 hover:text-chilli-600">
                        <FiUser className="text-base" /> My Account
                      </Link>
                      <Link to="/account?tab=orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-bark-700 hover:bg-spice-50 hover:text-chilli-600">
                        <FiPackage className="text-base" /> Orders
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-bark-700 hover:bg-spice-50 hover:text-chilli-600">
                          <FiSettings className="text-base" /> Admin
                        </Link>
                      )}
                      <hr className="my-1 border-spice-100" />
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-chilli-600 hover:bg-chilli-50 w-full text-left"
                      >
                        <FiLogOut className="text-base" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-4 text-sm" id="navbar-login-btn">
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="navbar-mobile-menu-btn"
            >
              {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleSearch}
              className="py-3 border-t border-spice-100"
            >
              <div className="flex gap-2">
                <input
                  id="navbar-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spices, blends, flavors..."
                  className="input flex-1"
                  autoFocus
                />
                <button type="submit" className="btn-primary px-4">
                  <FiSearch />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-spice-100 py-3 space-y-1"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-4 py-2.5 rounded-xl text-bark-700 hover:bg-spice-50 hover:text-chilli-600 font-medium transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
