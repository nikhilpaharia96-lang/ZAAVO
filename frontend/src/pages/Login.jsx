// ═══════════════════════════════════════════════════════════
// ZAAVO — Login Page
// src/pages/Login.jsx
// ═══════════════════════════════════════════════════════════

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, loading, error, clearAuthError } = useAuth();
  const [form,     setForm]     = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    clearAuthError();
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-hero-gradient">
      {/* BG decorations */}
      <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-orange-500/5 animate-blob pointer-events-none" />
      <div className="fixed -bottom-32 -left-32 w-80 h-80 rounded-full bg-lime-500/4 animate-blob pointer-events-none" style={{ animationDelay: '3s' }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-2xl">Z</div>
          </Link>
          <h1 className="font-display font-black text-3xl text-white">Welcome back!</h1>
          <p className="text-gray-400 mt-2 text-sm">Sign in to your ZAAVO account</p>
        </div>

        <div className="glass border border-white/10 rounded-3xl p-7">
          {/* Google */}
          <button className="w-full flex items-center justify-center gap-3 glass border border-white/10 rounded-2xl py-3.5 mb-5 hover:border-white/20 hover:bg-white/5 transition-all font-semibold text-white text-sm">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-gray-500 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm font-medium block mb-1.5">Email or College ID</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  name="email" type="email" required
                  value={form.email} onChange={handleChange}
                  className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm"
                  placeholder="your@college.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 text-sm font-medium">Password</label>
                <Link to="/forgot-password" className="text-orange-400 text-xs hover:text-orange-300 transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  name="password" type={showPass ? 'text' : 'password'} required
                  value={form.password} onChange={handleChange}
                  className="input-field w-full rounded-2xl pl-11 pr-12 py-3.5 text-sm"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Signing in...</> : 'Sign In to ZAAVO'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            New here?{' '}
            <Link to="/signup" className="text-orange-400 font-semibold hover:text-orange-300 transition-colors">
              Create Account
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 glass border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-xs">
            Demo: <span className="text-orange-400 font-mono">rohan@iitd.ac.in</span> /{' '}
            <span className="text-orange-400 font-mono">Student@123</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// ZAAVO — Signup Page
// src/pages/Signup.jsx  (save separately)
// ═══════════════════════════════════════════════════════════

// import { useState }            from 'react';
// import { Link }                from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Mail, Lock, User, Phone, Building2, Loader2, ChevronRight } from 'lucide-react';
// import { useAuth }             from '../hooks/useAuth';
//
// const STEPS = ['Basic Info', 'Campus Details', 'Verify OTP'];
//
// export default function Signup() {
//   const { register, loading, error, clearAuthError } = useAuth();
//   const [step, setStep]   = useState(0);
//   const [otp,  setOtp]    = useState(['', '', '', '', '', '']);
//   const [form, setForm]   = useState({
//     name: '', email: '', phone: '', password: '',
//     userType: 'student', institution: '', hostelBlock: '', city: '',
//   });
//
//   const update = (field, val) => { clearAuthError(); setForm(p => ({ ...p, [field]: val })); };
//
//   const handleOtpChange = (i, val) => {
//     if (!/^\d?$/.test(val)) return;
//     const next = [...otp]; next[i] = val; setOtp(next);
//     if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
//   };
//
//   const handleNext = async () => {
//     if (step < 2) { setStep(s => s + 1); return; }
//     await register(form);
//   };
//
//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-hero-gradient">
//       <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
//         transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="w-full max-w-md">
//
//         <div className="text-center mb-8">
//           <Link to="/" className="inline-flex items-center gap-2 mb-5">
//             <div className="w-12 h-12 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-2xl">Z</div>
//           </Link>
//           <h1 className="font-display font-black text-3xl text-white">Join ZAAVO 🚀</h1>
//           <p className="text-gray-400 mt-2 text-sm">Campus food, your way</p>
//           <div className="flex gap-1 justify-center mt-4">
//             {STEPS.map((s, i) => (
//               <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-orange-500 w-8' : 'bg-white/10 w-4'}`} />
//             ))}
//           </div>
//         </div>
//
//         <div className="glass border border-white/10 rounded-3xl p-7">
//           <h3 className="font-display font-bold text-white text-lg mb-5">{STEPS[step]}</h3>
//
//           {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">{error}</div>}
//
//           <AnimatePresence mode="wait">
//             <motion.div key={step}
//               initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
//               transition={{ duration:0.2 }} className="space-y-4">
//
//               {step === 0 && (
//                 <>
//                   {[['name','Full Name','text',User],['email','Email','email',Mail],['phone','Phone','tel',Phone]].map(([f,p,t,Ic]) => (
//                     <div key={f}>
//                       <label className="text-gray-400 text-sm block mb-1.5 capitalize">{p}</label>
//                       <div className="relative">
//                         <Ic size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
//                         <input type={t} value={form[f]} onChange={e => update(f, e.target.value)}
//                           className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm" placeholder={`Enter your ${p.toLowerCase()}`} />
//                       </div>
//                     </div>
//                   ))}
//                   <div>
//                     <label className="text-gray-400 text-sm block mb-1.5">Password</label>
//                     <div className="relative">
//                       <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
//                       <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
//                         className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm" placeholder="Min 6 characters" />
//                     </div>
//                   </div>
//                 </>
//               )}
//
//               {step === 1 && (
//                 <>
//                   {[['institution','College / Institution',Building2],['hostelBlock','Hostel Block (optional)',Building2],['city','City',Building2]].map(([f,p,Ic]) => (
//                     <div key={f}>
//                       <label className="text-gray-400 text-sm block mb-1.5">{p}</label>
//                       <div className="relative">
//                         <Ic size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
//                         <input value={form[f]} onChange={e => update(f, e.target.value)}
//                           className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm" placeholder={p} />
//                       </div>
//                     </div>
//                   ))}
//                   <div>
//                     <label className="text-gray-400 text-sm block mb-2">I am a...</label>
//                     <div className="grid grid-cols-2 gap-2">
//                       {[['student','🎓 Student'],['hostelite','🏠 Hostelite'],['gym_goer','💪 Gym Goer'],['faculty','🏫 Faculty']].map(([v,l]) => (
//                         <button key={v} onClick={() => update('userType', v)}
//                           className={`py-2.5 rounded-2xl text-sm font-semibold transition-all border ${form.userType===v ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-white/5 glass text-gray-400 hover:text-white'}`}>
//                           {l}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </>
//               )}
//
//               {step === 2 && (
//                 <div className="text-center">
//                   <div className="text-4xl mb-3">📱</div>
//                   <p className="text-gray-400 text-sm mb-6">Enter the 6-digit OTP sent to <span className="text-white font-semibold">{form.phone}</span></p>
//                   <div className="flex gap-2 justify-center mb-5">
//                     {otp.map((d, i) => (
//                       <input key={i} id={`otp-${i}`} maxLength={1} value={d}
//                         onChange={e => handleOtpChange(i, e.target.value)}
//                         onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`otp-${i-1}`)?.focus()}
//                         className="w-11 h-14 text-center font-bold text-xl input-field rounded-xl" />
//                     ))}
//                   </div>
//                   <button className="text-orange-400 text-sm hover:text-orange-300 transition-colors">Resend OTP in 30s</button>
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//
//           <button onClick={handleNext} disabled={loading}
//             className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-lg mt-6 flex items-center justify-center gap-2">
//             {loading ? <Loader2 size={20} className="animate-spin" /> : null}
//             {step === 2 ? '🎉 Create Account' : <>Continue <ChevronRight size={18} /></>}
//           </button>
//
//           <p className="text-center text-gray-500 text-sm mt-4">
//             Have an account? <Link to="/login" className="text-orange-400 font-semibold">Login</Link>
//           </p>
//         </div>
//       </motion.div>
//     </div>
//   );
// }
