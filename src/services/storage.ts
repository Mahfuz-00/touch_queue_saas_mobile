import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device storage, without a native Nitro dependency.
 *
 * This was react-native-mmkv v4, which is built on Nitro modules. On the test
 * device the NitroModules TurboModule could never be resolved, so every launch
 * died during the first render. AsyncStorage is a long-standing, plain native
 * module with no such runtime.
 *
 * Reads stay synchronous — the session store and the query placeholder read
 * during render — so values live in memory and are written through to disk.
 * initStorage() must complete once at startup, before the first read.
 */
const PREFIX = 'tq:';

const values = new Map<string, string>();
let ready = false;

export async function initStorage(): Promise<void> {
  if (ready) {
    return;
  }

  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(PREFIX));
    const entries = await Promise.all(
      keys.map(async (key) => [key, await AsyncStorage.getItem(key)] as const),
    );

    entries.forEach(([key, value]) => {
      if (value !== null) {
        values.set(key.slice(PREFIX.length), value);
      }
    });
  } catch {
    // A storage read failure must not stop the app from starting: the cache is
    // an optimisation, the network is the source of truth.
  } finally {
    ready = true;
  }
}

export const storage = {
  getString(key: string): string | undefined {
    return values.get(key);
  },

  set(key: string, value: string): void {
    values.set(key, value);
    void AsyncStorage.setItem(PREFIX + key, value);
  },

  remove(key: string): void {
    values.delete(key);
    void AsyncStorage.removeItem(PREFIX + key);
  },
};

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
