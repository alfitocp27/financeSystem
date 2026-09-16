import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types/database.types';

import { getAuthProvider, type AuthProviderType } from '../lib/settings-utils';
export { type AuthProviderType };

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isRecoverySession: boolean;
  authProviderType: AuthProviderType;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateCycleStartDay: (day: number) => Promise<{ error: Error | null }>;
  updateProfile: (fullName: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  // Stable loadProfile
  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch warning:', error.message);
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const fallbackProfile: Profile = {
          id: userId,
          full_name: userData.user?.user_metadata?.full_name || userData.user?.email?.split('@')[0] || 'Mahasiswa',
          currency: 'IDR',
          cycle_start_day: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await supabase.from('profiles').upsert(fallbackProfile);
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check if URL hash indicates a recovery session
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setIsRecoverySession(true);
    }

    // Supabase Auth listener (run once on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoverySession(true);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsRecoverySession(false);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi di .env') };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      setUser(data.user);
      await loadProfile(data.user.id);
    }
    return { error };
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi di .env') };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (!error && data.user) {
      // If session is returned immediately (email confirmation off)
      if (data.session) {
        setUser(data.user);
        await loadProfile(data.user.id);
      }
    }
    return { error };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  }, []);

  const updateCycleStartDay = useCallback(async (day: number) => {
    if (day < 1 || day > 31) {
      return { error: new Error('Tanggal siklus harus antara 1 dan 31') };
    }

    if (!user) return { error: new Error('User tidak ditemukan') };

    const { error } = await supabase
      .from('profiles')
      .update({ cycle_start_day: day, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => (prev ? { ...prev, cycle_start_day: day } : null));
    }

    return { error };
  }, [user]);

  const updateProfile = useCallback(async (fullName: string) => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      return { error: new Error('Nama lengkap tidak boleh kosong') };
    }
    if (!user) {
      return { error: new Error('Sesi pengguna tidak ditemukan. Silakan masuk kembali.') };
    }

    // 1. Update public.profiles (Primary Source of Truth)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (profileError) {
      return { error: new Error(profileError.message || 'Gagal memperbarui profil') };
    }

    // Update local state immediately
    setProfile((prev) => (prev ? { ...prev, full_name: trimmed } : null));

    // 2. Best-effort sync to Supabase Auth metadata
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (authError) {
        console.warn('Gagal sinkronisasi metadata autentikasi:', authError.message);
      }
    } catch (err) {
      console.warn('Pengecualian saat sinkronisasi metadata autentikasi:', err);
    }

    return { error: null };
  }, [user]);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!newPassword) {
      return { error: new Error('Kata sandi baru tidak boleh kosong') };
    }
    if (!user) {
      return { error: new Error('Sesi pengguna tidak ditemukan. Silakan masuk kembali.') };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error };
    }

    return { error: null };
  }, [user]);

  const resetPassword = useCallback(async (emailToReset: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi di .env') };
    }
    const cleanEmail = emailToReset.trim();
    if (!cleanEmail) {
      return { error: new Error('Email wajib diisi') };
    }
    const redirectUrl = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });
    return { error };
  }, []);

  const authProviderType = useMemo(() => getAuthProvider(user), [user]);

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      isRecoverySession,
      authProviderType,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateCycleStartDay,
      updateProfile,
      updatePassword,
    }),
    [user, profile, isLoading, isRecoverySession, authProviderType, signIn, signUp, signOut, resetPassword, updateCycleStartDay, updateProfile, updatePassword]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
