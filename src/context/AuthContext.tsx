import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateCycleStartDay: (day: number) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
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

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      updateCycleStartDay,
    }),
    [user, profile, isLoading, signIn, signUp, signOut, updateCycleStartDay]
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
