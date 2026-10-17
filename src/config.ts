/**
 * App-wide constants.
 *
 * The API base is derived from the tenant the guest picked (scanned or typed),
 * never from a build-time URL: one app install serves every clinic, which is the
 * whole point of resolving tenants by subdomain.
 */
export const BASE_DOMAIN = process.env.EXPO_PUBLIC_BASE_DOMAIN ?? 'localhost';
export const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '8000';
export const API_SCHEME = process.env.EXPO_PUBLIC_API_SCHEME ?? 'http';

/** Token statuses, mirroring Token::\$statusArrays on the backend. */
export const TOKEN_STATUS = {
  waiting: 'waiting',
  pending: 'pending',
  completed: 'completed',
  missed: 'missed',
  skipped: 'skiped_to_last',
} as const;

/** Live ticket refresh interval while the app is in the foreground. */
export const POLL_MS = 5000;

/** How many past tickets to keep on the device. */
export const HISTORY_LIMIT = 20;

export const STATUS_LABEL: Record<string, string> = {
  waiting: 'Waiting in queue',
  pending: "It's your turn - please proceed",
  completed: 'Served',
  missed: 'Missed',
  skiped_to_last: 'Moved to the end of the queue',
};
