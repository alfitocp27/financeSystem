import React, { useState, useId, useMemo, useEffect } from 'react';
import {
  Calendar,
  Lock,
  User as UserIcon,
  ShieldCheck,
  Check,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Coins,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCycleInfo } from '../lib/budget-cycle';
import { formatDateIndo } from '../lib/formatters';
import { getInitials, isValidCycleDay } from '../lib/settings-utils';

interface SettingsViewProps {
  onShowToast?: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  const {
    user,
    profile,
    authProviderType,
    updateProfile,
    updateCycleStartDay,
    updatePassword,
    signOut,
  } = useAuth();

  // Unique IDs for accessibility
  const fullNameId = useId();
  const emailId = useId();
  const cycleDayId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  // Profile Form State
  const [fullName, setFullName] = useState<string>(profile?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Sync fullName if profile changes externally
  useEffect(() => {
    if (profile?.full_name !== undefined) {
      setFullName(profile.full_name || '');
    }
  }, [profile?.full_name]);

  // Financial Cycle State
  const currentSavedCycleDay = profile?.cycle_start_day || 25;
  const [candidateCycleDay, setCandidateCycleDay] = useState<number>(currentSavedCycleDay);
  const [isCycleConfirmOpen, setIsCycleConfirmOpen] = useState(false);
  const [isSavingCycle, setIsSavingCycle] = useState(false);
  const [cycleSuccessMsg, setCycleSuccessMsg] = useState<string | null>(null);
  const [cycleErrorMsg, setCycleErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.cycle_start_day) {
      setCandidateCycleDay(profile.cycle_start_day);
    }
  }, [profile?.cycle_start_day]);

  // Previews for current and candidate cycle info
  const activeCyclePreview = useMemo(() => {
    return getCycleInfo(currentSavedCycleDay);
  }, [currentSavedCycleDay]);

  const candidateCyclePreview = useMemo(() => {
    const validDay = Math.min(31, Math.max(1, candidateCycleDay || 1));
    return getCycleInfo(validDay);
  }, [candidateCycleDay]);

  // Password / Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Logout State
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Avatar initials helper
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mahasiswa';
  const displayEmail = user?.email || '-';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  // Formatted Member Since
  const memberSinceFormatted = useMemo(() => {
    const rawDate = profile?.created_at || user?.created_at;
    if (!rawDate) return null;
    return formatDateIndo(rawDate);
  }, [profile?.created_at, user?.created_at]);

  // --- Handlers ---

  // 1. Profile Name Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    const trimmed = fullName.trim();
    if (!trimmed) {
      setProfileErrorMsg('Nama lengkap tidak boleh kosong');
      return;
    }

    setIsSavingProfile(true);
    const { error } = await updateProfile(trimmed);
    setIsSavingProfile(false);

    if (error) {
      setProfileErrorMsg(error.message || 'Gagal menyimpan nama profil');
    } else {
      setProfileSuccessMsg('Nama profil berhasil disimpan');
      if (onShowToast) onShowToast('Nama profil berhasil diperbarui');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    }
  };

  // 2. Cycle Start Day Initiate & Confirm
  const handleOpenCycleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setCycleErrorMsg(null);
    setCycleSuccessMsg(null);

    if (!isValidCycleDay(candidateCycleDay)) {
      setCycleErrorMsg('Tanggal siklus harus berada di antara 1 dan 31');
      return;
    }

    if (candidateCycleDay === currentSavedCycleDay) {
      setCycleSuccessMsg('Tanggal siklus sudah sesuai dengan yang tersimpan');
      setTimeout(() => setCycleSuccessMsg(null), 2500);
      return;
    }

    setIsCycleConfirmOpen(true);
  };

  const handleConfirmSaveCycle = async () => {
    setIsSavingCycle(true);
    setCycleErrorMsg(null);

    const { error } = await updateCycleStartDay(candidateCycleDay);
    setIsSavingCycle(false);
    setIsCycleConfirmOpen(false);

    if (error) {
      setCycleErrorMsg(error.message || 'Gagal memperbarui tanggal siklus');
    } else {
      setCycleSuccessMsg('Tanggal mulai siklus berhasil diperbarui');
      if (onShowToast) onShowToast('Tanggal siklus berhasil diperbarui');
      setTimeout(() => setCycleSuccessMsg(null), 3000);
    }
  };

  // 3. Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!newPassword) {
      setPasswordErrorMsg('Kata sandi baru tidak boleh kosong');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi baru');
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (error) {
      // Forward Supabase error message in friendly Indonesian
      let humanMsg = error.message;
      if (error.message.toLowerCase().includes('password should be at least')) {
        humanMsg = 'Kata sandi baru terlalu pendek sesuai kebijakan keamanan akun.';
      } else if (error.message.toLowerCase().includes('same password')) {
        humanMsg = 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.';
      }
      setPasswordErrorMsg(humanMsg);
    } else {
      setPasswordSuccessMsg('Kata sandi berhasil diperbarui');
      setNewPassword('');
      setConfirmPassword('');
      if (onShowToast) onShowToast('Kata sandi berhasil diperbarui');
      setTimeout(() => setPasswordSuccessMsg(null), 3500);
    }
  };

  // 4. Logout
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      if (onShowToast) onShowToast('Berhasil keluar dari akun');
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <header className="border-b border-border-default pb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
          Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Kelola profil, siklus finansial, dan keamanan akun.
        </p>
      </header>

      {/* SECTION 1: Profil Mahasiswa */}
      <section aria-labelledby="section-profile" className="space-y-6">
        <div>
          <h2 id="section-profile" className="text-base font-bold text-text-primary tracking-tight">
            Profil Mahasiswa
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Identitas akun dan nama tampilan yang digunakan pada sistem.
          </p>
        </div>

        {/* User Identity Banner */}
        <div className="p-4 bg-surface rounded-xl border border-border-default flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center text-sm font-bold shrink-0 border border-border-gold select-none"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-text-primary truncate">
                {displayName}
              </span>
              <span className="text-xs text-text-muted truncate">
                {displayEmail}
              </span>
              {memberSinceFormatted && (
                <span className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-text-muted shrink-0" />
                  <span>Terdaftar sejak {memberSinceFormatted}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Name Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label
              htmlFor={fullNameId}
              className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
              Nama Lengkap
            </label>
            <div className="relative">
              <input
                id={fullNameId}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                required
                maxLength={100}
                className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-elevated border border-border-default text-xs sm:text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-gold-focus transition-all"
              />
              <UserIcon className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Read-only Email Field */}
          <div>
            <label
              htmlFor={emailId}
              className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
              Email Akun
            </label>
            <div className="relative">
              <input
                id={emailId}
                type="email"
                value={displayEmail}
                readOnly
                disabled
                className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface/50 border border-border-subtle text-xs sm:text-sm font-medium text-text-muted cursor-not-allowed select-all"
              />
              <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Email terhubung ke autentikasi dan bersifat read-only.
            </p>
          </div>

          {profileErrorMsg && (
            <div
              role="alert"
              className="p-3 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose-text font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-semantic-rose" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          {profileSuccessMsg && (
            <div
              role="status"
              className="p-3 bg-semantic-green-soft border border-semantic-green/20 rounded-xl text-xs text-semantic-green-text font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0 text-semantic-green" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              {isSavingProfile ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Simpan Nama</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <hr className="border-border-subtle" />

      {/* SECTION 2: Preferensi Finansial */}
      <section aria-labelledby="section-finance" className="space-y-6">
        <div>
          <h2 id="section-finance" className="text-base font-bold text-text-primary tracking-tight">
            Preferensi Finansial
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Konfigurasi siklus bulanan uang saku dan mata uang sistem.
          </p>
        </div>

        {/* Currency Display (Read-Only) */}
        <div className="p-4 bg-surface rounded-xl border border-border-default flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-gold">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-text-primary">Mata Uang Acuan</div>
              <div className="text-xs text-text-muted">Standar format finansial aplikasi</div>
            </div>
          </div>
          <span className="text-xs font-bold text-text-primary px-2.5 py-1 bg-surface-elevated rounded-lg border border-border-subtle">
            IDR · Rupiah Indonesia
          </span>
        </div>

        {/* Cycle Date Settings Form */}
        <form onSubmit={handleOpenCycleConfirm} className="space-y-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4 text-text-gold" />
              <label htmlFor={cycleDayId} className="text-xs font-bold text-text-primary">
                Tanggal Mulai Siklus Bulanan
              </label>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Dihitung dari tanggal ini hingga 1 hari sebelum tanggal ini pada bulan berikutnya (biasanya disesuaikan dengan tanggal kiriman uang saku).
            </p>

            <div className="flex items-center gap-3">
              <input
                id={cycleDayId}
                type="number"
                min="1"
                max="31"
                value={candidateCycleDay}
                onChange={(e) => setCandidateCycleDay(parseInt(e.target.value, 10) || 1)}
                required
                className="w-24 h-11 px-3 bg-surface-elevated border border-border-default rounded-xl text-center text-base font-bold text-text-primary focus:outline-none focus:border-border-gold-focus tabular-nums"
              />
              <span className="text-xs text-text-secondary">tiap bulan (1 – 31)</span>
            </div>
          </div>

          {/* Cycle Preview Cards */}
          <div className="p-3.5 bg-surface-elevated/50 rounded-xl border border-border-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between text-text-muted">
              <span>Siklus Aktif Saat Ini:</span>
              <span className="font-semibold text-text-primary">
                {formatDateIndo(activeCyclePreview.startDate)} – {formatDateIndo(activeCyclePreview.endDate)}
              </span>
            </div>
            {candidateCycleDay !== currentSavedCycleDay && (
              <div className="flex items-center justify-between text-text-gold pt-1 border-t border-border-subtle/50">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Siklus Baru Setelah Disimpan:</span>
                </span>
                <span className="font-bold">
                  {formatDateIndo(candidateCyclePreview.startDate)} – {formatDateIndo(candidateCyclePreview.endDate)}
                </span>
              </div>
            )}
          </div>

          {cycleErrorMsg && (
            <div
              role="alert"
              className="p-3 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose-text font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-semantic-rose" />
              <span>{cycleErrorMsg}</span>
            </div>
          )}

          {cycleSuccessMsg && (
            <div
              role="status"
              className="p-3 bg-semantic-green-soft border border-semantic-green/20 rounded-xl text-xs text-semantic-green-text font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0 text-semantic-green" />
              <span>{cycleSuccessMsg}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <Calendar className="w-4 h-4 text-slate-950" />
              <span>Simpan Tanggal Siklus</span>
            </button>
          </div>
        </form>
      </section>

      <hr className="border-border-subtle" />

      {/* SECTION 3: Keamanan & Kredensial */}
      <section aria-labelledby="section-security" className="space-y-6">
        <div>
          <h2 id="section-security" className="text-base font-bold text-text-primary tracking-tight">
            Keamanan & Kredensial
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manajemen kata sandi dan proteksi akses akun.
          </p>
        </div>

        {/* Provider-Aware Branching */}
        {authProviderType === 'oauth' ? (
          <div className="p-4 bg-surface rounded-xl border border-border-default flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-text-gold shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-text-primary">
                Akun Terhubung via Penyedia Eksternal (OAuth)
              </div>
              <p className="text-text-secondary leading-relaxed">
                Akun Anda terdaftar menggunakan penyedia autentikasi eksternal. Pengelolaan kata sandi dan keamanan akun dilakukan langsung melalui penyedia akun Anda.
              </p>
            </div>
          </div>
        ) : authProviderType === 'email' ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label
                htmlFor={newPasswordId}
                className="block text-xs font-semibold text-text-secondary mb-1.5"
              >
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id={newPasswordId}
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  required
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-elevated border border-border-default text-xs sm:text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-gold-focus transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 focus:outline-none"
                  aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor={confirmPasswordId}
                className="block text-xs font-semibold text-text-secondary mb-1.5"
              >
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  id={confirmPasswordId}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  required
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-elevated border border-border-default text-xs sm:text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-gold-focus transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 focus:outline-none"
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordErrorMsg && (
              <div
                role="alert"
                className="p-3 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose-text font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-semantic-rose" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            {passwordSuccessMsg && (
              <div
                role="status"
                className="p-3 bg-semantic-green-soft border border-semantic-green/20 rounded-xl text-xs text-semantic-green-text font-medium flex items-center gap-2"
              >
                <Check className="w-4 h-4 shrink-0 text-semantic-green" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full sm:w-auto px-5 py-2.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-border-gold hover:border-border-gold-focus text-text-gold rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 min-h-[44px] disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <span>Menyimpan Sandi...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-text-gold" />
                    <span>Perbarui Kata Sandi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-surface rounded-xl border border-border-default text-xs text-text-secondary">
            Manajemen kata sandi tidak tersedia untuk tipe sesi ini.
          </div>
        )}
      </section>

      <hr className="border-border-subtle" />

      {/* SECTION 4: Akun & Sesi */}
      <section aria-labelledby="section-account" className="space-y-4">
        <div>
          <h2 id="section-account" className="text-base font-bold text-text-primary tracking-tight">
            Akun & Sesi
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Kelola sesi aktif pada perangkat ini.
          </p>
        </div>

        <div className="p-4 bg-surface rounded-xl border border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-text-primary">Keluar dari SakuMahasiswa</div>
            <div className="text-xs text-text-secondary mt-0.5">
              Sesi aktif akan diakhiri dan aplikasi kembali ke layar masuk.
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto px-4 py-2.5 bg-semantic-rose-soft hover:bg-semantic-rose/20 text-semantic-rose-text border border-semantic-rose/30 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoggingOut ? 'Mengakhiri sesi...' : 'Keluar dari Akun'}</span>
          </button>
        </div>
      </section>

      {/* Non-Blocking Cycle Confirmation Modal */}
      {isCycleConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cycle-confirm-title"
        >
          <div className="w-full max-w-md bg-surface-modal rounded-2xl p-6 border border-border-default shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-text-gold">
                <AlertTriangle className="w-5 h-5 text-text-gold shrink-0" />
                <h3 id="cycle-confirm-title" className="text-sm font-bold text-text-primary tracking-tight">
                  Ubah Tanggal Mulai Siklus?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCycleConfirmOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-lg"
                aria-label="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Perubahan tanggal mulai siklus menjadi tanggal <strong>{candidateCycleDay}</strong> akan langsung memengaruhi perhitungan finansial aktif:
            </p>

            <ul className="text-xs text-text-muted list-disc list-inside space-y-1 pl-1 bg-surface-elevated/50 p-3 rounded-xl border border-border-subtle">
              <li>Rentang tanggal siklus aktif bulanan</li>
              <li>Batas Safe to Spend (Aman Dibelanjakan) harian</li>
              <li>Ringkasan total pengeluaran dan pemasukan siklus</li>
              <li>Status pacing dan surplus/defisit berjalan</li>
            </ul>

            <div className="text-xs text-text-gold font-medium">
              Siklus baru:{' '}
              <span className="font-bold">
                {formatDateIndo(candidateCyclePreview.startDate)} – {formatDateIndo(candidateCyclePreview.endDate)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCycleConfirmOpen(false)}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface-elevated/80 border border-border-default text-text-secondary rounded-xl text-xs font-semibold min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveCycle}
                disabled={isSavingCycle}
                className="px-4 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition-all min-h-[44px] disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingCycle ? 'Menerapkan...' : 'Ya, Terapkan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
