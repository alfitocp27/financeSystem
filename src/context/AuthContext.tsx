import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isDemoUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateCycleStartDay: (day: number) => Promise<{ error: Error | null }>;
  setDemoMode: () => void;
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  full_name: 'Mahasiswa Demo',
  currency: 'IDR',
  cycle_start_day: 25,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  // Load profile from Supabase
  const loadProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        // Fallback or self-heal profile if trigger was delayed
        const fallbackProfile: Profile = {
          id: userId,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mahasiswa',
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
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Default to demo mode if Supabase credentials are not yet configured
      const savedDemo = localStorage.getItem('demo_mode');
      if (savedDemo !== 'false') {
        setIsDemoUser(true);
        const savedCycle = localStorage.getItem('demo_cycle_start_day');
        setProfile({
          ...DEMO_PROFILE,
          cycle_start_day: savedCycle ? parseInt(savedCycle, 10) : 25,
        });
      }
      setIsLoading(false);
      return;
    }

    // Supabase Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        // check if user chose demo
        const demoActive = localStorage.getItem('demo_mode') === 'true';
        if (demoActive) {
          setIsDemoUser(true);
          setProfile(DEMO_PROFILE);
        }
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsDemoUser(false);
        loadProfile(session.user.id);
      } else {
        setUser(null);
        if (!localStorage.getItem('demo_mode')) {
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi di .env') };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setIsDemoUser(false);
      localStorage.removeItem('demo_mode');
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase belum dikonfigurasi di .env') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (!error) {
      setIsDemoUser(false);
      localStorage.removeItem('demo_mode');
    }
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && user) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoUser(false);
    localStorage.removeItem('demo_mode');
    setProfile(null);
  };

  const updateCycleStartDay = async (day: number) => {
    if (day < 1 || day > 31) {
      return { error: new Error('Tanggal siklus harus antara 1 dan 31') };
    }

    if (isDemoUser || !isSupabaseConfigured) {
      localStorage.setItem('demo_cycle_start_day', day.toString());
      setProfile((prev) => (prev ? { ...prev, cycle_start_day: day } : null));
      return { error: null };
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
  };

  const setDemoMode = () => {
    setIsDemoUser(true);
    localStorage.setItem('demo_mode', 'true');
    setProfile(DEMO_PROFILE);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        isDemoUser,
        signIn,
        signUp,
        signOut,
        updateCycleStartDay,
        setDemoMode,
      }}
    >
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
