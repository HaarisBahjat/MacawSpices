import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiFilter, FiGrid, FiList, FiSearch, FiX } from 'react-icons/fi';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import SelectDropdown from '../components/SelectDropdown';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'createdAt_desc' },
  { label: 'Price: Low to High', value: 'pricePerGram_asc' },
  { label: 'Price: High to Low', value: 'pricePerGram_desc' },
  { label: 'Name A-Z', value: 'name_asc' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'createdAt_desc';
  const page = parseInt(searchParams.get('page') || '1');

  const [sortBy, order] = sort.split('_');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, category, sortBy, order, page }],
    queryFn: () => productAPI.getAll({ search, category, sortBy, order, page, limit: 12 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productAPI.getCategories(),
  });

  const products = productsData?.data?.products || [];
  const pagination = productsData?.data?.pagination || {};
  const categories = categoriesData?.data?.categories || [];

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-spice-100 py-8">
        <div className="section">
          <h1 className="font-display text-4xl font-bold text-bark-900 mb-2">
            {search ? `Results for "${search}"` : category ? categories.find(c => c.slug === category)?.name || 'Products' : 'All Spices'}
          </h1>
          <p className="text-bark-500">
            {pagination.total ? `${pagination.total} products found` : 'Browse our collection'}
          </p>
        </div>
      </div>

      <div className="section py-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search in page */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
              <input
                id="products-search-input"
                type="text"
                defaultValue={search}
                onKeyDown={(e) => e.key === 'Enter' && setParam('search', e.target.value)}
                placeholder="Search spices..."
                className="input pl-9 py-2 w-48 text-sm"
              />
            </div>

            {/* Category filter */}
            <SelectDropdown
              id="products-category-filter"
              value={category}
              onChange={(val) => setParam('category', val)}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((c) => ({
                  value: c.slug,
                  label: `${c.name} (${c._count?.products || 0})`,
                })),
              ]}
            />

            {/* Active filters */}
            {search && (
              <button
                onClick={() => setParam('search', '')}
                className="flex items-center gap-1 px-3 py-1.5 bg-chilli-100 text-chilli-700 rounded-full text-sm font-medium hover:bg-chilli-200 transition-colors"
              >
                "{search}" <FiX />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <SelectDropdown
              id="products-sort-select"
              value={sort}
              onChange={(val) => setParam('sort', val)}
              options={SORT_OPTIONS}
            />

            {/* View mode */}
            <div className="flex border border-spice-200 rounded-lg overflow-hidden">
              <button
                id="products-grid-view-btn"
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-chilli-600 text-white' : 'bg-white text-bark-500 hover:bg-spice-50'}`}
              >
                <FiGrid />
              </button>
              <button
                id="products-list-view-btn"
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-chilli-600 text-white' : 'bg-white text-bark-500 hover:bg-spice-50'}`}
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setParam('category', '')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              !category ? 'bg-chilli-600 text-white' : 'bg-white text-bark-600 border border-spice-200 hover:border-chilli-300'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              id={`category-pill-${c.slug}`}
              onClick={() => setParam('category', c.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                category === c.slug ? 'bg-chilli-600 text-white' : 'bg-white text-bark-600 border border-spice-200 hover:border-chilli-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-spice-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-spice-100 rounded w-1/2" />
                  <div className="h-5 bg-spice-100 rounded w-3/4" />
                  <div className="h-10 bg-spice-100 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <motion.div
            className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
          >
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 text-bark-400">
            <FiSearch className="text-6xl mx-auto mb-4 text-spice-200" />
            <p className="text-xl font-semibold mb-2">No spices found</p>
            <p>Try a different search or category</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i}
                id={`page-btn-${i + 1}`}
                onClick={() => setParam('page', String(i + 1))}
                className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                  page === i + 1
                    ? 'bg-chilli-600 text-white shadow-spice'
                    : 'bg-white text-bark-600 border border-spice-200 hover:border-chilli-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
