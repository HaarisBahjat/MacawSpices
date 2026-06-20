import React from 'react';
import { Link } from 'react-router-dom';
import { GiChiliPepper } from 'react-icons/gi';
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-bark-900 text-spice-100 mt-20">
      <div className="section py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-chilli-600 rounded-xl flex items-center justify-center">
                <GiChiliPepper className="text-white text-xl" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white">Spice</span>
                <span className="font-display font-bold text-xl text-chilli-400">Spice</span>
              </div>
            </div>
            <p className="text-spice-300 text-sm leading-relaxed">
              Bringing authentic Indian spices from the source to your kitchen. Farm-fresh, premium quality.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-bark-700 rounded-lg flex items-center justify-center text-spice-300 hover:bg-chilli-600 hover:text-white transition-all">
                <FiInstagram />
              </a>
              <a href="#" className="w-9 h-9 bg-bark-700 rounded-lg flex items-center justify-center text-spice-300 hover:bg-chilli-600 hover:text-white transition-all">
                <FiTwitter />
              </a>
              <a href="#" className="w-9 h-9 bg-bark-700 rounded-lg flex items-center justify-center text-spice-300 hover:bg-chilli-600 hover:text-white transition-all">
                <FiFacebook />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              {['All Products', 'Whole Spices', 'Ground Spices', 'Spice Blends', 'Spice Mixer'].map((item) => (
                <li key={item}>
                  <Link to="/products" className="text-spice-300 hover:text-spice-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              {['About Us', 'Our Farms', 'Sustainability', 'Careers', 'Blog'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-spice-300 hover:text-spice-400 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-spice-300">
                <FiMail className="text-chilli-400 shrink-0" />
                hello@macawspice.in
              </li>
              <li className="flex items-center gap-2 text-spice-300">
                <FiPhone className="text-chilli-400 shrink-0" />
                +91 98765 43210
              </li>
            </ul>
            <div className="mt-4 p-3 bg-bark-800 rounded-xl">
              <p className="text-xs text-spice-400 mb-2">Subscribe for recipes & offers</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-3 py-2 bg-bark-700 rounded-lg text-sm text-white placeholder-spice-500 focus:outline-none focus:ring-1 focus:ring-chilli-500"
                />
                <button className="px-3 py-2 bg-chilli-600 text-white rounded-lg text-sm font-medium hover:bg-chilli-700 transition-colors">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-bark-700 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-spice-500">
          <p>© 2024 MacawSpice. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-spice-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-spice-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-spice-400 transition-colors">Refund Policy</a>
          </div>
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Razorpay_logo.png/220px-Razorpay_logo.png" alt="Razorpay" className="h-5 opacity-60" />
          </div>
        </div>
      </div>
    </footer>
  );
}
