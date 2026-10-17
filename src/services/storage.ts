import { createMMKV } from 'react-native-mmkv';

/**
 * Synchronous key/value storage for session state and preferences. MMKV is the
 * right tool here (not SQLite): these are a handful of scalars read on every
 * render, and the reads must not be async.
 */
export const storage = createMMKV({ id: 'touch-queue' });

export const KEYS = {
  tenant: 'guest.tenant',
  ticketKey: 'guest.ticket.key',
  pushToken: 'guest.push.token',
  language: 'guest.language',
  auth: 'clinic.auth',
} as const;

export function readJSON<T>(key: string): T | null {
  const raw = storage.getString(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    // A corrupted value should never stop the app from starting.
    storage.remove(key);

    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}
