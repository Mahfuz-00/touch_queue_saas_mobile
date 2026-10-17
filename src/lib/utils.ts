import type { TenantRef } from '@/models/types';
import { API_PORT, API_SCHEME, BASE_DOMAIN } from '@/config';

/**
 * Parse a Touch Queue join QR into the clinic it points at.
 *
 * Both shapes the admin QR page prints are accepted:
 *   https://metro.example.com/join        (tenant subdomain)
 *   https://example.com/join/metro        (shared domain + path)
 * Anything else is rejected so scanning a random code gives a clear message
 * rather than a mysterious network error.
 */
export function parseJoinUrl(raw: string): TenantRef | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);

  if (segments[0] !== 'join') {
    return null;
  }

  const host = `${url.protocol}//${url.host}`;

  // /join/{tenant} - the shared-domain form.
  if (segments.length > 1) {
    return { subdomain: segments[1].toLowerCase(), host };
  }

  // /join on a tenant host - strip the tenant label off the hostname.
  const labels = url.hostname.toLowerCase().split('.');

  if (labels.length < 2) {
    return null;
  }

  return { subdomain: labels[0], host };
}

/** Build a clinic reference from a subdomain the guest typed by hand. */
export function tenantFromSubdomain(input: string): TenantRef | null {
  const subdomain = input.trim().toLowerCase();

  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return null;
  }

  return {
    subdomain,
    host: `${API_SCHEME}://${subdomain}.${BASE_DOMAIN}:${API_PORT}`,
  };
}

/**
 * Bangladeshi mobile numbers, matching CustomHelper::PhoneNoRegex on the server
 * so the app rejects what the API would reject, before a round trip.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '');
  const normalised = digits.startsWith('880') ? `0${digits.slice(3)}` : digits;

  return /^01[3-9]\d{8}$/.test(normalised) ? normalised : null;
}

/**
 * The sentence read out when a token is called. The number is spoken as a digit
 * because engines read "G-001" as "G minus one hundred one".
 */
export function callText(fullTokenNo: string | null, categoryName?: string | null): string {
  const value = String(fullTokenNo ?? '').trim();
  const [prefix, digits] = value.split('-');
  const number = parseInt(digits ?? '', 10);

  const label = Number.isNaN(number) ? `Token ${value}` : `Token ${prefix}, number ${number}`;
  const opening = categoryName ? `${categoryName}. ` : '';

  return `${opening}${label}. Please proceed to the counter.`;
}
