import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low full-width bottom-0 mt-24 border-t border-outline-variant/30 font-sans">
      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 py-16 lg:py-24 flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="mb-8 md:mb-0">
          <Link to="/" className="font-serif text-2xl md:text-3xl text-primary font-bold tracking-tight">
            MACAW
          </Link>
          <p className="mt-4 text-sm md:text-base text-on-surface-variant max-w-xs leading-relaxed font-normal">
            Elevating culinary traditions through artisanal sourcing and purity. For the discerning kitchen.
          </p>
          <div className="mt-8 flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary text-on-surface-variant transition-colors" title="Website">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary text-on-surface-variant transition-colors" title="Contact">
              <span className="material-symbols-outlined text-[20px]">alternate_email</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:border-primary hover:text-primary text-on-surface-variant transition-colors" title="Instagram">
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24 w-full md:w-auto">
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">Explore</h5>
            <ul className="space-y-3.5 text-sm">
              <li><Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors">Shop Spices</Link></li>
              <li><Link to="/mixer" className="text-on-surface-variant hover:text-primary transition-colors">Spice Mixer</Link></li>
              <li><Link to="/about" className="text-on-surface-variant hover:text-primary transition-colors">Sustainability</Link></li>
              <li><Link to="/blog" className="text-on-surface-variant hover:text-primary transition-colors">Journal & Guides</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">Collections</h5>
            <ul className="space-y-3.5 text-sm">
              <li><Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors">Earth & Smoke</Link></li>
              <li><Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors">Citrus & Herb</Link></li>
              <li><Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors">Sweet Heat</Link></li>
              <li><Link to="/products" className="text-on-surface-variant hover:text-primary transition-colors">The Classics</Link></li>
            </ul>
          </div>
          <div className="col-span-2 lg:col-span-1 mt-4 lg:mt-0">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">Newsletter</h5>
            <p className="text-xs text-on-surface-variant mb-4">Join our culinary circle for exclusive releases and pairings.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="input px-4 py-2 text-xs bg-surface border border-outline-variant/60 rounded-lg flex-1"
              />
              <button type="submit" className="btn-primary px-4 py-2 text-xs">
                Join
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 py-8 border-t border-outline-variant/40 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span className="text-xs text-on-surface-variant">© 2024 MACAW. Sourced with integrity.</span>
        <div className="flex gap-6 text-xs">
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Terms</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors">Sourcing</a>
        </div>
      </div>
    </footer>
  );
}
