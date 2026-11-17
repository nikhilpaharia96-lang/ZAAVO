// ═══════════════════════════════════════════════════════════
// ZAAVO — Restaurants Page
// src/pages/Restaurants.jsx
// ═══════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link }          from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion }        from 'framer-motion';
import { Search, SlidersHorizontal, X, Star, Clock, MapPin, Tag, ChevronDown } from 'lucide-react';
import { fetchRestaurants, setFilters } from '../store';

// ── Filter config ─────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',       label: 'All',          query: {} },
  { id: 'open',      label: '🟢 Open Now',   query: {} },
  { id: 'top',       label: '⭐ Top Rated',  query: { sort: '-rating' } },
  { id: 'budget',    label: '💰 Budget',     query: {} },
  { id: 'fitness',   label: '💪 Fitness',    query: { cuisine: 'Fitness' } },
  { id: 'veg',       label: '🌿 Veg Only',   query: {} },
  { id: 'fast',      label: '⚡ Fast < 20m', query: {} },
  { id: 'new',       label: '🆕 New',        query: {} },
];

const SORT_OPTIONS = [
  { value: '-rating',    label: 'Top Rated' },
  { value: '-orders',    label: 'Most Popular' },
  { value: 'deliveryFee', label: 'Delivery Fee' },
  { value: 'time',       label: 'Delivery Time' },
];

// ── Skeleton Card ─────────────────────────────────────────
const RestaurantSkeleton = () => (
  <div className="glass border border-white/5 rounded-2xl overflow-hidden">
    <div className="skeleton h-40 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-3 w-full" />
    </div>
  </div>
);

