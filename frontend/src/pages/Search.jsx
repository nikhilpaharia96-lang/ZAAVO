// ═══════════════════════════════════════════════════════════
// ZAAVO — Search Page
// src/pages/Search.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate }   from 'react-router-dom';
import { useDispatch }   from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { openFoodModal, addToCart } from '../store';
import { searchAll }     from '../services/api';
import FoodCard          from '../components/FoodCard';
import toast             from 'react-hot-toast';

const TRENDING_SEARCHES  = ['Protein Bowl', 'Masala Maggi', 'Biryani', 'Vegan Wrap', 'Keto Platter', 'Protein Shake', 'Budget Meal', 'Grilled Chicken'];
const RECENT_KEY         = 'zaavo_recent_searches';

const getRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
};
const addRecent = (q) => {
  const prev = getRecent().filter(r => r !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 6)));
};

export default function Search() {
  const dispatch  = useNavigate();
  const navigate  = useNavigate();
  const reduxDispatch = useDispatch();
  const inputRef  = useRef(null);

  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState({ foods: [], restaurants: [] });
  const [loading,  setLoading]  = useState(false);
  const [recent,   setRecent]   = useState(getRecent());
  const [debTimer, setDebTimer] = useState(null);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setResults({ foods: [], restaurants: [] }); return; }
    setLoading(true);
    try {
      const data = await searchAll(q);
      setResults(data);
    } catch {
      setResults({ foods: [], restaurants: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debTimer);
    setDebTimer(setTimeout(() => doSearch(val), 350));
  };

  const handleSubmit = (q = query) => {
    if (!q.trim()) return;
    addRecent(q.trim());
    setRecent(getRecent());
    doSearch(q);
  };

  const clearQuery = () => {
    setQuery('');
    setResults({ foods: [], restaurants: [] });
    inputRef.current?.focus();
  };

  const hasResults = results.foods.length > 0 || results.restaurants.length > 0;
  const showEmpty  = query.length >= 2 && !loading && !hasResults;

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative mb-6">
          <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="input-field w-full rounded-2xl pl-12 pr-12 py-4 text-base"
            placeholder="Search meals, restaurants, cuisines..."
          />
          <AnimatePresence>
            {query && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearQuery}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {/* No query state — show trending + recent */}
        {!query && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Recent searches */}
            {recent.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" /> Recent
                  </h3>
                  <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}
                    className="text-gray-500 text-xs hover:text-white transition-colors">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map(r => (
                    <button key={r} onClick={() => { setQuery(r); handleSubmit(r); }}
                      className="filter-chip px-4 py-2 rounded-full flex items-center gap-1.5 glass">
                      <Clock size={11} className="text-gray-500" /> {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending searches */}
            <div>
              <h3 className="font-display font-bold text-white flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-orange-400" /> Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((t, i) => (
                  <motion.button key={t} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setQuery(t); handleSubmit(t); }}
                    className="filter-chip px-4 py-2 rounded-full flex items-center gap-1.5 glass">
                    🔥 {t}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-display font-bold text-white text-xl mb-2">No results for "{query}"</h3>
            <p className="text-gray-400 text-sm">Try a different keyword or browse all restaurants</p>
            <button onClick={() => navigate('/restaurants')}
              className="btn-primary mt-5 px-6 py-3 rounded-2xl font-bold text-sm inline-flex items-center gap-2">
              Browse All <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Restaurants section */}
            {results.restaurants.length > 0 && (
              <div className="mb-8">
                <h3 className="font-display font-bold text-white mb-4">
                  Restaurants <span className="text-gray-500 font-normal text-sm">({results.restaurants.length})</span>
                </h3>
                <div className="space-y-3">
                  {results.restaurants.map((r, i) => (
                    <motion.button key={r._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => navigate(`/restaurants/${r._id}`)}
                      className="w-full glass border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all text-left">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl shrink-0">
                        {r.logo || '🍽️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5 truncate">{r.cuisine?.join(', ')}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>⭐ {r.rating?.toFixed(1)}</span>
                          <span>·</span>
                          <span>{r.estimatedTime}</span>
                          <span>·</span>
                          <span className={r.isOpen ? 'text-lime-400' : 'text-red-400'}>
                            {r.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-gray-500 shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Foods section */}
            {results.foods.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-white mb-4">
                  Menu Items <span className="text-gray-500 font-normal text-sm">({results.foods.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.foods.map((food, i) => (
                    <FoodCard key={food._id} food={food} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
