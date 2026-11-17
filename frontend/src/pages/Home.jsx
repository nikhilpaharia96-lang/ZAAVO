// ═══════════════════════════════════════════════════════════
// ZAAVO — Home Page (Landing)
// src/pages/Home.jsx
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate }           from 'react-router-dom';
import { useDispatch, useSelector }    from 'react-redux';
import { motion, useInView }           from 'framer-motion';
import {
  Search, MapPin, Zap, Flame, Star, Clock, Tag,
  ArrowRight, ChevronRight, Smartphone, Shield,
  TrendingUp, Copy, Check, Dumbbell,
} from 'lucide-react';
import { fetchRestaurants, fetchFoods, openFoodModal } from '../store';
import FoodCard from '../components/FoodCard';

// ── Animation helpers ─────────────────────────────────────
const FadeUp = ({ children, delay = 0, className = '' }) => {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity:0, y:28 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ duration:0.55, delay, ease:[0.22,1,0.36,1] }}
      className={className}>
      {children}
    </motion.div>
  );
};

// ── Data ──────────────────────────────────────────────────
const CATEGORIES = [
  { icon:'🍔', name:'Burgers' }, { icon:'🍕', name:'Pizza' },
  { icon:'🍛', name:'Biryani' }, { icon:'🥗', name:'Salads' },
  { icon:'🥤', name:'Shakes'  }, { icon:'🌯', name:'Wraps'  },
  { icon:'🍟', name:'Snacks'  }, { icon:'🍰', name:'Desserts'},
];

const OFFERS = [
  { code:'CAMPUS20', title:'Student Saver',    desc:'20% off orders above ₹199', icon:'🎓', color:'from-orange-600 to-red-600' },
  { code:'GYMPOWER', title:'Gym Warrior',      desc:'Free delivery on fitness meals',icon:'💪', color:'from-lime-600 to-green-600' },
  { code:'NIGHT50',  title:'Midnight Muncher', desc:'50% off after 10 PM',          icon:'🌙', color:'from-purple-600 to-indigo-600' },
  { code:'ZAAVO100', title:'First Order',      desc:'Flat ₹100 off first delivery', icon:'🎉', color:'from-blue-600 to-cyan-600' },
];

const TESTIMONIALS = [
  { name:'Rohan Sharma',  role:'IIT Delhi, 3rd Year',     text:'Finally an app that gets hostel life. Fast delivery, cheap prices, and the protein meals are 🔥', rating:5, init:'RS' },
  { name:'Priya Mehta',   role:'Gym Trainer, FitLife',    text:'My clients use ZAAVO for macro-tracked meals. The nutrition info is actually accurate!', rating:5, init:'PM' },
  { name:'Arjun Reddy',   role:'NIT Warangal, Final Year',text:'₹69 Maggi Stack at midnight? Campus Bites on ZAAVO is unbeatable. Saved exam season!', rating:5, init:'AR' },
  { name:'Sneha Patel',   role:'CrossFit Athlete',        text:'The bulking thali hits 1200 calories perfectly. No more meal prep drama!', rating:5, init:'SP' },
];

const STATS = [
  { value:'50+',   label:'Restaurants' },
  { value:'8k+',   label:'Orders/day' },
  { value:'15 min',label:'Avg delivery' },
  { value:'4.8★',  label:'App rating' },
];

