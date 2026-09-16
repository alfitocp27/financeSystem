import { describe, it, expect } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { getAuthProvider, getInitials, isValidCycleDay } from './settings-utils';

describe('Settings Utils - Provider Detection', () => {
  it('returns "unknown" when user is null', () => {
    expect(getAuthProvider(null)).toBe('unknown');
  });

  it('identifies email user from identities array', () => {
    const user = {
      id: 'usr-1',
      app_metadata: {},
      identities: [
        { id: 'id-1', user_id: 'usr-1', provider: 'email', identity_data: {}, created_at: '', last_sign_in_at: '', updated_at: '' },
      ],
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('email');
  });

  it('identifies oauth user from identities array (e.g. Google)', () => {
    const user = {
      id: 'usr-2',
      app_metadata: {},
      identities: [
        { id: 'id-2', user_id: 'usr-2', provider: 'google', identity_data: {}, created_at: '', last_sign_in_at: '', updated_at: '' },
      ],
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('oauth');
  });

  it('identifies email user from app_metadata.providers array', () => {
    const user = {
      id: 'usr-3',
      app_metadata: { providers: ['email'] },
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('email');
  });

  it('identifies oauth user from app_metadata.providers array', () => {
    const user = {
      id: 'usr-4',
      app_metadata: { providers: ['google'] },
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('oauth');
  });

  it('identifies email user from app_metadata.provider single string', () => {
    const user = {
      id: 'usr-5',
      app_metadata: { provider: 'email' },
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('email');
  });

  it('identifies oauth user from app_metadata.provider single string', () => {
    const user = {
      id: 'usr-6',
      app_metadata: { provider: 'google' },
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('oauth');
  });

  it('returns "unknown" when provider cannot be reliably determined', () => {
    const user = {
      id: 'usr-7',
      app_metadata: {},
    } as unknown as User;

    expect(getAuthProvider(user)).toBe('unknown');
  });
});

describe('Settings Utils - Avatar Initials', () => {
  it('extracts two uppercase letters for multi-word name', () => {
    expect(getInitials('Dimas Pratama')).toBe('DP');
    expect(getInitials('dimas pratama')).toBe('DP');
    expect(getInitials('Dimas Pratama Putra')).toBe('DP');
  });

  it('extracts first two letters for single-word name', () => {
    expect(getInitials('Dimas')).toBe('DI');
    expect(getInitials('budi')).toBe('BU');
  });

  it('handles single character name', () => {
    expect(getInitials('A')).toBe('A');
  });

  it('handles empty, null, or whitespace-only names with default "M"', () => {
    expect(getInitials('')).toBe('M');
    expect(getInitials(null)).toBe('M');
    expect(getInitials(undefined)).toBe('M');
    expect(getInitials('   ')).toBe('M');
  });

  it('handles extra leading and trailing whitespace properly', () => {
    expect(getInitials('   Siti   Nurhaliza   ')).toBe('SN');
  });
});

describe('Settings Utils - Cycle Day Validation', () => {
  it('validates correct cycle days within 1 to 31', () => {
    expect(isValidCycleDay(1)).toBe(true);
    expect(isValidCycleDay(15)).toBe(true);
    expect(isValidCycleDay(25)).toBe(true);
    expect(isValidCycleDay(31)).toBe(true);
  });

  it('rejects out of bounds cycle days', () => {
    expect(isValidCycleDay(0)).toBe(false);
    expect(isValidCycleDay(-1)).toBe(false);
    expect(isValidCycleDay(32)).toBe(false);
    expect(isValidCycleDay(100)).toBe(false);
  });

  it('rejects non-integer and NaN values', () => {
    expect(isValidCycleDay(25.5)).toBe(false);
    expect(isValidCycleDay(NaN)).toBe(false);
  });
});
