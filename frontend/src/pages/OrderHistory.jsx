import { useEffect, useState } from 'react';
import { Link }                from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion }              from 'framer-motion';
import { ChevronRight, RotateCcw } from 'lucide-react';
import { fetchMyOrders }       from '../store';

const STATUS_COLORS = {
  placed:           'tag-orange',
  confirmed:        'tag-blue',
  preparing:        'tag-orange',
  out_for_delivery: 'tag-blue',
  delivered:        'tag-lime',
  cancelled:        'tag-red',
};

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.orders);
  const [filter, setFilter] = useState('all');

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  const filtered = filter === 'all' ? list : list.filter(o => o.status === filter);

  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-black text-3xl text-white mb-6">My Orders</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          {['all','delivering','delivered','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter===f ? 'bg-gradient-zaavo text-white' : 'glass border border-white/5 text-gray-400 hover:text-white'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order, i) => (
              <motion.div key={order._id}
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className="glass border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl shrink-0">
                    🍱
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{order.restaurant?.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'tag-orange'}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs truncate">
                      {order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold text-white text-sm">₹{order.pricing?.total}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                  <Link to={`/order/${order._id}/track`} className="flex-1 text-center text-xs text-orange-400 font-semibold hover:text-orange-300 transition-colors flex items-center justify-center gap-1">
                    Track <ChevronRight size={13} />
                  </Link>
                  <button className="flex-1 text-center text-xs text-gray-400 font-semibold hover:text-white transition-colors flex items-center justify-center gap-1">
                    <RotateCcw size={13} /> Reorder
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
