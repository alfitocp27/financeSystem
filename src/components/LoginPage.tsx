import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Eye, EyeOff, Mail, User as UserIcon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
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

    if (mode === 'forgot') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        setErrorMsg('Silakan masukkan alamat email yang valid');
        return;
      }

      setIsSubmitting(true);
      const { error } = await resetPassword(cleanEmail);
      setIsSubmitting(false);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate') || msg.includes('429')) {
          setErrorMsg('Terlalu banyak permintaan. Silakan tunggu beberapa menit sebelum mencoba kembali.');
        } else {
          setErrorMsg('Gagal mengirim tautan pemulihan. Silakan periksa koneksi internet Anda.');
        }
      } else {
        setSuccessMsg('Jika email terdaftar, tautan pemulihan kata sandi telah dikirim ke kotak masuk atau folder spam email Anda.');
        setEmail('');
      }
      return;
    }

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
    <div className="min-h-screen w-full bg-bg-primary flex items-center justify-center p-4 sm:p-6 text-text-primary selection:bg-primary-soft selection:text-text-gold">
      {/* Minimalist Centered Card matching Obsidian & Muted Gold theme */}
      <div className="w-full max-w-[420px] bg-surface rounded-2xl border border-border-default shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="pt-10 pb-8 px-7 sm:px-8">
          {/* Central Geometric Burst Icon */}
          <div className="flex justify-center mb-5">
            <svg
              className="w-10 h-10 text-text-gold"
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
            <h1 className="text-xl font-bold text-text-primary tracking-tight">
              {mode === 'login'
                ? 'Masuk ke SakuMhs'
                : mode === 'register'
                ? 'Daftar Akun SakuMhs'
                : 'Pemulihan Kata Sandi'}
            </h1>
            <p className="text-xs text-text-secondary mt-1.5 leading-snug">
              {mode === 'login'
                ? 'Selamat datang kembali! Masukkan detail akunmu.'
                : mode === 'register'
                ? 'Mulai kelola uang saku dan target tabunganmu.'
                : 'Masukkan email mahasiswa Anda untuk menerima tautan pemulihan kata sandi.'}
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-4 p-3 bg-semantic-amber-soft border border-semantic-amber/20 rounded-xl text-xs text-semantic-amber-text flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-semantic-amber shrink-0 mt-0.5" />
              <span>
                Supabase belum dikonfigurasi di <code>.env</code>.
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5" htmlFor="fullName">
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
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-elevated border border-border-default text-xs font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-gold-focus transition-all"
                  />
                  <UserIcon className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5" htmlFor="email">
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
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-elevated border border-border-default text-xs font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-gold-focus transition-all"
                />
                <Mail className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input (Only for login and register) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-text-secondary" htmlFor="password">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs text-text-muted hover:text-text-gold transition-colors"
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
                    className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-elevated border border-border-default text-xs font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-gold-focus transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me Checkbox */}
            {mode === 'login' && (
              <div className="pt-0.5 pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-elevated border-border-default text-primary focus:ring-0 focus:outline-none cursor-pointer"
                  />
                  <span className="text-xs text-text-secondary">Ingat saya</span>
                </label>
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose-text font-medium animate-in fade-in">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-semantic-green-soft border border-semantic-green/20 rounded-xl text-xs text-semantic-green-text font-medium animate-in fade-in">
                {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk ke Akun'
                  : mode === 'register'
                  ? 'Daftar Sekarang'
                  : 'Kirim Tautan Pemulihan'}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Footer Strip */}
        <div className="py-4 px-7 border-t border-border-subtle text-center bg-surface-elevated space-y-2">
          {mode === 'forgot' ? (
            <p className="text-xs text-text-secondary">
              Sudah ingat kata sandi Anda?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-text-gold hover:text-primary-focus font-semibold transition-colors"
              >
                Kembali ke Masuk
              </button>
            </p>
          ) : (
            <p className="text-xs text-text-secondary">
              {mode === 'login' ? 'Belum punya akun? ' : 'Sudah memiliki akun? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-text-gold hover:text-primary-focus font-semibold transition-colors"
              >
                {mode === 'login' ? 'Daftar gratis' : 'Masuk di sini'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
