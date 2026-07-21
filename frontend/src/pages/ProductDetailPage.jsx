import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../services/api';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import ProductCard from '../components/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantityGrams, setQuantityGrams] = useState(50);
  const [activeTab, setActiveTab] = useState(null); // 'origin' or 'nutrition' or 'reviews'
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productAPI.getBySlug(slug),
  });

  const { data: relatedData } = useQuery({
    queryKey: ['related-products', slug],
    queryFn: () => productAPI.getAll({ limit: 4 }),
  });

  const product = data?.data?.product;
  const relatedProducts = relatedData?.data?.products?.filter(p => p.slug !== slug).slice(0, 4) || [];

  if (isLoading) {
    return (
      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 py-24 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 aspect-[4/5] bg-surface-container-high rounded-xl"></div>
          <div className="lg:col-span-5 space-y-6 pt-4">
            <div className="h-4 bg-surface-container-high rounded w-1/3"></div>
            <div className="h-12 bg-surface-container-high rounded w-3/4"></div>
            <div className="h-8 bg-surface-container-high rounded w-1/4"></div>
            <div className="h-24 bg-surface-container-high rounded w-full"></div>
            <div className="h-14 bg-surface-container-high rounded w-full mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 py-32 text-center font-sans">
        <h2 className="font-serif text-3xl font-bold text-on-surface mb-4">Botanical Specimen Not Found</h2>
        <p className="text-on-surface-variant mb-8">The requested spice reserve may be out of season or archived.</p>
        <Link to="/products" className="btn-primary">Return to Collection</Link>
      </div>
    );
  }

  const pricePerGram = product.pricePerGram || 0.36;
  const totalPrice = pricePerGram * quantityGrams;
  const flavorPills = product.flavorProfile ? product.flavorProfile.split(',').map(s => s.trim()) : ['Rich', 'Aromatic', 'Pure'];

  const handleAddToCart = () => {
    addItem({ productId: product.id, quantity: quantityGrams, type: 'product' });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to write a review.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await productAPI.addReview(product.id, { rating: reviewRating, comment: reviewComment });
      toast.success('Thank you! Your review has been submitted.');
      setReviewComment('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans">
      {/* Product Hero Section */}
      <main className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16 py-12 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left: High-Res Hero Image & Visual Composition */}
          <div className="lg:col-span-7 relative group">
            {/* Main Image Container */}
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low relative border border-outline-variant/40 shadow-sm">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                src={product.images?.[selectedImage] || '/images/spices/black_pepper.png'}
                alt={product.name}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Floating Botanical Accent */}
              <div className="absolute -bottom-10 -left-10 w-48 h-48 opacity-20 pointer-events-none rotate-12 text-primary">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45,-77.4C58.3,-69.3,69.2,-57,76.5,-43.3C83.9,-29.6,87.6,-14.8,87.6,0C87.6,14.8,83.9,29.6,76.5,43.3C69.2,57,58.3,69.3,45,77.4C31.7,85.5,15.8,89.5,0,89.5C-15.8,89.5,-31.7,85.5,-45,77.4C-58.3,69.3,-69.2,57,-76.5,43.3C-83.9,29.6,-87.6,14.8,-87.6,0C-87.6,-14.8,-83.9,-29.6,-76.5,-43.3C-69.2,-57,-58.3,-69.3,-45,-77.4C-31.7,-85.5,-15.8,-89.5,0,-89.5C15.8,-89.5,31.7,-85.5,45,-77.4Z" fill="currentColor" transform="translate(100 100)"></path>
                </svg>
              </div>
            </div>

            {/* Thumbnails/Secondary views */}
            {product.images?.length > 1 && (
              <div className="mt-6 grid grid-cols-4 gap-4">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square bg-surface-container rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImage === i ? 'border-2 border-primary shadow-sm' : 'border border-outline-variant/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Content */}
          <div className="lg:col-span-5 lg:pl-6 flex flex-col pt-6 lg:pt-0">
            <nav aria-label="Breadcrumb" className="flex mb-6">
              <ol className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-outline">
                <li><Link to="/products" className="hover:text-primary transition-colors">Shop</Link></li>
                <li><span className="material-symbols-outlined text-[14px]">chevron_right</span></li>
                <li><span className="text-on-surface-variant truncate max-w-[150px]">{product.category?.name || 'Artisanal Reserve'}</span></li>
              </ol>
            </nav>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-primary mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="font-serif text-xl sm:text-2xl text-on-surface-variant mb-6 italic font-normal">
              {product.latinName || product.origin || 'Single Origin Harvest'}
            </p>

            <div className="flex items-center gap-4 mb-8">
              <span className="font-serif text-3xl font-bold text-primary">₹{totalPrice.toFixed(0)}</span>
              <span className="text-xs text-outline font-semibold">({quantityGrams}g at ₹{pricePerGram.toFixed(2)}/g)</span>
              <span className="text-xs font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full ml-auto">
                {product.stock > 0 ? 'In Reserve' : 'Out of Stock'}
              </span>
            </div>

            <div className="mb-10 space-y-6">
              <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed font-normal">
                {product.description || 'Sourced directly from pristine valleys. Carefully cured to achieve signature aromatic depth and smoldering warmth.'}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {flavorPills.map((flavor, index) => (
                  <span key={index} className="pill-shaped bg-surface-container-low px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-primary flex items-center gap-2 border border-outline-variant/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> {flavor}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden h-14 bg-surface-container-low">
                  <button
                    type="button"
                    onClick={() => setQuantityGrams(Math.max(product.minOrderGram || 50, quantityGrams - 50))}
                    className="px-4 py-2 hover:bg-surface-container transition-colors text-lg font-bold text-on-surface cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={product.minOrderGram || 50}
                    step={50}
                    value={quantityGrams}
                    onChange={(e) => setQuantityGrams(Math.max(10, Number(e.target.value)))}
                    className="w-16 text-center border-none bg-transparent focus:ring-0 text-sm font-bold text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantityGrams(quantityGrams + 50)}
                    className="px-4 py-2 hover:bg-surface-container transition-colors text-lg font-bold text-on-surface cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-primary text-on-primary h-14 rounded-lg text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Add to Cart
                  <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                </button>
              </div>

              <button
                onClick={() => {
                  handleAddToCart();
                  // could add toast or subscription flow
                }}
                className="w-full border border-primary text-primary h-14 rounded-lg text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/5 transition-all cursor-pointer"
              >
                Subscription: Save 10% Every Harvest
              </button>
            </div>

            {/* Minor Details Accordions */}
            <div className="mt-12 space-y-4 border-t border-outline-variant/60 pt-8">
              <div
                onClick={() => setActiveTab(activeTab === 'origin' ? null : 'origin')}
                className="flex justify-between items-center group cursor-pointer py-2"
              >
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface">Origin & Sourcing</span>
                <span className={`material-symbols-outlined transition-transform ${activeTab === 'origin' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`}>
                  arrow_forward
                </span>
              </div>
              {activeTab === 'origin' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs text-on-surface-variant leading-relaxed pb-3">
                  📍 Sourced directly from {product.origin || 'India finest agricultural estates'}. Cultivated using traditional soil regeneration techniques without synthetic pesticides.
                </motion.div>
              )}

              <div
                onClick={() => setActiveTab(activeTab === 'nutrition' ? null : 'nutrition')}
                className="flex justify-between items-center group cursor-pointer py-2 border-t border-outline-variant/30"
              >
                <span className="text-sm font-bold uppercase tracking-wider text-on-surface">Purity & Specimen Notes</span>
                <span className={`material-symbols-outlined transition-transform ${activeTab === 'nutrition' ? 'rotate-90 text-primary' : 'group-hover:translate-x-1'}`}>
                  arrow_forward
                </span>
              </div>
              {activeTab === 'nutrition' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs text-on-surface-variant leading-relaxed pb-3">
                  🌿 100% pure ground spice. Zero anti-caking agents, zero artificial colorants, zero irradiation. Vacuum sealed in apothecary jars immediately upon milling.
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Usage Tips Section (Asymmetric Bento) */}
      <section className="bg-surface-container-low py-24 border-y border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">
          <div className="mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-primary font-bold mb-4">Culinary Expressions</h2>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed font-normal">
              Discover how to elevate your gastronomy with the unyielding potency of {product.name}.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface p-10 rounded-xl flex flex-col justify-between group hover:-translate-y-2 transition-transform duration-500 border border-outline-variant/40 shadow-sm">
              <div>
                <span className="material-symbols-outlined text-primary text-[40px] mb-6 block">skillet</span>
                <h3 className="font-serif text-2xl font-semibold mb-4 text-on-surface">Oil Infusion</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Gently warm in virgin olive oil or cultured clarified butter to bloom lipid-soluble aromatic compounds before sautéing.
                </p>
              </div>
              <Link to="/blog" className="mt-8 text-xs font-bold uppercase tracking-widest text-primary inline-flex items-center gap-2 group-hover:underline underline-offset-4">
                Read Guide <span className="material-symbols-outlined text-[16px]">north_east</span>
              </Link>
            </div>

            <div className="md:col-span-2 relative h-[400px] rounded-xl overflow-hidden group border border-outline-variant/40 shadow-sm">
              <img
                src="/images/spices/cinnamon_sticks.png"
                alt="Culinary Pairing"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-10 left-10 text-white max-w-md z-10">
                <h3 className="font-serif text-3xl font-bold mb-2">Signature Application</h3>
                <p className="text-sm opacity-90 leading-relaxed font-normal">
                  Incorporate into marinades or finishing dusts to impart unmistakable terroir and vibrant visual drama.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-20 bg-surface border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Reviews Summary & List */}
            <div className="lg:col-span-7">
              <span className="text-xs uppercase tracking-[0.15em] font-bold text-outline mb-2 block">Customer Feedbacks</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-primary font-bold mb-6">Ratings & Reviews</h2>

              <div className="flex items-center gap-4 mb-8 bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
                <div className="text-center border-r border-outline-variant/40 pr-6">
                  <p className="font-serif text-4xl font-bold text-primary">{(product.avgRating || 0).toFixed(1)}</p>
                  <div className="flex text-amber-500 justify-center text-sm mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="material-symbols-outlined text-[18px]">
                        {star <= Math.round(product.avgRating || 0) ? 'star' : 'star_outline'}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-outline mt-1 font-semibold">{product.reviews?.length || 0} reviews</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface mb-1">Apothecary Verified Quality</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Read unvarnished feedback from culinary enthusiasts and professional chefs.
                  </p>
                </div>
              </div>

              {/* Review list */}
              <div className="space-y-4">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                            {rev.user?.name ? rev.user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{rev.user?.name || 'Verified Connoisseur'}</p>
                            <p className="text-[10px] text-outline">{new Date(rev.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className="material-symbols-outlined text-[16px]">
                              {star <= rev.rating ? 'star' : 'star_outline'}
                            </span>
                          ))}
                        </div>
                      </div>
                      {rev.comment && <p className="text-xs text-on-surface-variant leading-relaxed mt-2">{rev.comment}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant italic">No reviews yet. Be the first to review this specimen!</p>
                )}
              </div>
            </div>

            {/* Write a Review Form */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/40 sticky top-28 shadow-sm">
                <h3 className="font-serif text-2xl font-bold text-primary mb-2">Write a Review</h3>
                <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                  Share your culinary experience with this harvest.
                </p>

                {isAuthenticated ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-2">Your Rating</label>
                      <div className="flex gap-2 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <span className="material-symbols-outlined text-[28px]">
                              {star <= reviewRating ? 'star' : 'star_outline'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-2">Your Comment (Optional)</label>
                      <textarea
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe flavor notes, aroma intensity, or dish applications..."
                        className="w-full bg-surface border border-outline-variant/50 rounded-lg p-3 text-xs focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="w-full bg-primary text-on-primary h-12 rounded-lg text-xs font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 border border-dashed border-outline-variant/60 rounded-xl">
                    <p className="text-xs text-on-surface-variant mb-4">Please log in to submit a rating or review for this item.</p>
                    <Link to="/login" className="btn-primary text-xs px-6 py-3">Log In</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-24 bg-surface">
        <div className="max-w-container-max mx-auto px-4 sm:px-8 lg:px-16">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.15em] font-bold text-outline mb-2 block">Pantry Harmony</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-primary font-bold">Pairing Suggestions</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {relatedProducts.map((relProduct) => (
              <ProductCard key={relProduct.id} product={relProduct} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
