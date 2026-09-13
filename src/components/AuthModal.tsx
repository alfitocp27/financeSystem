import React, { useState } from 'react';
import { X, AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Email dan password harus diisi');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setErrorMsg('Nama lengkap harus diisi');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        onClose();
      }
    } else {
      const { error } = await signUp(email, password, fullName.trim());
      setIsSubmitting(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Pendaftaran berhasil! Silakan masuk dengan email dan password.');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg(null);
        }, 1200);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-[420px] bg-surface rounded-[20px] border border-border-default shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="pt-8 pb-4 px-7 sm:px-8 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Central Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shadow-xs">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-6">
            <h2 className="text-[20px] font-bold text-text-primary tracking-tight">
              {mode === 'login' ? 'Masuk ke SakuMhs' : 'Daftar Akun SakuMhs'}
            </h2>
            <p className="text-[13px] text-text-muted mt-1 leading-snug">
              {mode === 'login'
                ? 'Selamat datang kembali! Masukkan detail akunmu.'
                : 'Mulai kelola uang bulanan dan target tabunganmu.'}
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Supabase belum dikonfigurasi di <code>.env</code>. Anda saat ini aktif dalam mode demo lokal.
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[13px] font-semibold text-text-primary mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  placeholder="Dimas Pratama"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-text-muted"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-1">
                Email Kampus / Pribadi
              </label>
              <input
                type="email"
                placeholder="nama@kampus.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-primary mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-text-muted"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 bg-semantic-green-soft border border-semantic-green/20 rounded-xl text-xs text-semantic-green font-medium">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 mt-1"
            >
              {isSubmitting
                ? 'Memproses...'
                : mode === 'login'
                ? 'Masuk ke Akun'
                : 'Daftar Sekarang'}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-5 pb-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-primary-600 hover:underline font-semibold"
            >
              {mode === 'login'
                ? 'Belum punya akun? Buat akun sekarang'
                : 'Sudah memiliki akun? Masuk di sini'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
