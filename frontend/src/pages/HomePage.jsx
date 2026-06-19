import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiArrowRight, FiStar, FiPackage, FiShield, FiTruck } from 'react-icons/fi';
import { GiSpoon, GiMortar } from 'react-icons/gi';
import { productAPI, blendAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const features = [
  { icon: <GiMortar className="text-2xl" />, title: 'Custom Mixing', desc: 'Create your perfect spice blend from our preset templates' },
  { icon: <FiShield className="text-2xl" />, title: '100% Authentic', desc: 'Directly sourced from farms across India' },
  { icon: <FiTruck className="text-2xl" />, title: 'Fast Delivery', desc: 'Pan-India delivery in 3-5 business days' },
  { icon: <FiPackage className="text-2xl" />, title: 'Fresh Sealed', desc: 'Vacuum-sealed to preserve freshness and aroma' },
];

const testimonials = [
  { name: 'Priya Sharma', location: 'Mumbai', text: 'The Kashmiri chilli is absolutely stunning. The color it gives to dishes is unreal!', rating: 5 },
  { name: 'Rahul Verma', location: 'Delhi', text: 'Ordered the Biryani masala blend and my family couldn\'t believe I made it at home.', rating: 5 },
  { name: 'Anjali Nair', location: 'Bangalore', text: 'Best quality turmeric I\'ve ever used. You can smell the difference immediately.', rating: 5 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function HomePage() {
  const { data: productsData } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => productAPI.getAll({ featured: 'true', limit: 4 })
  });

  const { data: blendsData } = useQuery({
    queryKey: ['blend-templates'],
    queryFn: () => blendAPI.getAll()
  });

  const featuredProducts = productsData?.data?.products || [];
  const blends = blendsData?.data?.blends?.slice(0, 3) || [];

  return (
    <div className="overflow-x-hidden">
      {/* =================== HERO =================== */}
      <section className="relative min-h-[90vh] flex items-center bg-spice-gradient overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-hero-pattern opacity-30" />
        
        {/* Floating spice circles */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-chilli-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-spice-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="section relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="text-white"
            >


              <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight mb-6">
                The Art of{' '}
                <span className="text-spice-400">Authentic</span>
                <br />Indian Spices
              </h1>

              <p className="text-spice-200 text-lg leading-relaxed mb-8 max-w-md">
                Discover premium spices sourced directly from India's finest farms. 
                Mix your own custom blends or choose from our expert curated recipes.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="btn-gold px-8 py-4 text-base" id="hero-shop-btn">
                  Shop Now <FiArrowRight />
                </Link>
                <Link to="/mixer" className="flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-xl transition-all duration-200 text-base" id="hero-mixer-btn">
                  <GiMortar /> Try Spice Mixer
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
                {[
                  { value: '50+', label: 'Spice Varieties' },
                  { value: '15+', label: 'Blend Templates' },
                  { value: '10K+', label: 'Happy Customers' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold text-spice-400">{stat.value}</div>
                    <div className="text-spice-300 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Hero Product Stack */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative w-96 h-96">
                {/* Floating product images */}
                <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-0 right-0 w-44 h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img src="https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400" alt="Turmeric" loading="lazy" className="w-full h-full object-cover" />
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute bottom-16 left-0 w-52 h-52 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400" alt="Spices" loading="lazy" className="w-full h-full object-cover" />
                </motion.div>
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute top-28 left-24 w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <img src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" alt="Blend" loading="lazy" className="w-full h-full object-cover" />
                </motion.div>

                {/* Overlay card */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                  className="absolute bottom-0 right-0 glass rounded-2xl p-4 shadow-glass"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => <FiStar key={s} className="text-spice-400 fill-current text-sm" />)}
                    </div>
                    <span className="text-sm font-semibold text-bark-800">4.9/5</span>
                  </div>
                  <p className="text-xs text-bark-600 mt-1">From 10,000+ reviews</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* =================== FEATURES =================== */}
      <section className="py-16 bg-white">
        <div className="section">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemVariants} className="text-center p-6">
                <div className="w-14 h-14 bg-chilli-50 text-chilli-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-bark-900 mb-2">{f.title}</h3>
                <p className="text-sm text-bark-500">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* =================== FEATURED PRODUCTS =================== */}
      <section className="py-20 bg-spice-50">
        <div className="section">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-chilli-600 font-semibold text-sm uppercase tracking-widest mb-2">Fresh Arrivals</p>
              <h2 className="font-display text-4xl font-bold text-bark-900">Featured Spices</h2>
            </div>
            <Link to="/products" className="btn-secondary text-sm hidden md:flex" id="homepage-view-all-btn">
              View All <FiArrowRight />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // Skeleton loading
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-spice-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-spice-100 rounded w-1/2" />
                    <div className="h-5 bg-spice-100 rounded w-3/4" />
                    <div className="h-4 bg-spice-100 rounded w-full" />
                    <div className="h-10 bg-spice-100 rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to="/products" className="btn-secondary" id="homepage-view-all-mobile-btn">
              View All Spices <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* =================== SPICE MIXER PROMO =================== */}
      <section className="py-20 bg-white">
        <div className="section">
          <div className="bg-spice-gradient rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-hero-pattern opacity-20" />
            <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center gap-8">
              <div className="text-white flex-1">
                <p className="text-spice-400 font-semibold text-sm uppercase tracking-widest mb-3">Custom Experience</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Build Your Perfect Spice Blend</h2>
                <p className="text-spice-200 text-lg mb-8 max-w-md">
                  Choose from our expertly crafted blend templates — Garam Masala, Biryani Masala, Kerala Blend and more. 
                  Each perfectly balanced for authentic flavors.
                </p>
                <Link to="/mixer" className="btn-gold px-8 py-4 text-base inline-flex" id="homepage-mixer-cta-btn">
                  <GiMortar /> Open Spice Mixer
                </Link>
              </div>
              <div className="flex gap-4 shrink-0">
                {blends.slice(0, 2).map((blend) => (
                  <motion.div
                    key={blend.id}
                    whileHover={{ scale: 1.03 }}
                    className="w-40 glass rounded-2xl overflow-hidden shadow-xl hidden md:block"
                  >
                    <img
                      src={blend.imageUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300'}
                      alt={blend.name}
                      loading="lazy"
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="text-bark-900 font-semibold text-sm line-clamp-1">{blend.name}</p>
                      <p className="text-bark-600 text-xs mt-0.5">
                        {blend.items?.length} spices · ₹{blend.estimatedPrice?.toFixed(0)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== TESTIMONIALS =================== */}
      <section className="py-20 bg-spice-50">
        <div className="section">
          <div className="text-center mb-12">
            <p className="text-chilli-600 font-semibold text-sm uppercase tracking-widest mb-2">Reviews</p>
            <h2 className="font-display text-4xl font-bold text-bark-900">Loved by Home Chefs</h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={itemVariants} className="card p-6">
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <FiStar key={i} className="text-spice-400 fill-current text-base" />
                  ))}
                </div>
                <p className="text-bark-700 italic mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-chilli-100 rounded-full flex items-center justify-center text-chilli-600 font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-bark-900 text-sm">{t.name}</p>
                    <p className="text-bark-400 text-xs">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
