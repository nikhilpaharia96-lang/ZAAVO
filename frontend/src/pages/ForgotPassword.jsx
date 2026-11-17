// ═══════════════════════════════════════════════════════════
// ZAAVO — ForgotPassword Page
// src/pages/ForgotPassword.jsx
// ═══════════════════════════════════════════════════════════

import { useState }   from 'react';
import { Link }       from 'react-router-dom';
import { motion }     from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { authAPI }    from '../services/api';
import toast          from 'react-hot-toast';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-hero-gradient">
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
        className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{sent ? '📬' : '🔐'}</div>
          <h1 className="font-display font-black text-3xl text-white">
            {sent ? 'Check Your Email' : 'Forgot Password?'}
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {sent
              ? `We sent a reset link to ${email}`
              : "No worries! We'll send you a recovery link."}
          </p>
        </div>

        <div className="glass border border-white/10 rounded-3xl p-7">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-lime-500/15 border-2 border-lime-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-lime-400" />
              </div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                Click the link in your email to reset your password. The link expires in <span className="text-orange-400 font-semibold">30 minutes</span>.
              </p>
              <button onClick={() => setSent(false)}
                className="text-orange-400 text-sm font-semibold hover:text-orange-300 transition-colors">
                Didn't receive it? Send again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-medium block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm"
                    placeholder="your@college.edu" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={20} className="animate-spin" />Sending...</> : 'Send Recovery Link'}
              </button>
            </form>
          )}

          <Link to="/login" className="flex items-center justify-center gap-2 text-gray-500 text-sm hover:text-white transition-colors mt-5">
            <ArrowLeft size={15} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
