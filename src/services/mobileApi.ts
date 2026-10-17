import type { TenantRef } from '@/models/types';
import { hostFor } from '@/services/guestApi';

/**
 * The clinic API behind the `/mobile` guard.
 *
 * The token comes from `/mobile/login` and lives in the tenant's own database,
 * so every call carries it as a bearer token — no cookies, no CSRF, and the
 * tenant is still identified by the host.
 */
export class MobileApiError extends Error {
  status: number;

  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
    this.errors = errors;
  }
}

export type MobileUser = {
  id: number;
  name: string;
  email: string;
  role: string | null;
};

export type MobileCapabilities = {
  counter_id?: number;
  counter_name?: string;
  counter_label?: string;
  can_call?: boolean;
  is_admin?: boolean;
};

export type MobileSession = {
  token: string;
  abilities: string[];
  user: MobileUser;
  tenant: { subdomain: string; name: string; branding_name: string; show_secondary_language: boolean };
  capabilities: MobileCapabilities;
};

export type BoardToken = {
  id: number;
  token_no: number | null;
  full_token_no: string | null;
  status: string;
  category: { id: number | null; name_en: string | null; name_secondary: string | null };
  waiting_since: string | null;
};

export type CounterBoard = {
  counter: { id: number; name: string; label: string } | null;
  can_call: boolean;
  serving: BoardToken | null;
  waiting: BoardToken[];
  missed: BoardToken[];
  served_today: number;
  secondary_counters: { id: number; name: string }[];
};

export type Dashboard = {
  stats: {
    served_this_month: number;
    served_this_year: number;
    waiting_now: number;
    counters: number;
    services: number;
    staff: number;
  };
  recent_tokens: {
    id: number;
    full_token_no: string | null;
    status: string;
    category: string | null;
    counter: string | null;
    created_at: string | null;
  }[];
};

async function request<T>(
  tenant: TenantRef,
  path: string,
  options: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(`${hostFor(tenant)}${path}`, {
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new MobileApiError(
      (payload?.message as string) ?? `Request failed (${response.status})`,
      response.status,
      payload?.errors as Record<string, string[]>,
    );
  }

  return payload as T;
}

export function mobileApi(tenant: TenantRef) {
  return {
    login: (email: string, password: string, deviceName: string, signal?: AbortSignal) =>
      request<MobileSession>(tenant, '/api/mobile/login', {
        method: 'POST',
        body: { email, password, device_name: deviceName },
        signal,
      }),

    me: (token: string, signal?: AbortSignal) => request<MobileSession>(tenant, '/api/mobile/me', { token, signal }),

    logout: (token: string, signal?: AbortSignal) =>
      request<{ status: string }>(tenant, '/api/mobile/logout', { method: 'POST', body: {}, token, signal }),

    board: (token: string, signal?: AbortSignal) =>
      request<CounterBoard>(tenant, '/api/mobile/counter/board', { token, signal }),

    call: (token: string, action: 'next' | 'recall' | 'skip' | 'serve', signal?: AbortSignal) =>
      request<{ status: string; serving?: BoardToken }>(tenant, `/api/mobile/counter/${action}`, {
        method: 'POST',
        body: {},
        token,
        signal,
      }),

    forward: (token: string, counterId: number, signal?: AbortSignal) =>
      request<{ status: string }>(tenant, '/api/mobile/counter/forward', {
        method: 'POST',
        body: { counter_id: counterId },
        token,
        signal,
      }),

    dashboard: (token: string, signal?: AbortSignal) => request<Dashboard>(tenant, '/api/mobile/dashboard', { token, signal }),
  };
}

export type MobileApi = ReturnType<typeof mobileApi>;
