import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff, Mail, User as UserIcon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, isConfigured, setDemoMode } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Email dan password wajib diisi');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(cleanEmail, password);
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials'
          ? 'Email atau password salah. Silakan periksa kembali.'
          : error.message);
      }
    } else {
      const { error } = await signUp(cleanEmail, password, fullName.trim());
      if (error) {
        setIsSubmitting(false);
        setErrorMsg(error.message);
      } else {
        // Automatically sign in the user immediately after sign up
        const { error: loginError } = await signIn(cleanEmail, password);
        setIsSubmitting(false);
        if (loginError) {
          setSuccessMsg('Akun berhasil dibuat! Silakan klik tombol Masuk.');
          setMode('login');
        }
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Minimalist Centered Card matching Stitch Reference 01_login_desktop */}
      <div className="w-full max-w-[420px] bg-white rounded-[20px] border border-[#E2E8F0] shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="pt-10 pb-8 px-7 sm:px-8">
          {/* Central Geometric Burst Icon from Stitch */}
          <div className="flex justify-center mb-5">
            <svg
              className="w-10 h-10 text-[#18181B]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.3"
              viewBox="0 0 24 24"
            >
              <line x1="12" x2="12" y1="2" y2="5" />
              <line x1="12" x2="12" y1="19" y2="22" />
              <line x1="4.93" x2="7.05" y1="4.93" y2="7.05" />
              <line x1="16.95" x2="19.07" y1="16.95" y2="19.07" />
              <line x1="2" x2="5" y1="12" y2="12" />
              <line x1="19" x2="22" y1="12" y2="12" />
              <line x1="4.93" x2="7.05" y1="19.07" y2="16.95" />
              <line x1="16.95" x2="19.07" y1="7.05" y2="4.93" />
            </svg>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-7">
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
              {mode === 'login' ? 'Masuk ke SakuMhs' : 'Daftar Akun SakuMhs'}
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-1.5 leading-snug">
              {mode === 'login'
                ? 'Selamat datang kembali! Masukkan detail akunmu.'
                : 'Mulai kelola uang saku dan target tabunganmu.'}
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Supabase belum dikonfigurasi di <code>.env</code>.
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-[13px] font-semibold text-[#1F2937] mb-1.5" htmlFor="fullName">
                  Nama Lengkap Mahasiswa
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Dimas Pratama"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                  />
                  <UserIcon className="w-4 h-4 text-[#9CA3AF] absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1F2937] mb-1.5" htmlFor="email">
                Email Mahasiswa
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="nama@kampus.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                />
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-semibold text-[#1F2937]" htmlFor="password">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Silakan hubungi administrator atau buat akun baru.')}
                    className="text-[13px] text-[#4B5563] hover:text-[#111827] transition-colors"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9CA3AF] hover:text-[#4B5563] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            {mode === 'login' && (
              <div className="pt-0.5 pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#6366F1] focus:ring-0 focus:outline-none cursor-pointer"
                  />
                  <span className="text-[13px] text-[#374151]">Ingat saya</span>
                </label>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-xs text-[#E11D48] font-medium animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs text-[#059669] font-medium animate-in fade-in">
                {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] active:scale-[0.99] text-white text-[13px] font-medium transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk ke Akun'
                  : 'Daftar Sekarang'}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer Strip */}
        <div className="py-4 px-7 border-t border-[#F1F3F5] text-center bg-white space-y-2">
          <p className="text-[13px] text-[#4B5563]">
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah memiliki akun? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[#6366F1] hover:text-[#4F46E5] font-semibold transition-colors"
            >
              {mode === 'login' ? 'Daftar gratis' : 'Masuk di sini'}
            </button>
          </p>

          <div>
            <button
              type="button"
              onClick={setDemoMode}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Atau coba dalam Mode Tamu (Offline) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
