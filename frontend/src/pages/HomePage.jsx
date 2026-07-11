import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { productAPI, blendAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import ScaleReveal from '../components/ScaleReveal';
import { FiCheck, FiX } from 'react-icons/fi';

// ── Reveal hook (Zepmeusel-style clip-path reveal on scroll) ──────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-text').forEach((el) => {
              el.classList.add('revealed');
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

// ── Marquee Strip ────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Premium Whole Spices', '✦', 'Authentic Indian Flavor', '✦', 'Naturally Rich Aroma',
  '✦', 'Carefully Handpicked Ingredients', '✦', 'Freshness Sealed in Every Pack', '✦',
  'Hygienically Processed & Packed', '✦', 'Pure Taste, Exceptional Quality', '✦',
  'Premium Whole Spices', '✦', 'Authentic Indian Flavor', '✦', 'Naturally Rich Aroma',
  '✦', 'Carefully Handpicked Ingredients', '✦', 'Freshness Sealed in Every Pack', '✦',
  'Hygienically Processed & Packed', '✦', 'Pure Taste, Exceptional Quality', '✦',
];

function MarqueeStrip({ reverse = false }) {
  return (
    <div className="overflow-hidden py-4 bg-primary text-on-primary select-none" aria-hidden>
      <div className={`marquee-track ${reverse ? '[animation-direction:reverse]' : ''}`}>
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} className="text-xs font-bold uppercase tracking-[0.2em] px-6 opacity-90">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Parallax image wrapper ───────────────────────────────────────────────
function ParallaxImage({ src, alt, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  return (
    <div ref={ref} className="overflow-hidden h-full w-full">
      <motion.img
        src={src} alt={alt} loading="lazy"
        style={{ y, scale: 1.16 }}
        className={className}
      />
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const featuredRef = useReveal();
  const bentoRef = useReveal();
  const mixerRef = useReveal();

  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroImgY = useTransform(heroScroll, [0, 1], ['0%', '20%']);

  const bannerRef = useRef(null);
  const { scrollYProgress: bannerScroll } = useScroll({ target: bannerRef, offset: ['start end', 'end start'] });
  const bannerOpacity = useTransform(bannerScroll, [0, 0.22, 0.78, 1], [0, 1, 1, 0]);
  const bannerTextY = useTransform(bannerScroll, [0, 0.22, 0.78, 1], [36, 0, 0, -36]);

  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productAPI.getAll({ featured: 'true', limit: 4 })
  });

  const { data: blendsData } = useQuery({
    queryKey: ['blend-templates'],
    queryFn: () => blendAPI.getAll()
  });

  const featuredProducts = productsData?.data?.products || [];
  const blends = blendsData?.data?.blends?.slice(0, 2) || [];

  return (
    <div className="overflow-x-hidden font-sans bg-surface text-on-surface">

      {/* =================== HERO SECTION =================== */}
      <section ref={heroRef} className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 border-b border-outline-variant/30 overflow-hidden grain-overlay">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Typography & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-xs uppercase tracking-[0.2em] font-bold text-outline mb-4"
              >
                Pure Taste, Powerful Aroma
              </motion.span>

              {/* Staggered clip-path headline */}
              <div className="overflow-hidden mb-2">
                <motion.h1
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold text-primary tracking-tight leading-[1.05]"
                >
                  Premium Whole
                </motion.h1>
              </div>
              <div className="overflow-hidden mb-6">
                <motion.h1
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold text-primary tracking-tight leading-[1.05]"
                >
                  Spices.
                </motion.h1>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed mb-10"
              >
                Crafted to bring authentic Indian flavor, natural freshness, and rich aroma into every kitchen.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap items-center gap-4"
              >
                <Link to="/products" className="btn-primary px-8 py-4 text-xs tracking-[0.15em]">
                  Explore Collection
                </Link>
                <Link to="/mixer" className="btn-secondary px-8 py-4 text-xs tracking-[0.15em]">
                  Custom Spice Mixer
                </Link>
              </motion.div>

              {/* Minimalist Stats — count-in animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.75 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-outline-variant/40 w-full max-w-lg"
              >
                {[
                  { icon: '🌿', label: '100% Natural' },
                  { icon: '🤲', label: 'Handpicked Spices' },
                  { icon: '✨', label: 'Rich Aroma' },
                  { icon: '📦', label: 'Hygienically Packed' },
                ].map(({ icon, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                    className="flex flex-col items-start gap-1.5"
                  >
                    <span className="text-2xl">{icon}</span>
                    <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider leading-tight">{label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right — Scale-on-scroll Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <ScaleReveal
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"
                alt="MACAW Artisanal Spices"
                className="aspect-[4/5] shadow-xl border border-outline-variant/40"
                initialScale={0.78}
                rounded="rounded-2xl"
              >
                {/* Floating accent */}
                <div className="absolute -bottom-10 -left-10 w-64 h-64 opacity-20 pointer-events-none rotate-12 text-primary float-animate">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M45,-77.4C58.3,-69.3,69.2,-57,76.5,-43.3C83.9,-29.6,87.6,-14.8,87.6,0C87.6,14.8,83.9,29.6,76.5,43.3C69.2,57,58.3,69.3,45,77.4C31.7,85.5,15.8,89.5,0,89.5C-15.8,89.5,-31.7,85.5,-45,77.4C-58.3,69.3,-69.2,57,-76.5,43.3C-83.9,29.6,-87.6,14.8,-87.6,0C-87.6,-14.8,-83.9,-29.6,-76.5,-43.3C-69.2,-57,-58.3,-69.3,-45,-77.4C-31.7,-85.5,-15.8,-89.5,0,-89.5C15.8,-89.5,31.7,-85.5,45,-77.4Z" fill="currentColor" transform="translate(100 100)" />
                  </svg>
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-6 bg-surface/90 backdrop-blur rounded-xl border border-outline-variant/30">
                  <p className="font-serif text-xl font-bold text-primary">Harvest Reserve</p>
                  <p className="text-xs text-on-surface-variant mt-1">First-flush Malabar black pepper &amp; Lakadong turmeric.</p>
                </div>
              </ScaleReveal>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =================== MARQUEE TICKER =================== */}
      <MarqueeStrip />

      {/* =================== PRODUCT BANNER (Full-width scale reveal) =================== */}
      <section ref={featuredRef} className="bg-surface overflow-hidden relative z-20">

        {/* Full-width horizontal image with scroll fade + scale */}
        <motion.div
          ref={bannerRef}
          style={{ opacity: bannerOpacity }}
          className="relative w-full h-[55vh] sm:h-[65vh] lg:h-[78vh] overflow-hidden z-30 shadow-2xl bg-black"
        >
          <ScaleReveal
            src="/images/macaw_product_banner.png"
            alt="MACAW Artisan Whole Blend — Khada Garam Masala"
            className="absolute inset-0 w-full h-full z-10"
            imgClassName="w-full h-full object-cover object-center"
            initialScale={0.68}
            rounded="rounded-none"
          />

          {/* Dark gradient overlays left + bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none z-20" />

          {/* Overlaid text — left-aligned editorial layout with scroll parallax drift */}
          <motion.div
            style={{ y: bannerTextY }}
            className="absolute inset-0 flex flex-col justify-end pb-12 lg:pb-16 px-8 sm:px-12 lg:px-20 max-w-3xl z-30"
          >
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs font-bold uppercase tracking-[0.3em] text-primary-fixed/90 mb-3 block drop-shadow-md"
            >
              Curated Harvest Reserve
            </motion.span>

            <div className="overflow-hidden mb-3">
              <motion.h2
                initial={{ y: '110%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg"
              >
                Featured Harvest
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-white/90 leading-relaxed mb-8 max-w-lg font-normal drop-shadow"
            >
              Single-origin whole spices, micro-milled to order. Each jar sealed within 24 hours of grinding.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-4 items-center"
            >
              <Link to="/products" className="btn-primary px-8 py-4 text-xs tracking-[0.15em] shadow-xl">
                Shop Collection
              </Link>
              <Link to="/products" className="text-white/90 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:text-white transition-colors drop-shadow">
                View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Product grid below the banner */}
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 py-16 relative z-10">
          {isProductsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="space-y-4">
                  <div className="aspect-[3/4] bg-surface-container-high rounded-xl" />
                  <div className="h-6 bg-surface-container-high rounded w-3/4" />
                  <div className="h-4 bg-surface-container-high rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.65, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =================== MARQUEE (Reversed) =================== */}
      <MarqueeStrip reverse />

      {/* =================== CULINARY EXPRESSIONS (BENTO) =================== */}
      <section ref={bentoRef} className="bg-surface-container-low py-24 border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">
          <div className="mb-16">
            <h2 className="reveal-text font-serif text-3xl sm:text-4xl text-primary font-bold mb-4" data-delay="1">Culinary Expressions</h2>
            <p className="reveal-text text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed font-normal" data-delay="2">
              Discover how to unlock deep, smoldering warmth and aromatic complexity with MACAW signature selections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tip 1 */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface p-10 rounded-xl flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-500 border border-outline-variant/40 shadow-sm"
            >
              <div>
                <span className="material-symbols-outlined text-primary text-[40px] mb-6 block group-hover:scale-110 transition-transform duration-300">outdoor_grill</span>
                <h3 className="font-serif text-2xl font-semibold mb-4 text-on-surface">The Perfect Rub</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Combine with brown sugar, sea salt, and garlic powder for a competition-grade BBQ rub that caramelizes beautifully.
                </p>
              </div>
              <Link to="/blog" className="mt-8 text-xs font-bold uppercase tracking-widest text-primary inline-flex items-center gap-2 group-hover:underline underline-offset-4">
                Read Guide <span className="material-symbols-outlined text-[16px]">north_east</span>
              </Link>
            </motion.div>

            {/* Tip 2 - Featured Large — ScaleReveal */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-2 h-[400px] border border-outline-variant/40 shadow-sm relative"
            >
              <ScaleReveal
                src="https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800"
                alt="Authentic Paella"
                className="absolute inset-0"
                imgClassName="w-full h-full object-cover"
                initialScale={0.75}
                rounded="rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-xl pointer-events-none" />
              <div className="absolute bottom-10 left-10 text-white max-w-md z-10">
                <h3 className="font-serif text-3xl font-bold mb-2">Authentic Paella &amp; Biryani</h3>
                <p className="text-sm opacity-90 leading-relaxed font-normal">
                  Unlock the secret of traditional rice dishes by blooming whole spices and saffron in warm ghee before adding your broth.
                </p>
              </div>
            </motion.div>

            {/* Tip 3 - Large — ScaleReveal */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-2 h-[400px] border border-outline-variant/40 shadow-sm relative"
            >
              <ScaleReveal
                src="https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800"
                alt="Finishing Touch"
                className="absolute inset-0"
                imgClassName="w-full h-full object-cover"
                initialScale={0.75}
                rounded="rounded-xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-xl pointer-events-none" />
              <div className="absolute bottom-10 left-10 text-white max-w-md z-10">
                <h3 className="font-serif text-3xl font-bold mb-2">The Finishing Touch</h3>
                <p className="text-sm opacity-90 leading-relaxed font-normal">
                  Dust freshly ground spices over velvety soups, roasted tubers, or artisanal hummus just before serving for dramatic visual appeal.
                </p>
              </div>
            </motion.div>

            {/* Tip 4 - Pro Tip */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-primary p-10 rounded-xl text-on-primary flex flex-col justify-center shadow-md"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-bold opacity-70 mb-4 block">Master Class Tip</span>
              <p className="font-serif text-xl md:text-2xl italic leading-relaxed">
                "Ground spices release their volatile oils instantly. Always toast whole spices gently in dry heat to unlock their true depth."
              </p>
              <p className="mt-6 text-xs font-bold uppercase tracking-widest opacity-90">— Master Blender Haaris</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =================== COMPARISON SECTION =================== */}
      <section ref={mixerRef} className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="reveal-text font-serif text-4xl lg:text-5xl font-bold text-primary mb-4" data-delay="1">
              MACAW Spices vs Ordinary Spices
            </h2>
            <p className="reveal-text text-base sm:text-lg text-on-surface-variant leading-relaxed" data-delay="2">
              Experience the difference of premium quality, authentic aroma, and carefully selected whole spices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* MACAW Spices Card */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-chilli-900 rounded-2xl p-8 sm:p-10 border border-primary/40 shadow-xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-8">
                  MACAW Spices
                </h3>
                <ul className="space-y-6">
                  {[
                    'Strong Natural Aroma',
                    'Premium Handpicked Quality',
                    'Rich Natural Oils & Freshness',
                    'Elegant Hygienic Packaging',
                    'No Artificial Fillers',
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-white text-base sm:text-lg font-medium">
                      <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm border border-chilli-400">
                        <FiCheck className="w-4 h-4 stroke-[3]" />
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Ordinary Spices Card */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface-container rounded-2xl p-8 sm:p-10 border border-outline-variant/30 shadow-lg flex flex-col justify-between"
            >
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-on-surface mb-8">
                  Ordinary Spices
                </h3>
                <ul className="space-y-6">
                  {[
                    'Weak Aroma After Storage',
                    'Mixed or Low Quality Selection',
                    'Less Freshness & Flavor',
                    'Basic Packaging Quality',
                    'May Contain Additives',
                  ].map((text, idx) => (
                    <li key={idx} className="flex items-center gap-4 text-on-surface-variant text-base sm:text-lg">
                      <span className="w-7 h-7 rounded-full bg-outline-variant/50 text-outline flex items-center justify-center shrink-0">
                        <FiX className="w-4 h-4 stroke-[2.5]" />
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
