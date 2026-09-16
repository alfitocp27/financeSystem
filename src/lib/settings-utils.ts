import type { User } from '@supabase/supabase-js';

export type AuthProviderType = 'email' | 'oauth' | 'unknown';

/**
 * Deteksi provider autentikasi secara defensif dari objek User Supabase.
 * - 'email': Pengguna terdaftar dengan email & password
 * - 'oauth': Pengguna terdaftar melalui penyedia eksternal (Google, GitHub, dsb.)
 * - 'unknown': Metadata provider tidak dapat dipastikan secara andal
 */
export function getAuthProvider(user: User | null): AuthProviderType {
  if (!user) return 'unknown';

  // 1. Periksa array identities jika tersedia
  if (Array.isArray(user.identities) && user.identities.length > 0) {
    const hasEmail = user.identities.some((i) => i.provider === 'email');
    const hasOAuth = user.identities.some((i) => i.provider !== 'email');
    if (hasEmail) return 'email';
    if (hasOAuth) return 'oauth';
  }

  // 2. Periksa array app_metadata.providers jika tersedia
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.length > 0) {
    if (providers.includes('email')) return 'email';
    return 'oauth';
  }

  // 3. Periksa string app_metadata.provider tunggal
  const provider = user.app_metadata?.provider;
  if (provider === 'email') return 'email';
  if (typeof provider === 'string' && provider.length > 0) return 'oauth';

  return 'unknown';
}

/**
 * Format inisial avatar dari nama tampilan (maksimal 2 huruf kapital).
 */
export function getInitials(name?: string | null): string {
  const clean = (name || '').trim();
  if (!clean) return 'M';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Validasi tanggal mulai siklus bulanan (harus integer 1-31).
 */
export function isValidCycleDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= 31;
}
