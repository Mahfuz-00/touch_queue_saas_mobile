import { HISTORY_LIMIT } from '@/config';
import type { HistoryEntry, LiveSnapshot, Service, TicketResponse } from '@/models/types';
import { readJSON, writeJSON } from '@/services/storage';

/**
 * Local cache, on MMKV.
 *
 * This started as expo-sqlite + Drizzle. In bare React Native Drizzle talks to
 * SQLite through an async driver (op-sqlite), which would make reads async — and
 * a cache that is read during render (the service list's placeholder) must be
 * synchronous. MMKV is synchronous, already installed, and this is a few
 * kilobytes of JSON, so it is the right store for it.
 */
const KEY_SERVICES = 'cache.services';
const KEY_TICKETS = 'cache.tickets';

type ServiceCache = Record<string, Service[]>;

export const serviceRepo = {
  replace(tenant: string, rows: Service[]): void {
    const all = readJSON<ServiceCache>(KEY_SERVICES) ?? {};
    all[tenant] = rows;
    writeJSON(KEY_SERVICES, all);
  },

  list(tenant: string): Service[] {
    return (readJSON<ServiceCache>(KEY_SERVICES) ?? {})[tenant] ?? [];
  },
};

function read(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>(KEY_TICKETS) ?? [];
}

function write(entries: HistoryEntry[]): void {
  writeJSON(KEY_TICKETS, entries.slice(0, HISTORY_LIMIT));
}

/** Newest first, keeping the table bounded to HISTORY_LIMIT. */
function upsert(entry: HistoryEntry, patch: Partial<HistoryEntry> = {}): void {
  const entries = read();
  const index = entries.findIndex((row) => row.key === entry.key);

  if (index >= 0) {
    entries[index] = { ...entries[index], ...patch };
  } else {
    entries.unshift(entry);
  }

  write(entries);
}

export const ticketRepo = {
  save(entry: HistoryEntry): void {
    upsert(entry, entry);
  },

  touch(key: string, tenant: string, tenantHost: string, snapshot: LiveSnapshot, categoryName: string | null): void {
    upsert(
      {
        key,
        tenant,
        tenantHost,
        tokenNo: snapshot.full_token_no ?? '-',
        categoryName,
        status: snapshot.status,
        createdAt: Date.now(),
      },
      {
        tokenNo: snapshot.full_token_no ?? '-',
        status: snapshot.status,
        categoryName,
      },
    );
  },

  fromJoin(key: string, tenant: string, tenantHost: string, response: TicketResponse | null): void {
    upsert({
      key,
      tenant,
      tenantHost,
      tokenNo: response?.token.full_token_no ?? '-',
      categoryName: response?.category.name_en ?? null,
      status: response?.live.status ?? 'waiting',
      createdAt: Date.now(),
    });
  },

  list(): HistoryEntry[] {
    return read();
  },

  remove(key: string): void {
    write(read().filter((entry) => entry.key !== key));
  },

  clear(): void {
    write([]);
  },

  /** Drop tickets from older visits so history stays useful. */
  sweep(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    write(read().filter((entry) => entry.createdAt >= cutoff));
  },
};
