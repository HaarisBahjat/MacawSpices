import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiBookmark, FiCheck, FiInfo, FiArrowRight, FiPlus, FiMinus } from 'react-icons/fi';
import { GiMortar, GiSpoon } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { blendAPI, productAPI } from '../services/api';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';

const QUANTITY_MULTIPLIERS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '3x', value: 3 },
];

export default function MixerPage() {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [mixMode, setMixMode] = useState('template'); // 'template' or 'custom'
  const [customItems, setCustomItems] = useState([]);
  const [selectedBlend, setSelectedBlend] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [saved, setSaved] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ['mixer-products'],
    queryFn: () => productAPI.getAll({ limit: 100 })
  });
  const allProducts = productsData?.data?.products || [];

  const { data, isLoading } = useQuery({
    queryKey: ['blend-templates'],
    queryFn: () => blendAPI.getAll()
  });

  const saveMutation = useMutation({
    mutationFn: ({ blendTemplateId }) => blendAPI.save({ blendTemplateId }),
    onSuccess: () => {
      setSaved(true);
      toast.success('Blend saved to your account!');
    },
    onError: () => toast.error('Please login to save blends'),
  });

  const blends = data?.data?.blends || [];
  const activeBlend = selectedBlend || blends[0] || null;
  const isCustom = mixMode === 'custom';

  const computedItems = isCustom
    ? customItems.map(item => ({
        ...item,
        id: item.product.id,
        adjustedWeight: item.weightGrams,
        subtotal: item.weightGrams * item.product.pricePerGram,
      }))
    : (activeBlend?.items?.map((item) => ({
        ...item,
        adjustedWeight: item.weightGrams * multiplier,
        subtotal: item.weightGrams * multiplier * item.product.pricePerGram,
      })) || []);

  const handleAddCustomItem = (product) => {
    setCustomItems(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (exists) {
        return prev.map(i => i.product.id === product.id ? { ...i, weightGrams: i.weightGrams + 10 } : i);
      }
      return [...prev, { product, weightGrams: 50 }];
    });
  };

  const handleUpdateCustomItem = (productId, delta) => {
    setCustomItems(prev => prev.map(i => {
      if (i.product.id === productId) {
        const newWeight = Math.max(0, i.weightGrams + delta);
        return { ...i, weightGrams: newWeight };
      }
      return i;
    }).filter(i => i.weightGrams > 0));
  };

  const totalWeight = computedItems.reduce((acc, i) => acc + i.adjustedWeight, 0);
  const totalPrice = computedItems.reduce((acc, i) => acc + i.subtotal, 0);

  const handleAddToCart = () => {
    if (isCustom && customItems.length === 0) {
      toast.error('Add some spices to your custom blend first!');
      return;
    }
    if (!isCustom && !activeBlend) return;

    addItem({
      productId: isCustom ? `custom_blend_${Date.now()}` : `blend_${activeBlend.id}_${multiplier}`,
      quantity: 1,
      type: 'blend',
      blendData: {
        blendId: isCustom ? 'custom' : activeBlend.id,
        blendName: isCustom ? 'Custom Spice Blend' : activeBlend.name,
        multiplier: isCustom ? 1 : multiplier,
        items: computedItems.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          weightGrams: i.adjustedWeight,
        })),
        totalWeight,
        totalPrice,
      },
      price: totalPrice,
    });
    toast.success(isCustom ? 'Custom blend added to cart!' : 'Blend added to cart!');
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      toast.error('Please login to save blends');
      return;
    }
    saveMutation.mutate({ blendTemplateId: activeBlend.id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <GiMortar className="text-6xl text-chilli-600 mx-auto mb-4 animate-bounce" />
          <p className="text-bark-500">Loading spice blends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spice-50">
      {/* Header */}
      <div className="bg-spice-gradient py-14 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="section relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-4 border border-white/20">
              <GiMortar /> Spice Blend Studio
            </div>
            <h1 className="font-display text-5xl font-bold mb-4">Build Your Perfect Blend</h1>
            <p className="text-spice-200 text-lg max-w-xl mx-auto">
              Choose from our expertly balanced blend templates. Adjust the quantity and add to your cart.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="section py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Blend Template Selector */}
          <div className="lg:col-span-1">
            <div className="flex bg-white rounded-xl p-1 shadow-sm mb-6 border border-spice-100">
              <button 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mixMode === 'template' ? 'bg-chilli-50 text-chilli-600' : 'text-bark-500 hover:text-bark-700'}`}
                onClick={() => setMixMode('template')}
              >
                Preset Templates
              </button>
              <button 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mixMode === 'custom' ? 'bg-chilli-50 text-chilli-600' : 'text-bark-500 hover:text-bark-700'}`}
                onClick={() => setMixMode('custom')}
              >
                Custom Blend
              </button>
            </div>

            <h2 className="font-display text-2xl font-bold text-bark-900 mb-4">
              {isCustom ? 'Select Spices' : 'Choose a Blend'}
            </h2>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide pb-4 pr-2">
              {!isCustom ? blends.map((blend) => (
                <motion.button
                  key={blend.id}
                  id={`blend-select-${blend.slug}`}
                  whileHover={{ x: 4 }}
                  onClick={() => { setSelectedBlend(blend); setSaved(false); }}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                    (activeBlend?.id === blend.id && !isCustom)
                      ? 'border-chilli-600 bg-white shadow-spice'
                      : 'border-spice-200 bg-white hover:border-spice-300'
                  }`}
                >
                  <img
                    src={blend.imageUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100'}
                    alt={blend.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-bark-900 truncate">{blend.name}</h3>
                    <p className="text-sm text-bark-500 line-clamp-2 mt-0.5">{blend.description}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {blend.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="badge-gold text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {activeBlend?.id === blend.id && !isCustom && (
                    <FiCheck className="text-chilli-600 text-xl shrink-0" />
                  )}
                </motion.button>
              )) : allProducts.map(product => (
                <motion.button
                  key={product.id}
                  whileHover={{ x: 4 }}
                  onClick={() => handleAddCustomItem(product)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border-2 border-spice-200 bg-white hover:border-spice-300 transition-all duration-200"
                >
                  <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100'} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-bark-900 truncate text-sm">{product.name}</h3>
                    <p className="text-xs text-bark-500">₹{product.pricePerGram}/g</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-spice-50 flex items-center justify-center shrink-0">
                    <FiPlus className="text-spice-600" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Right: Blend Detail & Customization */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {(activeBlend || isCustom) ? (
                <motion.div
                  key={isCustom ? 'custom' : activeBlend?.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Blend Header */}
                  <div className="card mb-6 overflow-visible">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={isCustom ? 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800' : (activeBlend?.imageUrl || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800')}
                        alt={isCustom ? 'Custom Blend' : activeBlend?.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-6 text-white">
                        <h2 className="font-display text-3xl font-bold">{isCustom ? 'Your Custom Blend' : activeBlend?.name}</h2>
                        <p className="text-white/80 text-sm mt-1">{isCustom ? 'Carefully hand-picked by you.' : activeBlend?.description}</p>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Quantity Multiplier */}
                      {!isCustom && (
                        <div className="mb-6">
                          <label className="label">Quantity Multiplier</label>
                          <div className="flex gap-2 flex-wrap">
                            {QUANTITY_MULTIPLIERS.map((m) => (
                              <button
                                key={m.value}
                                id={`multiplier-${m.label}`}
                                onClick={() => setMultiplier(m.value)}
                                className={`px-5 py-2.5 rounded-xl font-semibold border-2 transition-all duration-200 ${
                                  multiplier === m.value
                                    ? 'bg-chilli-600 text-white border-chilli-600 shadow-spice'
                                    : 'bg-white text-bark-700 border-spice-200 hover:border-chilli-300'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ingredients Breakdown */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="label mb-0">Ingredients Breakdown</label>
                          <span className="text-sm text-bark-500">Total: <strong>{totalWeight.toFixed(0)}g</strong></span>
                        </div>

                        <div className="space-y-3">
                          {isCustom && computedItems.length === 0 && (
                            <div className="text-center p-6 bg-spice-50 rounded-xl text-bark-400 text-sm border-2 border-dashed border-spice-200">
                              Your blend is empty. Add spices from the list on the left to start mixing!
                            </div>
                          )}
                          {computedItems.map((item) => {
                            const pct = totalWeight > 0 ? (item.adjustedWeight / totalWeight) * 100 : 0;
                            return (
                              <div key={item.id} className="bg-spice-50 rounded-xl p-3">
                                <div className="flex items-center gap-3 mb-2">
                                  <img
                                    src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=80'}
                                    alt={item.product?.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-bark-900 text-sm">{item.product?.name}</p>
                                    {!isCustom ? (
                                      <p className="text-xs text-bark-500">
                                        {item.adjustedWeight.toFixed(0)}g · ₹{item.product?.pricePerGram}/g
                                      </p>
                                    ) : (
                                      <p className="text-xs text-bark-500">
                                        ₹{item.product?.pricePerGram}/g
                                      </p>
                                    )}
                                  </div>
                                  
                                  {isCustom && (
                                    <div className="flex items-center gap-1 bg-white rounded-lg border border-spice-200 p-1 shrink-0">
                                      <button onClick={() => handleUpdateCustomItem(item.product.id, -10)} className="w-6 h-6 rounded bg-spice-50 flex items-center justify-center text-bark-600 hover:bg-spice-200 transition-colors"><FiMinus className="text-xs" /></button>
                                      <span className="text-sm font-semibold w-8 text-center">{item.adjustedWeight}g</span>
                                      <button onClick={() => handleUpdateCustomItem(item.product.id, 10)} className="w-6 h-6 rounded bg-spice-50 flex items-center justify-center text-bark-600 hover:bg-spice-200 transition-colors"><FiPlus className="text-xs" /></button>
                                    </div>
                                  )}

                                  <span className="font-semibold text-bark-800 text-sm shrink-0 ml-2">
                                    ₹{item.subtotal.toFixed(0)}
                                  </span>
                                </div>
                                {/* Proportion bar */}
                                <div className="h-1.5 bg-spice-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-chilli-600 to-spice-500 rounded-full"
                                  />
                                </div>
                                <p className="text-xs text-bark-400 mt-1 text-right">{pct.toFixed(0)}%</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info box */}
                      <div className="flex items-start gap-2 p-3 bg-spice-50 rounded-xl mb-6 text-sm text-bark-600">
                        <FiInfo className="text-spice-500 shrink-0 mt-0.5" />
                        <p>
                          All ingredients are freshly ground and vacuum-sealed to preserve maximum flavor. 
                          Delivered within 3-5 business days.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-bark-500">Total Weight</p>
                        <p className="text-2xl font-bold text-bark-900">{totalWeight.toFixed(0)}g</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-bark-500">Total Price</p>
                        <p className="text-3xl font-bold text-chilli-600">₹{totalPrice.toFixed(0)}</p>
                        <p className="text-xs text-bark-400">₹{totalWeight > 0 ? (totalPrice / totalWeight).toFixed(2) : 0}/g avg</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        id="mixer-add-to-cart-btn"
                        onClick={handleAddToCart}
                        className="btn-primary flex-1 py-4 text-base"
                      >
                        <FiShoppingCart /> Add Blend to Cart
                      </button>
                      {!isCustom && (
                        <button
                          id="mixer-save-btn"
                          onClick={handleSave}
                          disabled={saved || saveMutation.isPending}
                          className={`px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                            saved
                              ? 'bg-green-50 border-green-400 text-green-600'
                              : 'bg-white border-spice-200 text-bark-700 hover:border-chilli-300'
                          }`}
                        >
                          {saved ? <FiCheck className="text-xl" /> : <FiBookmark className="text-xl" />}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="card p-12 text-center text-bark-400">
                  <GiMortar className="text-6xl mx-auto mb-4 text-spice-300" />
                  <p>Select a blend template to get started</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