// ── Home ──────────────────────────────────────────────────
export default function Home() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { list: restaurants, loading: restLoading } = useSelector(s => s.restaurants);
  const { foods,  loading: foodsLoading }           = useSelector(s => s.restaurants);
  const [location,   setLocation]   = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeMarquee, setActiveMarquee] = useState(true);

  useEffect(() => {
    dispatch(fetchRestaurants({ limit:6, sort:'-rating' }));
    dispatch(fetchFoods({ popular:true, limit:8 }));
  }, [dispatch]);

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const featuredRestaurants = restaurants.filter(r => r.isFeatured).slice(0, 3);
  const popularFoods        = foods.filter(f => f.isPopular).slice(0, 8);

  return (
    <div className="min-h-screen" style={{ paddingBottom:'80px' }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="bg-hero-gradient pt-28 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-orange-500/5 animate-blob pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-lime-500/4 animate-blob pointer-events-none" style={{ animationDelay:'3s' }} />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left copy */}
            <div className="flex-1 animate-fade-up">
              <div className="section-label tag-orange mb-5">
                <Zap size={12} className="text-orange-400" />
                Campus food delivery, redefined
              </div>

              <h1 className="hero-title font-display font-black text-white mb-5">
                Fuel your<br />
                <span className="gradient-text">grind</span>,<br />
                feed the <span className="text-orange-400">beast</span>.
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-lg">
                Premium meals for college warriors, gym beasts, and hostel survivors.
                Fast. Cheap. Protein-packed. Delivered in minutes.
              </p>

              {/* Location search */}
              <div className="flex gap-3 max-w-xl mb-8">
                <div className="flex-1 glass border border-white/10 rounded-2xl flex items-center gap-3 px-4 py-3.5">
                  <MapPin size={18} className="text-orange-400 shrink-0" />
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && navigate('/restaurants')}
                    className="bg-transparent flex-1 text-white placeholder-gray-500 outline-none text-sm"
                    placeholder="Your hostel, campus, or gym..." />
                </div>
                <button onClick={() => navigate('/restaurants')}
                  className="btn-primary px-6 py-3.5 rounded-2xl font-display font-bold flex items-center gap-2">
                  <Search size={18} />
                  <span className="hidden sm:inline">Find Food</span>
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                {STATS.map(({ value, label }) => (
                  <div key={label}>
                    <div className="font-display font-black text-2xl text-white">{value}</div>
                    <div className="text-gray-500 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right card */}
            <div className="flex-1 hidden lg:flex items-center justify-center animate-fade-in delay-300">
              <div className="relative">
                <div className="w-72 h-72 rounded-full bg-gradient-zaavo opacity-8 animate-spin-slow absolute inset-0 m-auto pointer-events-none" />
                <div className="glass border border-white/10 rounded-3xl p-8 text-center animate-float relative">
                  <div className="text-8xl mb-4">🍱</div>
                  <div className="font-display font-black text-white text-xl">Order in 30 seconds</div>
                  <div className="text-gray-400 text-sm mt-1">Track in real-time</div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="live-dot" />
                    <span className="text-lime-400 text-sm font-semibold">Delivering now</span>
                  </div>
                  {/* Mini order list */}
                  <div className="mt-4 space-y-2">
                    {['High Protein Bowl','Masala Maggi Stack'].map(item => (
                      <div key={item} className="flex items-center gap-2 glass rounded-xl px-3 py-2">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-gray-300 text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────── */}
      <div className="bg-orange-500/5 border-y border-orange-500/10 py-3 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].flatMap(() => [
            '🎓 Student Special 20% Off','💪 Free Protein Shake Today',
            '🌙 Midnight Deals After 10PM','⚡ Express 15-Min Delivery',
            '🏆 Top Rated Campus Meals','🌱 Vegan Options Available',
          ]).map((t, i) => (
            <span key={i} className="text-orange-300/70 text-sm font-medium mx-8">{t}</span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── CATEGORIES ────────────────────────────── */}
        <FadeUp className="py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-black text-2xl text-white">Browse by Category</h2>
              <p className="text-gray-500 text-sm mt-1">What are you craving today?</p>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map(({ icon, name }) => (
              <button key={name} onClick={() => navigate(`/restaurants?cuisine=${name}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-white/5 glass hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group">
                <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
                <span className="text-xs font-medium text-gray-300 text-center leading-tight">{name}</span>
              </button>
            ))}
          </div>
        </FadeUp>

        {/* ── HOT DEALS ─────────────────────────────── */}
        <FadeUp className="py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-black text-2xl text-white">Hot Deals 🔥</h2>
              <p className="text-gray-500 text-sm mt-1">Limited time, unlimited cravings</p>
            </div>
            <Link to="/offers" className="text-orange-400 text-sm font-semibold flex items-center gap-1 hover:text-orange-300 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OFFERS.map(offer => (
              <div key={offer.code} className={`bg-gradient-to-br ${offer.color} rounded-2xl p-5 relative overflow-hidden group card-hover`}>
                <div className="absolute -right-4 -top-4 text-6xl opacity-15 group-hover:opacity-25 transition-opacity">{offer.icon}</div>
                <div className="text-3xl mb-3">{offer.icon}</div>
                <h3 className="font-display font-black text-white text-lg mb-1">{offer.title}</h3>
                <p className="text-white/70 text-xs mb-4 leading-relaxed">{offer.desc}</p>
                <button onClick={() => copyCode(offer.code)}
                  className="flex items-center gap-2 bg-black/30 hover:bg-black/45 border border-white/20 rounded-xl px-3 py-2 transition-colors w-full">
                  <span className="font-bold text-white text-sm tracking-widest flex-1 text-left">{offer.code}</span>
                  {copiedCode === offer.code ? <Check size={14} className="text-lime-400" /> : <Copy size={14} className="text-white/60" />}
                </button>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* ── FEATURED RESTAURANTS ──────────────────── */}
        <FadeUp className="py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-black text-2xl text-white">Featured Spots</h2>
              <p className="text-gray-500 text-sm mt-1">Curated for campus life</p>
            </div>
            <Link to="/restaurants" className="text-orange-400 text-sm font-semibold flex items-center gap-1 hover:text-orange-300 transition-colors">
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {restLoading && featuredRestaurants.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(featuredRestaurants.length > 0 ? featuredRestaurants : restaurants.slice(0,3)).map((r, i) => (
                <motion.div key={r._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.08 }}>
                  <Link to={`/restaurants/${r._id}`}>
                    <div className="glass border border-white/5 rounded-2xl overflow-hidden card-hover group">
                      <div className={`h-40 bg-gradient-to-br ${['from-green-900/40 to-lime-900/40','from-orange-900/40 to-red-900/40','from-blue-900/40 to-purple-900/40'][i%3]} flex items-center justify-center relative`}>
                        <span className="text-7xl transition-transform duration-500 group-hover:scale-110">{r.logo || '🍽️'}</span>
                        {r.badges?.[0] && <span className="absolute top-3 left-3 tag-lime text-xs px-2.5 py-0.5 rounded-full font-bold">{r.badges[0]}</span>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-1.5">
                          <h3 className="font-display font-bold text-white text-base leading-tight">{r.name}</h3>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <Star size={13} className="star-filled fill-yellow-400" />
                            <span className="text-white text-sm font-bold">{r.rating?.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-xs mb-2">{r.cuisine?.join(' · ')}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={11}/>{r.estimatedTime}</span>
                          <span>·</span>
                          <span className={r.deliveryFee === 0 ? 'text-lime-400 font-semibold' : ''}>{r.deliveryFee === 0 ? 'FREE delivery' : `₹${r.deliveryFee} del`}</span>
                        </div>
                        {r.activeOffer && (
                          <div className="flex items-center gap-1.5 mt-3 bg-orange-500/8 border border-orange-500/15 rounded-xl px-3 py-1.5">
                            <Tag size={11} className="text-orange-400 shrink-0" />
                            <span className="text-orange-300 text-xs font-medium truncate">{r.activeOffer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </FadeUp>

        {/* ── TRENDING FOODS ────────────────────────── */}
        <FadeUp className="py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-black text-2xl text-white">Trending Now 🌶️</h2>
              <p className="text-gray-500 text-sm mt-1">What everyone's ordering</p>
            </div>
          </div>
          {foodsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularFoods.map((food, i) => <FoodCard key={food._id} food={food} index={i} />)}
            </div>
          )}
        </FadeUp>

        {/* ── GYM MEALS CTA ─────────────────────────── */}
        <FadeUp className="py-12">
          <div className="glass border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-lime-500/5 pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <div className="section-label tag-lime mb-3">
                  <Flame size={12} className="text-lime-400" /> Macro Tracked Meals
                </div>
                <h2 className="font-display font-black text-3xl text-white mb-2">Gym Warrior Meals</h2>
                <p className="text-gray-400">Scientifically crafted for your fitness goals</p>
              </div>
              <Link to="/fitness">
                <button className="btn-primary px-8 py-4 rounded-2xl font-display font-bold text-lg flex items-center gap-2 whitespace-nowrap">
                  <Dumbbell size={20} /> View Meal Plans
                </button>
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* ── TESTIMONIALS ──────────────────────────── */}
        <FadeUp className="py-12">
          <div className="text-center mb-8">
            <div className="section-label tag-orange mb-3 mx-auto w-fit">
              <Star size={12} className="text-orange-400" /> Real Students, Real Results
            </div>
            <h2 className="font-display font-black text-3xl text-white">Campus Loves ZAAVO</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.08 }}
                className="glass border border-white/5 rounded-2xl p-5 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-zaavo flex items-center justify-center font-bold text-white text-sm">{t.init}</div>
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role}</div>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_,i) => <Star key={i} size={13} className="star-filled fill-yellow-400" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
              </motion.div>
            ))}
          </div>
        </FadeUp>

        {/* ── SUBSCRIPTION CTA ──────────────────────── */}
        <FadeUp className="py-4">
          <div className="relative bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-8 sm:p-12 overflow-hidden">
            <div className="absolute -right-16 -bottom-16 text-[180px] opacity-10 pointer-events-none">💪</div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">Go Pro. Eat Better.</h2>
                <p className="text-orange-100 text-lg">Monthly meal plans crafted for your fitness goals. Starting ₹999/month.</p>
              </div>
              <Link to="/subscription">
                <button className="bg-white text-orange-600 font-display font-black px-8 py-4 rounded-2xl text-lg hover:bg-orange-50 transition-colors whitespace-nowrap flex items-center gap-2">
                  Start Subscription <ChevronRight size={20} />
                </button>
              </Link>
            </div>
          </div>
        </FadeUp>

        {/* ── APP DOWNLOAD ──────────────────────────── */}
        <FadeUp className="py-12">
          <div className="glass border border-white/5 rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="font-display font-black text-3xl text-white mb-3">Get the ZAAVO App</h2>
              <p className="text-gray-400 mb-6">Order faster. Track live. Never miss a deal. Available on iOS & Android.</p>
              <div className="flex flex-wrap gap-3">
                {[['🍎','App Store','Download on the'],['🤖','Google Play','Get it on']].map(([e,n,pre]) => (
                  <button key={n} className="flex items-center gap-3 glass border border-white/10 rounded-2xl px-5 py-3 hover:border-white/20 transition-colors">
                    <span className="text-2xl">{e}</span>
                    <div className="text-left">
                      <div className="text-gray-400 text-xs">{pre}</div>
                      <div className="font-bold text-white text-sm">{n}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="text-8xl animate-float shrink-0">📱</div>
          </div>
        </FadeUp>
      </div>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4 mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white">Z</div>
                <span className="font-display font-black text-xl text-white">ZAAVO</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">Campus food & fitness delivery for the next generation of achievers.</p>
            </div>
            {[
              ['Company',  ['About Us','Careers','Blog','Press Kit']],
              ['For Users',['How it Works','Partner with Us','Gift Cards','Referrals']],
              ['Legal',    ['Privacy Policy','Terms of Use','Cookie Policy','FSSAI License']],
            ].map(([title, links]) => (
              <div key={title}>
                <h4 className="font-display font-bold text-white mb-3 text-sm">{title}</h4>
                <ul className="space-y-2">
                  {links.map(l => <li key={l}><a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2025 ZAAVO. All rights reserved. Made for campus warriors.</p>
            <div className="flex items-center gap-5 text-gray-600 text-xs">
              <span className="flex items-center gap-1"><Shield size={12} />Secure Payments</span>
              <span className="flex items-center gap-1"><Zap size={12} />Fast Delivery</span>
              <span className="flex items-center gap-1"><TrendingUp size={12} />Trusted by 8k+ students</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
