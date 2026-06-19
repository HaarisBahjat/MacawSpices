import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiGlobe, FiSun, FiShield } from 'react-icons/fi';
import { GiChiliPepper } from 'react-icons/gi';

const AboutPage = () => {
  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="static lg:sticky lg:top-16 z-10 relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-bark-900">
        <div className="absolute inset-0 bg-bark-900 z-0">
          <img 
            src="/images/about/spice_heritage.png" 
            alt="Spice Heritage Market" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bark-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16 md:mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 md:mb-6 leading-tight">
              A Legacy of <br /> <span className="text-spice-400">Pure Authenticity</span>
            </h1>
            <p className="text-xl md:text-2xl text-bark-200 max-w-3xl mx-auto leading-relaxed">
              We travel the ancient trade routes to bring you the world's most premium, ethically-sourced spices. No middle-men, no compromises. Just the true essence of flavor.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Philosophy Section */}
      <section className="static lg:sticky lg:top-16 z-20 py-16 md:py-24 section bg-cream lg:min-h-[80vh] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto scrollbar-hide flex flex-col justify-center rounded-t-[2rem] md:rounded-t-[3rem] border-t border-spice-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-display font-bold text-bark-900 mb-6 md:mb-8"
          >
            Our Philosophy
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6 text-lg text-bark-700 leading-relaxed font-medium"
          >
            <p>
              At SpiceWallah, we believe that cooking is an act of love, and the ingredients you use should be worthy of that sentiment. For too long, the spice industry has been clouded by long supply chains, excessive processing, and faded flavors sitting on supermarket shelves for years.
            </p>
            <p>
              We exist to change that. We see spices not just as ingredients, but as living, breathing histories. Every pinch of saffron, every crack of black pepper carries the soil, the sun, and the soul of the region it was grown in. Our mission is to preserve that soul from the farm directly to your kitchen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Sourcing Section */}
      <section className="static lg:sticky lg:top-16 z-30 py-16 md:py-24 bg-white relative lg:min-h-[80vh] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto scrollbar-hide flex flex-col justify-center rounded-t-[2rem] md:rounded-t-[3rem] border-t border-spice-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="section">
          <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 relative w-full px-4 md:px-0"
            >
              <div className="absolute inset-0 bg-spice-500/10 rounded-[2rem] md:rounded-[3rem] transform -rotate-3 scale-105"></div>
              <img 
                src="/images/about/spice_sourcing.png" 
                alt="Careful hand picking of saffron" 
                className="relative z-10 w-full h-[300px] md:h-[500px] lg:h-[600px] object-cover rounded-[2rem] md:rounded-[3rem] shadow-2xl"
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 space-y-8"
            >
              <div>
                <h3 className="text-sm font-bold text-chilli-600 tracking-widest uppercase mb-3">Direct Trade</h3>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-bark-900 mb-6">Meticulously Sourced, Hand-Selected.</h2>
                <div className="w-20 h-1.5 bg-spice-500 rounded-full"></div>
              </div>
              
              <div className="space-y-6 text-bark-700 text-lg leading-relaxed">
                <p>
                  True premium quality cannot be mass-produced. It requires patience, respect for the earth, and direct relationships with the farmers who have been cultivating these lands for generations.
                </p>
                <p>
                  We bypass the traditional commodity markets entirely. Instead, our founders personally travel to remote regions—from the high altitudes of Kashmir for our Saffron, to the lush backwaters of Kerala for our Black Pepper. We shake hands with the farmers, inspect the harvests ourselves, and pay premium prices for premium yields.
                </p>
                <p>
                  This direct-trade model ensures two things: the farmers receive a truly fair, living wage, and you receive spices that are harvested at their absolute peak and shipped immediately, retaining their volatile essential oils.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-spice-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-spice-50 text-spice-600 flex items-center justify-center shrink-0">
                    <FiGlobe className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-bark-900">Single Origin</h4>
                    <p className="text-sm text-bark-500">Never blended with inferior crops.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-chilli-50 text-chilli-600 flex items-center justify-center shrink-0">
                    <FiSun className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-bold text-bark-900">Sun Dried</h4>
                    <p className="text-sm text-bark-500">Traditional, slow drying methods.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quality Standards */}
      <section className="static lg:sticky lg:top-16 z-40 py-16 md:py-24 bg-bark-900 text-white relative overflow-hidden lg:min-h-[80vh] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto scrollbar-hide flex flex-col justify-center rounded-t-[2rem] md:rounded-t-[3rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-chilli-600/20 rounded-full blur-[80px] md:blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-spice-500/20 rounded-full blur-[80px] md:blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="section relative z-10 px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 md:mb-6">The SpiceWallah Standard</h2>
            <p className="text-bark-300 text-lg">
              We evaluate our spices on three uncompromising pillars of quality. If a harvest doesn't meet all three, we simply don't buy it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-bark-800/50 backdrop-blur-sm p-8 rounded-3xl border border-bark-700 hover:bg-bark-800 transition-colors"
            >
              <div className="w-14 h-14 bg-spice-500/20 text-spice-400 rounded-2xl flex items-center justify-center mb-6">
                <FiAward className="text-2xl" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Volatile Oil Content</h3>
              <p className="text-bark-300 leading-relaxed">
                The aroma and flavor of a spice live entirely in its essential oils. We test every batch to ensure it contains the highest possible volatile oil percentage, guaranteeing a potent flavor where a little goes a very long way.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-bark-800/50 backdrop-blur-sm p-8 rounded-3xl border border-bark-700 hover:bg-bark-800 transition-colors"
            >
              <div className="w-14 h-14 bg-chilli-500/20 text-chilli-400 rounded-2xl flex items-center justify-center mb-6">
                <FiShield className="text-2xl" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Purity & Integrity</h3>
              <p className="text-bark-300 leading-relaxed">
                Adulteration is rampant in the spice world—from brick dust in paprika to dyed corn silk sold as saffron. We independently lab test all our imports for heavy metals, pesticides, and absolute purity. 
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-bark-800/50 backdrop-blur-sm p-8 rounded-3xl border border-bark-700 hover:bg-bark-800 transition-colors"
            >
              <div className="w-14 h-14 bg-mint-500/20 text-mint-400 rounded-2xl flex items-center justify-center mb-6">
                <FiSun className="text-2xl" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">Freshness Lifecycle</h3>
              <p className="text-bark-300 leading-relaxed">
                Spices are agricultural products; they expire. We grind our blends in small, micro-batches right before shipping, rather than letting them sit in warehouses for years, ensuring peak freshness upon arrival.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="static lg:sticky lg:top-16 z-50 py-16 md:py-24 section text-center bg-cream lg:min-h-[80vh] lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto scrollbar-hide flex flex-col justify-center rounded-t-[2rem] md:rounded-t-[3rem] border-t border-spice-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white p-8 md:p-12 lg:p-20 rounded-[2rem] md:rounded-[3rem] shadow-glass border border-spice-100 max-w-4xl mx-auto mx-4 md:mx-auto"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-bark-900 mb-4 md:mb-6">Experience the Difference</h2>
          <p className="text-base md:text-lg text-bark-600 mb-8 md:mb-10 max-w-2xl mx-auto">
            Once you experience the vibrant color, the intoxicating aroma, and the deep, complex flavors of truly fresh, premium spices, you will never look back.
          </p>
          <a href="/products" className="btn-primary text-lg px-8 py-4">
            Explore Our Collection
          </a>
        </motion.div>
      </section>
    </div>
  );
};

export default AboutPage;
