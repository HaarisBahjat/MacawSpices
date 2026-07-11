import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import ScaleReveal from '../components/ScaleReveal';

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-text').forEach((el) => el.classList.add('revealed'));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function ParallaxImage({ src, alt, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  return (
    <div ref={ref} className="overflow-hidden h-full w-full">
      <motion.img src={src} alt={alt} loading="lazy" style={{ y, scale: 1.16 }} className={className} />
    </div>
  );
}

export default function AboutPage() {
  const philosophyRef = useReveal();
  const qualityRef = useReveal();
  const whyChooseRef = useReveal();
  const ctaRef = useReveal();

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen overflow-x-hidden">
      
      {/* =================== COMBINED SECTION 1 & 2 (Continuous Background Image) =================== */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-36 overflow-hidden bg-[#042e1b] text-white">
        
        {/* Continuous Background Image — scale-in on scroll */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.img 
            src="/images/about/spice_heritage.png" 
            alt="Spice Heritage Estate" 
            initial={{ scale: 1.18, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 0.4 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full object-cover mix-blend-luminosity"
            style={{ willChange: 'transform' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#042e1b]/85 via-85% to-surface" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          
          {/* Hero Chronicle */}
          <div className="text-center pb-24 lg:pb-36">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs font-bold uppercase tracking-[0.3em] text-primary-fixed mb-5 block opacity-90"
            >
              The MACAW Chronicle
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8 drop-shadow-sm"
            >
              A Heritage of <br className="hidden sm:inline" /> <span className="text-primary-fixed italic">Single-Origin</span> Purity.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl text-primary-fixed/85 leading-relaxed max-w-2xl mx-auto font-normal"
            >
              We traverse ancient agricultural valleys to curate the world's most potent, ethically harvested reserves. Zero intermediaries, zero synthetic curing. Pure botanical potency.
            </motion.p>
          </div>

        {/* =================== SECTION 2: OUR PHILOSOPHY =================== */}
      <section ref={philosophyRef} className="relative py-28 lg:py-40 px-6 overflow-hidden border-b border-outline-variant/30">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/about/spice_sourcing.png"
            alt="Sourcing Botanical Philosophy"
            className="w-full h-full object-cover opacity-15 filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/90 to-surface" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="material-symbols-outlined text-primary text-[40px] mb-4 inline-block opacity-80">compost</span>
          <h2 className="reveal-text font-serif text-3xl sm:text-5xl font-bold text-primary mb-8" data-delay="1">
            Our Philosophy
          </h2>
          <div className="reveal-text space-y-6 text-base sm:text-lg text-on-surface-variant leading-relaxed font-normal max-w-3xl mx-auto bg-surface/60 backdrop-blur-sm p-8 sm:p-12 rounded-3xl border border-outline-variant/40 shadow-sm" data-delay="2">
            <p>
              At MACAW, we believe gastronomy is an intimate craft, and the botanical elements you introduce should honor that reverence. For decades, traditional commodity spice trade has been compromised by opaque warehousing, excessive thermal milling, and stale inventory sitting on shelves for years.
            </p>
            <p>
              We exist to redefine this lifecycle. We view spices not merely as seasonings, but as volatile botanical capsules carrying the terroir, solar cycles, and regenerative soil history of their origin estates. Our mandate is to preserve that unadulterated essence from harvest straight to your apothecary jar.
            </p>
          </div>
        </div>
      </section>

        </div>
      </section>

      {/* =================== DIRECT TRADE SOURCING =================== */}
      <section className="py-24 bg-surface-container-low border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-6 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 relative"
            >
              <ScaleReveal
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800"
                alt="Artisanal Spice Sourcing"
                className="aspect-[4/3] border border-outline-variant/40 shadow-sm relative"
                imgClassName="w-full h-full object-cover"
                initialScale={0.74}
                rounded="rounded-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70 pointer-events-none rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="font-serif text-xl font-bold">High-Altitude Kashmir Valley</p>
                  <p className="text-xs opacity-90 mt-1">First-flush saffron threads harvested at dawn solar exposure.</p>
                </div>
              </ScaleReveal>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-8"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2 block">Ethical Direct Trade</span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface leading-tight">
                  Meticulously Sourced, Single-Origin Yields.
                </h2>
              </div>

              <div className="space-y-5 text-on-surface-variant text-base sm:text-lg leading-relaxed font-normal">
                <p>
                  True apothecary potency cannot be mass-processed. It requires seasonal patience, soil regeneration practices, and direct equity partnerships with multi-generational farming collectives.
                </p>
                <p>
                  We bypass auction brokers entirely. Our founders personally audit remote estates—from Lakadong turmeric collectives in Meghalaya to organic cardamom groves in the Western Ghats. We verify harvest maturity on site and remit above-market rates for superior volatile oil retention.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/40">
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-primary text-[28px] shrink-0 mt-0.5">spa</span>
                  <div>
                    <h4 className="font-serif font-bold text-on-surface text-base">Single Origin</h4>
                    <p className="text-xs text-outline mt-0.5">Zero blending with inferior crops.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <span className="material-symbols-outlined text-primary text-[28px] shrink-0 mt-0.5">wb_sunny</span>
                  <div>
                    <h4 className="font-serif font-bold text-on-surface text-base">Solar Cured</h4>
                    <p className="text-xs text-outline mt-0.5">Slow atmospheric drying protocols.</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =================== QUALITY STANDARDS =================== */}
      <section ref={qualityRef} className="py-24 lg:py-32 bg-surface">
        <div className="max-w-container-max mx-auto px-6 sm:px-12 lg:px-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="reveal-text text-xs font-bold uppercase tracking-[0.2em] text-outline mb-2 block" data-delay="1">Uncompromising Rigor</span>
            <h2 className="reveal-text font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-primary" data-delay="2">
              The MACAW Specimen Standard
            </h2>
            <p className="reveal-text text-on-surface-variant text-base sm:text-lg mt-4 leading-relaxed font-normal" data-delay="3">
              We evaluate incoming harvests across three strict laboratory benchmarks. If a batch fails any metric, it is rejected.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'biotech',       title: 'Volatile Oil Content', delay: 0.1, desc: 'Aromatic potency resides entirely within lipid-soluble essential oils. We gas-chromatograph every batch to guarantee peak volatile oil percentages, ensuring profound culinary impact.' },
              { icon: 'verified_user', title: 'Zero Adulteration',    delay: 0.2, desc: 'Adulteration plagues global markets—from starch fillers to synthetic dyes. We subject all allocations to independent third-party mass spectrometry for pesticides and heavy metals.' },
              { icon: 'hourglass_bottom', title: 'Micro-Milled Freshness', delay: 0.3, desc: 'Spices are agricultural botanicals; their cellular structure degrades over time. We mill our bespoke craft blends in micro-batches upon order dispatch, sealing freshness inside apothecary jars.' },
            ].map(({ icon, title, delay, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="bg-surface-container-low border border-outline-variant/50 p-8 rounded-2xl shadow-sm hover:border-primary/40 transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[36px] mb-6 block">{icon}</span>
                <h3 className="font-serif text-2xl font-bold text-on-surface mb-3">{title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-normal">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== WHY CHOOSE MACAW? =================== */}
      <section ref={whyChooseRef} className="py-24 lg:py-32 bg-chilli-900 text-white relative overflow-hidden">
        <div className="max-w-container-max mx-auto px-6 sm:px-12 lg:px-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="reveal-text font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4" data-delay="1">
              Why Choose MACAW?
            </h2>
            <p className="reveal-text text-primary-fixed/85 text-base sm:text-lg leading-relaxed font-normal" data-delay="2">
              Crafted with purity, premium quality, and authentic flavor to enhance every meal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Premium Quality',
                desc: 'Handpicked spices sourced from trusted farms and premium suppliers.',
                delay: 0.1,
              },
              {
                title: 'Strong Aroma',
                desc: 'Carefully packed to preserve natural oils, freshness, and authentic taste.',
                delay: 0.2,
              },
              {
                title: '100% Natural',
                desc: 'No artificial colors, fillers, preservatives, or harmful additives.',
                delay: 0.3,
              },
              {
                title: 'Hygienically Packed',
                desc: 'Processed and packed under strict hygiene and quality standards.',
                delay: 0.4,
              },
            ].map(({ title, desc, delay }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="bg-chilli-800/70 border border-primary/40 p-6 sm:p-8 rounded-2xl shadow-lg hover:border-primary-fixed transition-colors flex flex-col justify-start"
              >
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary-fixed mb-3">
                  {title}
                </h3>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== EXPERIENCE CTA =================== */}
      <section ref={ctaRef} className="py-20 bg-surface-container-low border-t border-outline-variant/30 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface p-10 sm:p-16 rounded-2xl border border-outline-variant/50 shadow-sm"
          >
            <h2 className="reveal-text font-serif text-3xl sm:text-4xl font-bold text-primary mb-4" data-delay="1">
              Experience the Reserve
            </h2>
            <p className="reveal-text text-on-surface-variant text-base sm:text-lg mb-8 max-w-xl mx-auto font-normal leading-relaxed" data-delay="2">
              Once your palate encounters the unyielding aromatic depth of freshly milled single-origin harvest reserves, traditional pantry spices become obsolete.
            </p>
            <Link to="/products" className="btn-primary px-8 py-4 text-xs tracking-[0.2em]">
              Explore Complete Collection
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
