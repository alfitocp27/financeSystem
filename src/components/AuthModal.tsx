import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
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
        setSuccessMsg('Pendaftaran berhasil! Cek email untuk konfirmasi (jika diaktifkan) atau langsung masuk.');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isConfigured && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Kunci Supabase belum diset di <code>.env</code>. Anda saat ini menikmati fitur dalam mode demo lokal.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Nama Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
            <input
              type="email"
              placeholder="nama@kampus.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Password</label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg(null);
            }}
            className="text-xs text-indigo-600 hover:underline font-semibold"
          >
            {mode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk'}
          </button>
        </div>
      </div>
    </div>
  );
};
