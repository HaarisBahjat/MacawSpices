import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPackage, FiTrendingUp, FiUsers, FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiUploadCloud, FiImage, FiX } from 'react-icons/fi';
import { GiChiliPepper } from 'react-icons/gi';
import { adminAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';
import SelectDropdown from '../components/SelectDropdown';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card p-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-bark-500 text-sm">{label}</p>
      <p className="text-3xl font-bold text-bark-900 mt-1">{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminAPI.getStats() });
  const stats = data?.data || {};

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-bark-900 mb-6">Dashboard</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<FiDollarSign className="text-xl text-green-600" />} label="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} color="bg-green-100" />
        <StatCard icon={<FiPackage className="text-xl text-blue-600" />} label="Total Orders" value={stats.totalOrders || 0} color="bg-blue-100" />
        <StatCard icon={<GiChiliPepper className="text-xl text-chilli-600" />} label="Products" value={stats.totalProducts || 0} color="bg-chilli-100" />
        <StatCard icon={<FiUsers className="text-xl text-purple-600" />} label="Customers" value={stats.totalUsers || 0} color="bg-purple-100" />
      </div>

      <h3 className="font-semibold text-bark-900 mb-3">Recent Orders</h3>
      <div className="card overflow-hidden">
        <div className="divide-y divide-spice-100">
          {stats.recentOrders?.map((order) => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-spice-50">
              <div>
                <p className="font-medium text-bark-900 text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-bark-500">{order.user?.name}</p>
              </div>
              <span className={`badge text-xs ${order.status === 'DELIVERED' ? 'badge-green' : order.status === 'CANCELLED' ? 'badge-red' : 'badge-gold'}`}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminOrders() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const search = (searchParams.get('search') || '').toLowerCase();
  const [status, setStatus] = useState('');
  // Tracking modal state
  const [trackingModal, setTrackingModal] = useState(null); // { orderId, status }
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('Delhivery');

  const { data } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => adminAPI.getOrders({ status }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, trackingNumber, courierName }) =>
      adminAPI.updateOrderStatus(id, status, trackingNumber, courierName),
    onSuccess: () => {
      qc.invalidateQueries(['admin-orders']);
      toast.success('Order updated ✅');
      setTrackingModal(null);
      setTrackingNumber('');
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Update failed'),
  });

  const handleStatusChange = (order, newStatus) => {
    if (newStatus === 'SHIPPED') {
      // Open tracking modal before updating
      setTrackingModal({ orderId: order.id, status: newStatus });
    } else {
      updateMutation.mutate({ id: order.id, status: newStatus });
    }
  };

  let orders = data?.data?.orders || [];
  if (search) {
    orders = orders.filter(o =>
      o.id.toLowerCase().includes(search) ||
      o.user?.name?.toLowerCase().includes(search) ||
      o.user?.email?.toLowerCase().includes(search)
    );
  }
  const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      {/* Tracking Number Modal */}
      {trackingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-display text-xl font-bold text-bark-900 mb-4">📦 Mark as Shipped</h3>
            <p className="text-sm text-bark-500 mb-4">Add tracking details so the customer can track their package.</p>
            <div className="space-y-3">
              <div>
                <label className="label">Courier Name</label>
                <SelectDropdown
                  value={courierName || 'Delhivery'}
                  onChange={(val) => setCourierName(val)}
                  options={[
                    { value: 'Delhivery', label: 'Delhivery' },
                    { value: 'Blue Dart', label: 'Blue Dart' },
                    { value: 'DTDC', label: 'DTDC' },
                    { value: 'Ekart', label: 'Ekart' },
                    { value: 'India Post', label: 'India Post' },
                    { value: 'Xpressbees', label: 'Xpressbees' },
                    { value: 'Shadowfax', label: 'Shadowfax' },
                    { value: 'Other', label: 'Other' },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="label">Tracking Number <span className="text-bark-400 font-normal">(optional)</span></label>
                <input
                  className="input"
                  placeholder="e.g. DEL1234567890"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() =>
                  updateMutation.mutate({
                    id: trackingModal.orderId,
                    status: trackingModal.status,
                    trackingNumber: trackingNumber || undefined,
                    courierName: courierName,
                  })
                }
                disabled={updateMutation.isPending}
                className="btn-primary flex-1"
              >
                {updateMutation.isPending ? 'Saving...' : '🚚 Mark Shipped'}
              </button>
              <button onClick={() => setTrackingModal(null)} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-bark-900">Orders</h2>
        <SelectDropdown
          value={status}
          onChange={(val) => setStatus(val)}
          options={STATUSES.map((s) => ({ value: s, label: s || 'All Statuses' }))}
        />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-spice-50 text-bark-600">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Order</th>
              <th className="text-left px-5 py-3 font-semibold">Customer</th>
              <th className="text-left px-5 py-3 font-semibold">Amount</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spice-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-spice-50">
                <td className="px-5 py-3">
                  <p className="font-mono text-xs text-bark-600">#{order.id.slice(-8).toUpperCase()}</p>
                  {order.trackingNumber && (
                    <p className="text-xs text-orange-600 mt-0.5">🚚 {order.trackingNumber}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-bark-900">{order.user?.name}</p>
                  <p className="text-xs text-bark-400">{order.user?.email}</p>
                </td>
                <td className="px-5 py-3 font-semibold text-bark-900">₹{order.totalAmount.toFixed(0)}</td>
                <td className="px-5 py-3">
                  <span className={`badge text-xs ${
                    order.status === 'DELIVERED' ? 'badge-green' :
                    order.status === 'CANCELLED' ? 'badge-red' : 'badge-gold'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <SelectDropdown
                    value={order.status}
                    onChange={(val) => handleStatusChange(order, val)}
                    options={STATUSES.filter(Boolean).map((s) => ({ value: s, label: s }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminProducts() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const search = (searchParams.get('search') || '').toLowerCase();
  const { data } = useQuery({ queryKey: ['admin-products'], queryFn: () => adminAPI.getProducts() });
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => productAPI.getCategories() });
  
  let products = data?.data?.products || [];
  if (search) {
    products = products.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.description?.toLowerCase().includes(search) ||
      p.category?.name?.toLowerCase().includes(search)
    );
  }
  const categories = catData?.data?.categories || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', categoryId: '', pricePerGram: '', stock: '', minOrderGram: '50', images: [], featured: false, isActive: true, flavorProfile: '', origin: ''
  });
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          images: Array.isArray(prev.images) ? [...prev.images, e.target.result] : [e.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: Array.isArray(prev.images) ? [...prev.images, urlInput.trim()] : [urlInput.trim()]
    }));
    setUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: (Array.isArray(prev.images) ? prev.images : []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', slug: '', description: '', categoryId: '', pricePerGram: '', stock: '', minOrderGram: '50', images: [], featured: false, isActive: true, flavorProfile: '', origin: '' });
    setUrlInput('');
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name, slug: p.slug, description: p.description || '', categoryId: p.categoryId,
      pricePerGram: p.pricePerGram, stock: p.stock, minOrderGram: p.minOrderGram,
      images: Array.isArray(p.images) ? [...p.images] : [], featured: p.featured, isActive: p.isActive,
      flavorProfile: p.flavorProfile || '', origin: p.origin || ''
    });
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createProduct(data),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); setIsModalOpen(false); toast.success('Product added'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error adding product')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); setIsModalOpen(false); toast.success('Product updated'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Error updating product')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries(['admin-products']); toast.success('Product deactivated'); }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      pricePerGram: parseFloat(formData.pricePerGram),
      stock: parseFloat(formData.stock),
      minOrderGram: parseFloat(formData.minOrderGram),
      images: Array.isArray(formData.images) ? formData.images : (typeof formData.images === 'string' ? formData.images.split(',').map(i => i.trim()).filter(Boolean) : [])
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-bark-900">Products</h2>
        <button onClick={openAddModal} className="btn-primary text-sm"><FiPlus /> Add Product</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-spice-50 text-bark-600">
            <tr>
              <th className="text-left px-5 py-3 font-semibold">Product</th>
              <th className="text-left px-5 py-3 font-semibold">Category</th>
              <th className="text-left px-5 py-3 font-semibold">Price/g</th>
              <th className="text-left px-5 py-3 font-semibold">Stock</th>
              <th className="text-left px-5 py-3 font-semibold">Status</th>
              <th className="text-left px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spice-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-spice-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img src={product.images?.[0] || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover bg-spice-100" />
                    <div>
                      <p className="font-medium text-bark-900">{product.name}</p>
                      {product.featured && <span className="badge-gold text-xs mt-1 block w-max">Featured</span>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-bark-600">{product.category?.name}</td>
                <td className="px-5 py-3 font-semibold text-bark-900">₹{product.pricePerGram}</td>
                <td className="px-5 py-3">
                  <span className={product.stock < 500 ? 'text-chilli-600 font-medium' : 'text-bark-700'}>
                    {product.stock.toFixed(0)}g
                  </span>
                </td>
                <td className="px-5 py-3">
                   {product.isActive ? <span className="badge-green text-xs">Active</span> : <span className="badge-red text-xs">Inactive</span>}
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(product)} className="p-1.5 text-bark-400 hover:text-blue-600 transition-colors"><FiEdit2 /></button>
                    <button onClick={() => { if(window.confirm('Deactivate product?')) deleteMutation.mutate(product.id) }} className="p-1.5 text-bark-400 hover:text-chilli-600 transition-colors"><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-spice-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-display font-bold text-xl text-bark-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-bark-400 hover:text-bark-900 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => {
                     setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') })
                  }} className="input" />
                </div>
                <div>
                  <label className="label">Slug</label>
                  <input required type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <SelectDropdown
                    value={formData.categoryId || ''}
                    onChange={(val) => setFormData({ ...formData, categoryId: val })}
                    placeholder="Select Category"
                    options={[
                      { value: '', label: 'Select Category' },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="label">Price per Gram (₹)</label>
                  <input required type="number" step="0.01" value={formData.pricePerGram} onChange={(e) => setFormData({ ...formData, pricePerGram: e.target.value })} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Current Stock (g)</label>
                  <input required type="number" step="0.1" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Min Order (g)</label>
                  <input required type="number" step="0.1" value={formData.minOrderGram} onChange={(e) => setFormData({ ...formData, minOrderGram: e.target.value })} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Flavor Profile</label>
                  <input type="text" value={formData.flavorProfile} onChange={(e) => setFormData({ ...formData, flavorProfile: e.target.value })} className="input" placeholder="e.g. Earthy, Warm" />
                </div>
                <div>
                  <label className="label">Origin</label>
                  <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="input" placeholder="e.g. Kerala, India" />
                </div>
              </div>

              <div>
                <label className="label mb-2 block">Product Images</label>
                
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging 
                      ? 'border-chilli-500 bg-chilli-50/50' 
                      : 'border-spice-200 bg-spice-50 hover:border-spice-300'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <FiUploadCloud className={`text-3xl mb-2 ${isDragging ? 'text-chilli-600 animate-bounce' : 'text-bark-400'}`} />
                    <p className="text-sm font-medium text-bark-800">
                      Drag & drop images here, or <span className="text-chilli-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-bark-400 mt-1">Supports PNG, JPG, WEBP (converted instantly)</p>
                  </label>
                </div>

                {/* OR URL Input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                    className="input text-xs flex-1"
                    placeholder="Or paste an image URL here (https://...)"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-2 bg-spice-200 text-bark-800 hover:bg-spice-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Add URL
                  </button>
                </div>

                {/* Image Previews */}
                {(Array.isArray(formData.images) && formData.images.length > 0) && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-4">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-spice-200 bg-white aspect-square flex items-center justify-center shadow-sm">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity shadow"
                          title="Remove image"
                        >
                          <FiX className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                  <span className="text-sm font-medium text-bark-700">Featured Product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                  <span className="text-sm font-medium text-bark-700">Active (Visible to users)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-spice-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-bark-600 hover:bg-spice-50 rounded-xl font-medium">Cancel</button>
                <button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading} className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: <FiTrendingUp />, exact: true },
    { to: '/admin/orders', label: 'Orders', icon: <FiPackage /> },
    { to: '/admin/products', label: 'Products', icon: <GiChiliPepper /> },
  ];

  return (
    <div className="min-h-screen bg-spice-50">
      <div className="section py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-3">
              <div className="px-3 py-2 mb-2">
                <p className="font-display font-bold text-bark-900">Admin Panel</p>
                <p className="text-xs text-bark-400">MacawSpice</p>
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    (item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to))
                      ? 'bg-chilli-600 text-white'
                      : 'text-bark-600 hover:bg-spice-50'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-4">
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
