import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { FiUser, FiPackage, FiBookmark, FiMapPin, FiEdit2, FiLogOut } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, orderAPI, blendAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AccountPage() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders');

  const queryClient = useQueryClient();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });

  const { data: profileData } = useQuery({ queryKey: ['my-profile'], queryFn: () => authAPI.getMe() });
  const { data: ordersData } = useQuery({ queryKey: ['my-orders'], queryFn: () => orderAPI.getMine() });
  const { data: blendsData } = useQuery({ queryKey: ['my-blends'], queryFn: () => blendAPI.getMine() });

  const addAddressMutation = useMutation({
    mutationFn: (data) => authAPI.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      setShowAddressForm(false);
      setNewAddress({ label: 'Home', line1: '', line2: '', city: '', state: '', pincode: '' });
      toast.success('Address added successfully!');
    },
    onError: () => toast.error('Failed to add address')
  });

  const handleAddAddress = (e) => {
    e.preventDefault();
    addAddressMutation.mutate(newAddress);
  };

  const profile = profileData?.data?.user;
  const orders = ordersData?.data?.orders || [];
  const savedBlends = blendsData?.data?.savedBlends || [];

  const tabs = [
    { id: 'orders', label: 'Orders', icon: <FiPackage /> },
    { id: 'blends', label: 'Saved Blends', icon: <FiBookmark /> },
    { id: 'addresses', label: 'Addresses', icon: <FiMapPin /> },
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
  ];

  return (
    <div className="min-h-screen bg-spice-50 py-8">
      <div className="section">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-chilli-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.name?.[0]?.toUpperCase() || <FiUser />}
                </div>
                <div>
                  <p className="font-bold text-bark-900">{profile?.name}</p>
                  <p className="text-sm text-bark-500 truncate max-w-32">{profile?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-spice-50 rounded-lg p-2">
                  <p className="font-bold text-bark-900">{orders.length}</p>
                  <p className="text-bark-500 text-xs">Orders</p>
                </div>
                <div className="bg-spice-50 rounded-lg p-2">
                  <p className="font-bold text-bark-900">{savedBlends.length}</p>
                  <p className="text-bark-500 text-xs">Blends</p>
                </div>
                <div className="bg-spice-50 rounded-lg p-2">
                  <p className="font-bold text-bark-900">{profile?.addresses?.length || 0}</p>
                  <p className="text-bark-500 text-xs">Addrs</p>
                </div>
              </div>
            </div>

            <div className="card p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`account-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    activeTab === tab.id ? 'bg-chilli-600 text-white' : 'text-bark-600 hover:bg-spice-50'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-chilli-600 hover:bg-chilli-50 transition-all mt-1"
              >
                <FiLogOut /> Sign Out
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-bark-900 mb-4">My Orders</h2>
                {orders.length === 0 ? (
                  <div className="card p-12 text-center text-bark-400">
                    <FiPackage className="text-5xl mx-auto mb-3 text-spice-300" />
                    <p>No orders yet. <Link to="/products" className="text-chilli-600 font-medium">Start shopping!</Link></p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xs text-bark-400 mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm text-bark-600">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div className="text-right">
                            <span className={`badge text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                              {order.status}
                            </span>
                            <p className="font-bold text-bark-900 mt-1">₹{order.totalAmount.toFixed(0)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-bark-500 mb-3">
                          {order.items.slice(0, 3).map((item) => (
                            <span key={item.id} className="bg-spice-50 px-2 py-0.5 rounded-full text-xs">
                              {item.product?.name || item.blendName || 'Custom Blend'}
                            </span>
                          ))}
                          {order.items.length > 3 && <span className="text-xs text-bark-400">+{order.items.length - 3} more</span>}
                        </div>
                        <Link to={`/orders/${order.id}`} className="text-sm text-chilli-600 font-medium hover:underline" id={`view-order-${order.id}`}>
                          View Details →
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved Blends Tab */}
            {activeTab === 'blends' && (
              <div>
                <h2 className="font-display text-2xl font-bold text-bark-900 mb-4">Saved Blends</h2>
                {savedBlends.length === 0 ? (
                  <div className="card p-12 text-center text-bark-400">
                    <FiBookmark className="text-5xl mx-auto mb-3 text-spice-300" />
                    <p>No saved blends. <Link to="/mixer" className="text-chilli-600 font-medium">Visit the Spice Mixer!</Link></p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {savedBlends.map((saved) => (
                      <div key={saved.id} className="card p-4">
                        <img
                          src={saved.blendTemplate.imageUrl || '/images/macaw_product_banner.png'}
                          alt={saved.blendTemplate.name}
                          className="w-full h-32 object-cover rounded-xl mb-3"
                        />
                        <h3 className="font-semibold text-bark-900">{saved.customName || saved.blendTemplate.name}</h3>
                        <p className="text-xs text-bark-500 mt-1">{saved.blendTemplate.items?.length} spices</p>
                        <Link to="/mixer" className="btn-primary text-sm py-2 mt-3 w-full text-center">
                          Open in Mixer
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-2xl font-bold text-bark-900">My Addresses</h2>
                  <button 
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    {showAddressForm ? 'Cancel' : '+ Add Address'}
                  </button>
                </div>
                
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="card p-6 mb-6 bg-spice-50/50">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Label (e.g. Home, Work)</label>
                        <input required className="input" value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label">Address Line 1</label>
                        <input required className="input" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label">Address Line 2 (Optional)</label>
                        <input className="input" value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} />
                      </div>
                      <div>
                        <label className="label">City</label>
                        <input required className="input" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input required className="input" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                      </div>
                      <div>
                        <label className="label">Pincode</label>
                        <input required className="input" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={addAddressMutation.isPending}
                      className="btn-primary mt-6 w-full py-3"
                    >
                      {addAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                    </button>
                  </form>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {profile?.addresses?.length === 0 && !showAddressForm && (
                    <div className="col-span-full p-8 text-center text-bark-400 border-2 border-dashed border-spice-200 rounded-2xl">
                      <FiMapPin className="text-4xl mx-auto mb-2 text-spice-300" />
                      <p>You haven't saved any addresses yet.</p>
                    </div>
                  )}
                  {profile?.addresses?.map((addr) => (
                    <div key={addr.id} className="card p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="badge-gold">{addr.label}</span>
                        {addr.isDefault && <span className="badge-green text-xs">Default</span>}
                      </div>
                      <p className="text-bark-700 text-sm leading-relaxed">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                        {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card p-6 max-w-md">
                <h2 className="font-display text-2xl font-bold text-bark-900 mb-6">Profile Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" defaultValue={profile?.name} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="input" value={profile?.email || ''} disabled className="input opacity-60 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" defaultValue={profile?.phone || ''} placeholder="+91 ..." />
                  </div>
                  <button className="btn-primary w-full py-3" id="save-profile-btn">Save Changes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
