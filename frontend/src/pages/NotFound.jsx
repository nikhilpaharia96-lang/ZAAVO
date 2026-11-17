import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center bg-hero-gradient">
      <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
        <div className="text-9xl mb-6 animate-float">🍔</div>
        <h1 className="font-display font-black text-6xl text-white mb-3">404</h1>
        <h2 className="font-display font-bold text-2xl text-gray-300 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Looks like this page got delivered to the wrong address. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary px-6 py-3 rounded-2xl font-display font-bold flex items-center gap-2">
            <Home size={18} /> Go Home
          </Link>
          <Link to="/search" className="btn-secondary px-6 py-3 rounded-2xl font-semibold flex items-center gap-2">
            <Search size={18} /> Search Food
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
