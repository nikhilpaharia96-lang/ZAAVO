// ═══════════════════════════════════════════════════════════
// ZAAVO — Profile Page
// src/pages/Profile.jsx
// Tabs: Overview · Orders · Wishlist · Addresses · Subscription
// ═══════════════════════════════════════════════════════════

import { useState, useEffect }       from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector }  from 'react-redux';
import { motion, AnimatePresence }   from 'framer-motion';
import {
  User, Package, Heart, MapPin, Crown,
  Settings, LogOut, Edit2, Plus, Trash2,
  ChevronRight, Star, Shield, Gift,
  Loader2, Check,
} from 'lucide-react';
import { fetchMyOrders, toggleWishlist, selectIsWishlisted } from '../store';
import { userAPI, subscriptionAPI }  from '../services/api';
import { useAuth }                   from '../hooks/useAuth';
import toast                         from 'react-hot-toast';

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: User    },
  { id: 'orders',       label: 'Orders',       icon: Package },
  { id: 'wishlist',     label: 'Wishlist',     icon: Heart   },
  { id: 'addresses',    label: 'Addresses',    icon: MapPin  },
  { id: 'subscription', label: 'Subscription', icon: Crown   },
];

export default function Profile() {
  const { tab: urlTab }  = useParams();
  const navigate         = useNavigate();
  const dispatch         = useDispatch();
  const { user, logout } = useAuth();
  const { list: orders, loading: ordersLoading } = useSelector(s => s.orders);
  const wishlist         = useSelector(s => s.wishlist.items);
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');
  const [editMode,  setEditMode]  = useState(false);
  const [profileForm, setProfileForm] = useState({
    name:           user?.name || '',
    phone:          user?.phone || '',
    dietPreference: user?.dietPreference || 'non-veg',
    fitnessGoal:    user?.fitnessGoal || 'none',
    institution:    user?.institution || '',
    city:           user?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading]     = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') dispatch(fetchMyOrders());
    if (activeTab === 'subscription') {
      setSubLoading(true);
      subscriptionAPI.getMine()
        .then(res => setSubscription(res.data.data.subscription))
        .catch(() => {})
        .finally(() => setSubLoading(false));
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
  }, [urlTab]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    navigate(`/profile/${id}`, { replace: true });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await userAPI.updateProfile(profileForm);
      setEditMode(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Total Orders',  value: user?.totalOrders || orders.length || '—' },
    { label: 'Total Spent',   value: user?.totalSpent ? `₹${user.totalSpent.toLocaleString()}` : '—' },
    { label: 'Loyalty Points',value: user?.loyaltyPoints?.toLocaleString() || '—' },
    { label: 'Wallet',        value: user?.walletBalance ? `₹${user.walletBalance}` : '₹0' },
  ];

  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-white/5 rounded-3xl p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-3xl text-white shrink-0">
              {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'ME'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-black text-2xl text-white">{user?.name}</h2>
                  <p className="text-gray-400 text-sm mt-0.5">{user?.email}</p>
                  {user?.institution && <p className="text-gray-500 text-xs mt-0.5">{user.institution} · {user.city}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditMode(!editMode)}
                    className="glass border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={logout}
                    className="glass border border-white/10 rounded-xl p-2.5 text-gray-400 hover:text-red-400 transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {user?.subscription?.isActive && (
                  <span className="tag-lime text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <Crown size={11} /> {user.subscription.plan?.replace('_', ' ')}
                  </span>
                )}
                {user?.isVerified && (
                  <span className="tag-blue text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <Shield size={11} /> Verified
                  </span>
                )}
                <span className="tag-orange text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <Gift size={11} /> {user?.referralCode}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/5">
            {stats.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display font-black text-xl text-white">{value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-white/5 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${activeTab === id ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <div>
                {editMode ? (
                  <div className="glass border border-white/5 rounded-3xl p-6">
                    <h3 className="font-display font-bold text-white text-lg mb-5">Edit Profile</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[['name','Full Name'],['phone','Phone'],['institution','College / Institution'],['city','City']].map(([f, label]) => (
                        <div key={f}>
                          <label className="text-gray-400 text-sm block mb-1.5">{label}</label>
                          <input value={profileForm[f]} onChange={e => setProfileForm(p => ({ ...p, [f]: e.target.value }))}
                            className="input-field w-full rounded-2xl px-4 py-3 text-sm" />
                        </div>
                      ))}
                      <div>
                        <label className="text-gray-400 text-sm block mb-1.5">Diet Preference</label>
                        <select value={profileForm.dietPreference} onChange={e => setProfileForm(p => ({ ...p, dietPreference: e.target.value }))}
                          className="input-field w-full rounded-2xl px-4 py-3 text-sm">
                          {['veg','non-veg','vegan','eggetarian'].map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm block mb-1.5">Fitness Goal</label>
                        <select value={profileForm.fitnessGoal} onChange={e => setProfileForm(p => ({ ...p, fitnessGoal: e.target.value }))}
                          className="input-field w-full rounded-2xl px-4 py-3 text-sm">
                          {['none','bulking','cutting','weight_loss','maintenance'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setEditMode(false)}
                        className="flex-1 btn-secondary py-3 rounded-2xl font-semibold text-sm">Cancel</button>
                      <button onClick={saveProfile} disabled={saving}
                        className="flex-1 btn-primary py-3 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ['Diet Preference', user?.dietPreference || '—', '🥗'],
                      ['Fitness Goal',    user?.fitnessGoal?.replace('_', ' ') || '—', '💪'],
                      ['User Type',       user?.userType || '—',  '🎓'],
                      ['Member Since',    user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—', '📅'],
                    ].map(([label, value, emoji]) => (
                      <div key={label} className="glass border border-white/5 rounded-2xl p-4">
                        <div className="text-2xl mb-2">{emoji}</div>
                        <div className="text-white font-semibold capitalize">{value}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ORDERS ── */}
            {activeTab === 'orders' && (
              <div>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-400 mb-4">No orders yet</p>
                    <Link to="/restaurants" className="btn-primary px-6 py-3 rounded-2xl font-bold text-sm">Order Now</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order, i) => (
                      <div key={order._id} className="glass border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">🍱</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white text-sm">{order.restaurant?.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'tag-lime' : order.status === 'cancelled' ? 'tag-red' : 'tag-orange'}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs truncate">{order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="font-bold text-white text-sm">₹{order.pricing?.total}</span>
                          </div>
                        </div>
                        <Link to={`/order/${order._id}/track`}
                          className="glass border border-white/8 rounded-xl p-2 text-gray-400 hover:text-orange-400 transition-colors shrink-0">
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── WISHLIST ── */}
            {activeTab === 'wishlist' && (
              <div>
                {wishlist.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">❤️</div>
                    <p className="text-gray-400 mb-4">Your wishlist is empty</p>
                    <Link to="/restaurants" className="btn-primary px-6 py-3 rounded-2xl font-bold text-sm">Explore Meals</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {wishlist.map((food, i) => (
                      <div key={food._id} className="glass border border-white/5 rounded-2xl p-4 card-hover">
                        <div className="text-4xl mb-3 text-center">{food.image || '🍽️'}</div>
                        <div className="font-semibold text-white text-sm truncate">{food.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5 truncate">{food.restaurant}</div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="font-bold text-orange-400">₹{food.price}</span>
                          <button onClick={() => dispatch(toggleWishlist(food))}
                            className="text-red-400 hover:text-red-300 transition-colors">
                            <Heart size={16} className="fill-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ADDRESSES ── */}
            {activeTab === 'addresses' && (
              <div className="space-y-3">
                {(user?.addresses || []).map(addr => (
                  <div key={addr._id} className="glass border border-white/5 rounded-2xl p-4 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <MapPin size={16} className="text-orange-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          {addr.label}
                          {addr.isDefault && <span className="tag-lime text-xs px-1.5 py-0.5 rounded-md">Default</span>}
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">{addr.line1}</div>
                        {addr.line2 && <div className="text-gray-400 text-xs">{addr.line2}</div>}
                        <div className="text-gray-500 text-xs">{addr.city} {addr.pincode}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="p-1.5 text-gray-500 hover:text-orange-400 transition-colors"><Edit2 size={14} /></button>
                      <button className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <button className="w-full glass border border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
                  <Plus size={16} /> Add New Address
                </button>
              </div>
            )}

            {/* ── SUBSCRIPTION ── */}
            {activeTab === 'subscription' && (
              <div>
                {subLoading ? (
                  <div className="skeleton h-40 rounded-3xl" />
                ) : subscription ? (
                  <div className="space-y-4">
                    <div className="glass-orange rounded-3xl p-6 relative overflow-hidden">
                      <div className="absolute -right-8 -top-8 text-8xl opacity-10">👑</div>
                      <span className="tag-orange text-xs px-3 py-1 rounded-full font-bold inline-block mb-3">Active Plan</span>
                      <h3 className="font-display font-black text-2xl text-white capitalize">
                        {subscription.plan?.replace('_', ' ')}
                      </h3>
                      <p className="text-gray-300 text-sm mt-1">
                        {subscription.mealsLeft} meals remaining · Renews {new Date(subscription.renewsAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-400">Meals used</span>
                          <span className="text-white font-bold">{subscription.mealsUsed} / {subscription.mealsTotal}</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="progress-bar" style={{ width: `${(subscription.mealsUsed / subscription.mealsTotal) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <Link to="/subscription" className="block">
                      <button className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-base">
                        Upgrade Plan →
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">👑</div>
                    <h3 className="font-display font-bold text-white text-xl mb-2">No Active Subscription</h3>
                    <p className="text-gray-400 text-sm mb-6">Subscribe for up to 30% savings on every meal</p>
                    <Link to="/subscription">
                      <button className="btn-primary px-8 py-4 rounded-2xl font-display font-bold text-base">
                        View Plans
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
