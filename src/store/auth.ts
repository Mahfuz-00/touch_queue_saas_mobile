import { create } from 'zustand';

import type { MobileCapabilities, MobileUser } from '@/services/mobileApi';
import { KEYS, readJSON, storage, writeJSON } from '@/services/storage';

/**
 * The signed-in clinic user.
 *
 * Held in MMKV so a staff member reopening the app lands on their counter board
 * instead of a login form. The token is the only credential; the tenant it was
 * issued for is stored beside it, because the API is addressed per clinic.
 */
type Persisted = {
  token: string;
  user: MobileUser;
  capabilities: MobileCapabilities;
  abilities: string[];
};

type AuthState = Persisted & {
  isStaff: boolean;
  isAdmin: boolean;
  signIn: (session: Persisted) => void;
  signOut: () => void;
  /** Re-read the persisted session. Storage is async, so this runs after it loads. */
  hydrate: () => void;
};

const stored = readJSON<Persisted>(KEYS.auth);

export const useAuth = create<AuthState>((set) => ({
  token: stored?.token ?? '',
  user: stored?.user ?? { id: 0, name: '', email: '', role: null },
  capabilities: stored?.capabilities ?? {},
  abilities: stored?.abilities ?? [],
  isStaff: (stored?.abilities ?? []).includes('staff'),
  isAdmin: (stored?.abilities ?? []).includes('tenant-admin'),

  hydrate: () => {
    const session = readJSON<Persisted>(KEYS.auth);

    set({
      token: session?.token ?? '',
      user: session?.user ?? { id: 0, name: '', email: '', role: null },
      capabilities: session?.capabilities ?? {},
      abilities: session?.abilities ?? [],
      isStaff: (session?.abilities ?? []).includes('staff'),
      isAdmin: (session?.abilities ?? []).includes('tenant-admin'),
    });
  },

  signIn: (session) => {
    writeJSON(KEYS.auth, session);
    set({
      ...session,
      isStaff: session.abilities.includes('staff'),
      isAdmin: session.abilities.includes('tenant-admin'),
    });
  },

  signOut: () => {
    storage.remove(KEYS.auth);
    set({
      token: '',
      user: { id: 0, name: '', email: '', role: null },
      capabilities: {},
      abilities: [],
      isStaff: false,
      isAdmin: false,
    });
  },
}));
