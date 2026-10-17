import { desc, eq, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import * as SQLite from 'expo-sqlite';

import { HISTORY_LIMIT } from '@/config';
import type { HistoryEntry, LiveSnapshot, Service, TicketResponse } from '@/models/types';

/**
 * Local cache. Drizzle owns the schema and the queries; the tables are created
 * on first launch from the same definitions, so no build step is needed to run
 * the app. `drizzle-kit generate` can produce migrations later.
 */
export const cachedServices = sqliteTable('cached_services', {
  key: text('key').primaryKey(),
  tenant: text('tenant').notNull(),
  nameEn: text('name_en').notNull(),
  nameSecondary: text('name_secondary'),
  acronym: text('acronym'),
});

export const myTickets = sqliteTable('my_tickets', {
  key: text('key').primaryKey(),
  tenant: text('tenant').notNull(),
  tenantHost: text('tenant_host').notNull(),
  tokenNo: text('token_no').notNull(),
  categoryName: text('category_name'),
  status: text('status').notNull(),
  createdAt: integer('created_at').notNull(),
});

const sqlite = SQLite.openDatabaseSync('touch_queue.db');

export const db = drizzle(sqlite);

let ready = false;

/** Create the tables once per process. Safe to call on every start. */
export function bootstrap(): void {
  if (ready) {
    return;
  }

  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS cached_services (
      key TEXT PRIMARY KEY NOT NULL,
      tenant TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_secondary TEXT,
      acronym TEXT
    );
    CREATE TABLE IF NOT EXISTS my_tickets (
      key TEXT PRIMARY KEY NOT NULL,
      tenant TEXT NOT NULL,
      tenant_host TEXT NOT NULL,
      token_no TEXT NOT NULL,
      category_name TEXT,
      status TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  ready = true;
}

/**
 * Services, cached per clinic so reopening the app shows the list immediately
 * instead of an empty screen while the network works.
 */
export const serviceRepo = {
  replace(tenant: string, rows: Service[]): void {
    db.delete(cachedServices).where(eq(cachedServices.tenant, tenant)).run();

    if (rows.length > 0) {
      db.insert(cachedServices)
        .values(
          rows.map((row) => ({
            key: `${tenant}:${row.id}`,
            tenant,
            nameEn: row.name_en,
            nameSecondary: row.name_secondary,
            acronym: row.acronym,
          })),
        )
        .run();
    }
  },

  list(tenant: string): Service[] {
    return db
      .select()
      .from(cachedServices)
      .where(eq(cachedServices.tenant, tenant))
      .all()
      .map((row) => ({
        id: Number(row.key.split(':')[1]),
        name_en: row.nameEn,
        name_secondary: row.nameSecondary,
        acronym: row.acronym,
        provider_name_en: null,
        room_number: null,
      }));
  },
};

/**
 * The guest's own tickets. This is the only record of a ticket on the device
 * once the app is closed, so it is written on join and refreshed on every poll.
 */
export const ticketRepo = {
  save(entry: HistoryEntry): void {
    db.insert(myTickets).values(entry).onConflictDoUpdate({ target: myTickets.key, set: entry }).run();
  },

  touch(key: string, tenant: string, tenantHost: string, snapshot: LiveSnapshot, categoryName: string | null): void {
    db.insert(myTickets)
      .values({
        key,
        tenant,
        tenantHost,
        tokenNo: snapshot.full_token_no ?? '-',
        categoryName,
        status: snapshot.status,
        createdAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: myTickets.key,
        set: { status: snapshot.status, tokenNo: snapshot.full_token_no ?? '-', categoryName },
      })
      .run();
  },

  fromJoin(key: string, tenant: string, tenantHost: string, response: TicketResponse | null): void {
    const createdAt = Date.now();

    db.insert(myTickets)
      .values({
        key,
        tenant,
        tenantHost,
        tokenNo: response?.token.full_token_no ?? '-',
        categoryName: response?.category.name_en ?? null,
        status: response?.live.status ?? 'waiting',
        createdAt,
      })
      .onConflictDoUpdate({
        target: myTickets.key,
        set: { status: response?.live.status ?? 'waiting' },
      })
      .run();

    this.prune();
  },

  list(): HistoryEntry[] {
    return db.select().from(myTickets).orderBy(desc(myTickets.createdAt)).limit(HISTORY_LIMIT).all();
  },

  remove(key: string): void {
    db.delete(myTickets).where(eq(myTickets.key, key)).run();
  },

  clear(): void {
    db.delete(myTickets).run();
  },

  /** Keep the table bounded, as agreed for guest history. */
  prune(): void {
    const rows = db.select().from(myTickets).orderBy(desc(myTickets.createdAt)).all();

    rows.slice(HISTORY_LIMIT).forEach((row) => {
      db.delete(myTickets).where(eq(myTickets.key, row.key)).run();
    });
  },

  /** Drop finished tickets older than a day so history stays useful. */
  sweep(): void {
    db.delete(myTickets)
      .where(lt(myTickets.createdAt, Date.now() - 24 * 60 * 60 * 1000))
      .run();
  },
};
