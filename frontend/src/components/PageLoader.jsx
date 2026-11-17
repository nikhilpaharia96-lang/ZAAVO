// ═══════════════════════════════════════════════════════════
// ZAAVO — PageLoader Component
// src/components/PageLoader.jsx
// ═══════════════════════════════════════════════════════════

import { motion } from 'framer-motion';

export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-zaavo-dark flex flex-col items-center justify-center z-50">
      {/* Animated logo */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-3xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-4xl mb-6 shadow-orange"
      >
        Z
      </motion.div>

      {/* Brand */}
      <div className="font-display font-black text-2xl text-white mb-1 tracking-tight">
        ZA<span className="gradient-text">AVO</span>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mt-6">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full bg-orange-500"
          />
        ))}
      </div>
    </div>
  );
}
