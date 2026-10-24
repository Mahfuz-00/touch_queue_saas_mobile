import { create } from 'zustand';

import type { TenantRef } from '@/models/types';
import { KEYS, readJSON, storage, writeJSON } from '@/services/storage';

/**
 * Session state: which clinic this device is using, and the key of the guest's
 * current ticket. Persisted to MMKV so a restart resumes where the guest was
 * instead of asking them to scan again.
 */
type SessionState = {
  tenant: TenantRef | null;
  ticketKey: string | null;
  setTenant: (tenant: TenantRef) => void;
  setTicketKey: (key: string | null) => void;
  forgetTenant: () => void;
  /** Re-read persisted values. Storage is async, so this runs after it loads. */
  hydrate: () => void;
};

export const useSession = create<SessionState>((set) => ({
  tenant: readJSON<TenantRef>(KEYS.tenant),
  ticketKey: storage.getString(KEYS.ticketKey) ?? null,

  hydrate: () => {
    set({
      tenant: readJSON<TenantRef>(KEYS.tenant),
      ticketKey: storage.getString(KEYS.ticketKey) ?? null,
    });
  },

  setTenant: (tenant) => {
    writeJSON(KEYS.tenant, tenant);
    set({ tenant });
  },

  setTicketKey: (ticketKey) => {
    if (ticketKey) {
      storage.set(KEYS.ticketKey, ticketKey);
    } else {
      storage.remove(KEYS.ticketKey);
    }

    set({ ticketKey });
  },

  forgetTenant: () => {
    storage.remove(KEYS.tenant);
    storage.remove(KEYS.ticketKey);
    set({ tenant: null, ticketKey: null });
  },
}));
