/**
 * App configuration.
 *
 * These were EXPO_PUBLIC_* environment variables. Expo is gone now, so they are
 * plain constants — there is no env injection in bare React Native without an
 * extra library, and one file is easier to reason about than five build-time
 * variables.
 *
 * Point BASE_DOMAIN at your machine's LAN address (or a wildcard-DNS host such
 * as 192.168.1.50.nip.io) when testing on a real phone: *.localhost only
 * resolves on the machine itself.
 */
export const BASE_DOMAIN = 'localhost';
export const API_PORT = '8000';
export const API_SCHEME = 'http';

/**
 * Development convenience: clinics offered as one-tap choices on the clinic
 * picker, so the app is usable on an emulator where no QR code can be scanned.
 */
export const QUICK_PICK_TENANTS = ['metro', 'cityclinic', 'globalexpress'];

/** Token statuses, mirroring Token::$statusArrays on the backend. */
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
