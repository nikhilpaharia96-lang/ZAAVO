import { useState }            from 'react';
import { Link }                from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Building2, Loader2, ChevronRight } from 'lucide-react';
import { useAuth }             from '../hooks/useAuth';

const STEPS = ['Basic Info', 'Campus Details', 'Verify OTP'];

export default function Signup() {
  const { register, loading, error, clearAuthError } = useAuth();
  const [step, setStep]   = useState(0);
  const [otp,  setOtp]    = useState(['', '', '', '', '', '']);
  const [form, setForm]   = useState({
    name: '', email: '', phone: '', password: '',
    userType: 'student', institution: '', hostelBlock: '', city: '',
  });

  const update = (field, val) => { clearAuthError(); setForm(p => ({ ...p, [field]: val })); };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };

  const handleNext = async () => {
    if (step < 2) { setStep(s => s + 1); return; }
    await register(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-hero-gradient">
      <motion.div initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-zaavo flex items-center justify-center font-display font-black text-white text-2xl">Z</div>
          </Link>
          <h1 className="font-display font-black text-3xl text-white">Join ZAAVO 🚀</h1>
          <p className="text-gray-400 mt-2 text-sm">Campus food, your way</p>
          <div className="flex gap-1 justify-center mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-orange-500 w-8' : 'bg-white/10 w-4'}`} />
            ))}
          </div>
        </div>

        <div className="glass border border-white/10 rounded-3xl p-7">
          <h3 className="font-display font-bold text-white text-lg mb-5">{STEPS[step]}</h3>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">{error}</div>}

          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              transition={{ duration:0.2 }} className="space-y-4">

              {step === 0 && (
                <>
                  {[['name','Full Name','text',User],['email','Email','email',Mail],['phone','Phone','tel',Phone]].map(([f,p,t,Ic]) => (
                    <div key={f}>
                      <label className="text-gray-400 text-sm block mb-1.5 capitalize">{p}</label>
                      <div className="relative">
                        <Ic size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type={t} value={form[f]} onChange={e => update(f, e.target.value)}
                          className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm" placeholder={`Enter your ${p.toLowerCase()}`} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-gray-400 text-sm block mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                        className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm" placeholder="Min 6 characters" />
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  {[['institution','College / Institution',Building2],['hostelBlock','Hostel Block (optional)',Building2],['city','City',Building2]].map(([f,p,Ic]) => (
                    <div key={f}>
                      <label className="text-gray-400 text-sm block mb-1.5">{p}</label>
                      <div className="relative">
                        <Ic size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input value={form[f]} onChange={e => update(f, e.target.value)}
                          className="input-field w-full rounded-2xl pl-11 pr-4 py-3.5 text-sm" placeholder={p} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">I am a...</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[['student','🎓 Student'],['hostelite','🏠 Hostelite'],['gym_goer','💪 Gym Goer'],['faculty','🏫 Faculty']].map(([v,l]) => (
                        <button key={v} onClick={() => update('userType', v)}
                          className={`py-2.5 rounded-2xl text-sm font-semibold transition-all border ${form.userType===v ? 'border-orange-500/50 bg-orange-500/10 text-orange-400' : 'border-white/5 glass text-gray-400 hover:text-white'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="text-center">
                  <div className="text-4xl mb-3">📱</div>
                  <p className="text-gray-400 text-sm mb-6">Enter the 6-digit OTP sent to <span className="text-white font-semibold">{form.phone}</span></p>
                  <div className="flex gap-2 justify-center mb-5">
                    {otp.map((d, i) => (
                      <input key={i} id={`otp-${i}`} maxLength={1} value={d}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`otp-${i-1}`)?.focus()}
                        className="w-11 h-14 text-center font-bold text-xl input-field rounded-xl" />
                    ))}
                  </div>
                  <button className="text-orange-400 text-sm hover:text-orange-300 transition-colors">Resend OTP in 30s</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button onClick={handleNext} disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl font-display font-bold text-lg mt-6 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
            {step === 2 ? '🎉 Create Account' : <>Continue <ChevronRight size={18} /></>}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Have an account? <Link to="/login" className="text-orange-400 font-semibold">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