// ── Restaurant Card ───────────────────────────────────────
const RestaurantCard = ({ r, index }) => {
  const BG = ['from-green-900/40 to-lime-900/40','from-orange-900/40 to-red-900/40','from-blue-900/40 to-purple-900/40','from-yellow-900/40 to-amber-900/40','from-teal-900/40 to-cyan-900/40','from-red-900/40 to-pink-900/40'];
  const bg = BG[index % BG.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/restaurants/${r._id}`}>
        <div className="glass border border-white/5 rounded-2xl overflow-hidden card-hover group">
          {/* Cover image */}
          <div className={`h-40 bg-gradient-to-br ${bg} flex items-center justify-center relative overflow-hidden`}>
            <span className="text-7xl transition-transform duration-500 group-hover:scale-110">
              {r.logo || '🍽️'}
            </span>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-1.5">
              {r.badges?.slice(0, 1).map(badge => (
                <span key={badge} className="tag-lime text-xs px-2 py-0.5 rounded-full font-bold">{badge}</span>
              ))}
            </div>

            {/* Closed overlay */}
            {!r.isOpen && (
              <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                <span className="glass border border-white/10 text-gray-300 text-sm px-4 py-1.5 rounded-full font-semibold">
                  Closed Now
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="font-display font-bold text-white text-base leading-tight flex-1">{r.name}</h3>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Star size={13} className="star-filled fill-yellow-400" />
                <span className="text-white text-sm font-bold">{r.rating?.toFixed(1)}</span>
              </div>
            </div>

            <p className="text-gray-400 text-xs mb-2 truncate">{r.cuisine?.join(' · ')}</p>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1"><Clock size={11} />{r.estimatedTime}</span>
              <span className="text-gray-700">·</span>
              <span className="flex items-center gap-1">
                {r.deliveryFee === 0
                  ? <><span className="text-lime-400 font-semibold">FREE</span> delivery</>
                  : <>₹{r.deliveryFee} delivery</>}
              </span>
            </div>

            {r.activeOffer && (
              <div className="flex items-center gap-1.5 bg-orange-500/8 border border-orange-500/15 rounded-xl px-3 py-1.5">
                <Tag size={11} className="text-orange-400 shrink-0" />
                <span className="text-orange-300 text-xs font-medium truncate">{r.activeOffer}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// ── Page ──────────────────────────────────────────────────
export default function Restaurants() {
  const dispatch  = useDispatch();
  const { list, total, loading, filters } = useSelector(s => s.restaurants);
  const [search,      setSearch]      = useState('');
  const [activeChip,  setActiveChip]  = useState('all');
  const [sortOpen,    setSortOpen]    = useState(false);
  const [activeSort,  setActiveSort]  = useState('-rating');
  const [page,        setPage]        = useState(1);
  const [allItems,    setAllItems]    = useState([]);
  const [hasMore,     setHasMore]     = useState(true);
  const loaderRef     = useRef(null);
  const debRef        = useRef(null);

  // Initial load
  useEffect(() => {
    setAllItems([]);
    setPage(1);
    setHasMore(true);
  }, [search, activeChip, activeSort]);

  useEffect(() => {
    dispatch(fetchRestaurants({ search, sort: activeSort, page, limit: 12 }));
  }, [dispatch, search, activeSort, page]);

  // Accumulate pages
  useEffect(() => {
    if (list.length === 0 && page === 1) { setAllItems([]); return; }
    if (page === 1) { setAllItems(list); }
    else { setAllItems(prev => {
      const ids = new Set(prev.map(r => r._id));
      return [...prev, ...list.filter(r => !ids.has(r._id))];
    }); }
    setHasMore(list.length === 12);
  }, [list, page]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) setPage(p => p + 1); },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading]);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => dispatch(setFilters({ search: val })), 400);
  };

  const handleChip = (chip) => {
    setActiveChip(chip.id);
    setSearch('');
    dispatch(fetchRestaurants({ ...chip.query, sort: activeSort, page: 1 }));
  };

  const handleSort = (sort) => {
    setActiveSort(sort);
    setSortOpen(false);
  };

  return (
    <div className="min-h-screen pt-28 pb-24 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="font-display font-black text-4xl text-white mb-1">All Restaurants</h1>
          <p className="text-gray-400 text-sm">
            {total > 0 ? `${total} restaurants near your campus` : 'Discovering restaurants...'}
          </p>
        </motion.div>

        {/* Search + Sort */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="input-field w-full rounded-2xl pl-11 pr-4 py-3 text-sm"
              placeholder="Search restaurants or cuisine..."
            />
            {search && (
              <button onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="glass border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-300 hover:text-white hover:border-white/20 transition-all text-sm font-medium whitespace-nowrap"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === activeSort)?.label || 'Sort'}</span>
              <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>

            {sortOpen && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 glass border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => handleSort(opt.value)}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${activeSort === opt.value ? 'text-orange-400 bg-orange-500/8' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                    {opt.label}
                    {activeSort === opt.value && <span className="float-right text-orange-400">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-7">
          {FILTER_CHIPS.map(chip => (
            <button key={chip.id} onClick={() => handleChip(chip)}
              className={`filter-chip px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${activeChip === chip.id ? 'active border-orange-500/50 bg-orange-500/8 text-white' : 'glass'}`}>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {allItems.length === 0 && !loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="font-display font-bold text-white text-xl mb-2">No restaurants found</h3>
            <p className="text-gray-400 text-sm mb-5">Try removing filters or searching something else</p>
            <button onClick={() => { setSearch(''); setActiveChip('all'); }}
              className="btn-primary px-6 py-3 rounded-2xl font-bold text-sm">
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {allItems.map((r, i) => (
                <RestaurantCard key={r._id} r={r} index={i} />
              ))}
              {/* Skeleton placeholders while loading */}
              {loading && page === 1 && [...Array(8)].map((_, i) => <RestaurantSkeleton key={`sk-${i}`} />)}
            </div>

            {/* Infinite scroll loader */}
            {hasMore && (
              <div ref={loaderRef} className="flex justify-center py-8">
                {loading && page > 1 && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    Loading more...
                  </div>
                )}
              </div>
            )}

            {!hasMore && allItems.length > 0 && (
              <p className="text-center text-gray-600 text-sm py-8">
                Showing all {allItems.length} restaurants · {total} total
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
