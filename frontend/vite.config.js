// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@store': path.resolve(__dirname, './src/store'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom', 'react-router-dom'],
          redux:   ['@reduxjs/toolkit', 'react-redux'],
          motion:  ['framer-motion'],
          socket:  ['socket.io-client'],
        },
      },
    },
  },
});

// ─────────────────────────────────────────────────────────────
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export const tailwindConfig = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        zaavo: {
          orange:     '#FF5722',
          'orange-light': '#FF7043',
          lime:       '#AEEA00',
          'lime-dark':'#8BC34A',
          dark:       '#0A0A0A',
          'dark-2':   '#111111',
          'dark-3':   '#1A1A1A',
          'dark-4':   '#222222',
          gray:       '#888888',
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'float':      'float 4s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow':  'spin 20s linear infinite',
        'marquee':    'marquee 20s linear infinite',
        'blob':       'blob 8s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity:'0', transform:'translateY(30px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        fadeIn:    { from: { opacity:'0' }, to: { opacity:'1' } },
        float:     { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-12px)' } },
        pulseGlow: { '0%,100%': { boxShadow:'0 0 20px rgba(255,87,34,0.3)' }, '50%': { boxShadow:'0 0 40px rgba(255,87,34,0.6)' } },
        marquee:   { from: { transform:'translateX(0)' }, to: { transform:'translateX(-50%)' } },
        blob:      { '0%,100%': { borderRadius:'60% 40% 30% 70% / 60% 30% 70% 40%' }, '50%': { borderRadius:'30% 60% 70% 40% / 50% 60% 30% 60%' } },
        shimmer:   { from: { backgroundPosition:'-200% 0' }, to: { backgroundPosition:'200% 0' } },
      },
      backgroundImage: {
        'gradient-zaavo': 'linear-gradient(135deg, #FF5722, #FF7043)',
        'gradient-lime':  'linear-gradient(135deg, #AEEA00, #8BC34A)',
        'hero-radial':    'radial-gradient(ellipse at 20% 50%, rgba(255,87,34,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(174,234,0,0.08) 0%, transparent 50%)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};

// ─────────────────────────────────────────────────────────────
// postcss.config.js
export const postcssConfig = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
