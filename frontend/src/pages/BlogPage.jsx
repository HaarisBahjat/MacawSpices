import React from 'react';
import { motion } from 'framer-motion';
import { FiGlobe, FiAward, FiBookOpen } from 'react-icons/fi';

const spices = [
  {
    id: 'black-pepper',
    name: 'Black Pepper',
    image: '/images/spices/black_pepper.png',
    origin: 'Native to the Malabar Coast of India, black pepper was once so valuable it was used as currency. It sparked global trade routes and early explorations. Wars were fought over control of the pepper trade, cementing its place as the "King of Spices".',
    qualityTest: 'High-quality peppercorns should have an immediately pungent, woody, and sharp aroma. They should feel heavy for their size and firm—not easily crumbling when pressed between your fingers. Dull, dusty-looking peppercorns indicate age and loss of volatile oils.',
    color: 'bg-bark-900',
    accent: 'text-bark-300'
  },
  {
    id: 'cinnamon',
    name: 'Ceylon Cinnamon',
    image: '/images/spices/cinnamon_sticks.png',
    origin: 'True cinnamon (Ceylon) originates from Sri Lanka. Ancient Egyptians used it in embalming, while Romans burned it on funeral pyres as a sign of immense wealth and respect. For centuries, Arab traders kept its origin a fiercely guarded secret to maintain their monopoly.',
    qualityTest: 'True Ceylon cinnamon has multiple, paper-thin layers rolled together, resembling a delicate cigar, and can be easily crumbled by hand. It should smell sweet, floral, and delicate. If it is a single thick, hard bark that is tough to break, it is Cassia—a cheaper, harsher alternative.',
    color: 'bg-spice-900',
    accent: 'text-spice-200'
  },
  {
    id: 'saffron',
    name: 'Saffron Threads',
    image: '/images/spices/saffron_threads.png',
    origin: 'Derived from the autumn-blooming crocus flower, its origins are traced back to Greece and the Middle East. It remains the most expensive spice by weight because each delicate stigma must be carefully harvested by hand during a very short blooming window.',
    qualityTest: 'Genuine saffron threads are slightly trumpet-shaped at one end and boast a vivid, deep red hue. The Water Test is definitive: when placed in warm water, true saffron slowly releases a golden-yellow dye while the thread itself remains red. If it instantly turns the water red or the thread loses its color, it is fake.',
    color: 'bg-chilli-900',
    accent: 'text-chilli-200'
  },
  {
    id: 'chilies',
    name: 'Red Chilies',
    image: '/images/spices/red_chilies.png',
    origin: 'Originally native to the Americas, chilies were introduced to the rest of the world by early Spanish and Portuguese explorers. They adapted incredibly quickly to various tropical climates, rapidly becoming the fiery soul of Asian, African, and Indian cuisines.',
    qualityTest: 'When buying dried chilies, look for a vibrant, deep red hue—avoid dull, faded, or brown patches. The skin should feel slightly pliable and leathery. If the chili is completely brittle and turns to dust at a touch, it has lost its essential oils and its vibrant flavor is gone.',
    color: 'bg-red-900',
    accent: 'text-red-200'
  }
];

const BlogPage = () => {
  return (
    <div className="py-8 md:py-12 section">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 px-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-bark-900 mb-4 md:mb-6"
        >
          Spice <span className="text-chilli-600">Journals</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-lg lg:text-xl text-bark-700 max-w-2xl mx-auto"
        >
          An in-depth exploration into the origins of the world's most treasured spices and the expert secrets to identifying true quality.
        </motion.p>
      </div>

      <div className="max-w-6xl mx-auto pb-24 relative">
        {spices.map((spice, index) => (
          <motion.section 
            key={spice.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            style={{ zIndex: index + 10 }}
            className={`static lg:sticky lg:top-24 pt-8 pb-10 md:pb-8 px-4 md:px-12 bg-cream flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-6 lg:gap-12 items-center lg:min-h-[80vh] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-hide rounded-t-[2rem] md:rounded-t-[3rem] border-t border-spice-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)]`}
          >
            {/* Image Side */}
            <div className="w-full lg:w-1/2 relative group">
              <div className="absolute inset-0 bg-chilli-600/10 rounded-[2rem] md:rounded-[3rem] transform rotate-3 scale-105 transition-transform group-hover:rotate-6"></div>
              <img 
                src={spice.image} 
                alt={spice.name} 
                className="relative z-10 w-full h-[250px] md:h-[350px] lg:h-[450px] object-cover rounded-[2rem] md:rounded-[3rem] shadow-2xl border-4 border-white"
              />
            </div>

            {/* Content Side */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-bark-900 mb-3 md:mb-4">
                  {spice.name}
                </h2>
                <div className="w-20 h-1.5 bg-chilli-600 rounded-full"></div>
              </div>

              {/* Origin Section */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-glass border border-spice-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <FiGlobe className="text-8xl" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 text-chilli-600">
                    <FiGlobe className="text-xl" />
                    <h3 className="text-xl font-bold font-display uppercase tracking-wider">The Origin</h3>
                  </div>
                  <p className="text-bark-700 leading-relaxed text-lg">
                    {spice.origin}
                  </p>
                </div>
              </div>

              {/* Quality Test Section */}
              <div className={`${spice.color} p-5 md:p-6 rounded-3xl shadow-xl text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <FiAward className="text-8xl" />
                </div>
                <div className="relative z-10">
                  <div className={`flex items-center gap-3 mb-4 ${spice.accent}`}>
                    <FiAward className="text-xl" />
                    <h3 className="text-xl font-bold font-display uppercase tracking-wider">Quality Test</h3>
                  </div>
                  <p className="text-white/90 leading-relaxed text-lg">
                    {spice.qualityTest}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        ))}

        {/* Conclusion / Mastery Note */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ zIndex: 50 }}
          className="static lg:sticky lg:top-24 bg-spice-50 rounded-t-[2rem] md:rounded-t-[3rem] p-6 md:p-8 lg:p-16 text-center border-t border-spice-200 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] lg:min-h-[60vh] lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-hide flex flex-col justify-center mt-12 lg:mt-0"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-chilli-100 text-chilli-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
            <FiBookOpen className="text-2xl md:text-3xl" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-bark-900 mb-3 md:mb-4">Mastering the Elements</h2>
          <p className="text-base md:text-lg text-bark-700 max-w-3xl mx-auto leading-relaxed">
            Understanding a spice's origin and knowing how to select the highest quality is just the beginning. 
            When you cook, remember to bloom your spices in oil or ghee to release their fat-soluble flavors, 
            and always prefer grinding whole spices fresh for a transformative culinary experience.
          </p>
        </motion.section>
      </div>
    </div>
  );
};

export default BlogPage;
