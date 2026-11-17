// ═══════════════════════════════════════════════════════════
// ZAAVO — React App Entry Point
// src/main.jsx
// ═══════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import store from './store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1A1A1A',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#AEEA00', secondary: '#000' },
            },
            error: {
              iconTheme: { primary: '#FF5722', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
