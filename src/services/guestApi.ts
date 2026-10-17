import { API_PORT, API_SCHEME, BASE_DOMAIN } from '@/config';
import type { GuestInit, JoinBody, JoinResponse, Service, TenantRef, TicketResponse } from '@/models/types';

/**
 * Thin fetch client for the guest API.
 *
 * Every call takes an AbortSignal so a screen that unmounts cancels its request
 * instead of resolving into nothing — the main source of leaks and of the
 * "setState after unmount" warnings in React Native.
 */
export class ApiError extends Error {
  status: number;

  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

/** The host this clinic is served on: scanned hosts win, typed ones are built. */
export function hostFor(tenant: { subdomain: string; host?: string }): string {
  return tenant.host ?? `${API_SCHEME}://${tenant.subdomain}.${BASE_DOMAIN}:${API_PORT}`;
}

async function request<T>(base: string, path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    signal,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new ApiError(
      (payload?.message as string) ?? `Request failed (${response.status})`,
      response.status,
      payload?.errors as Record<string, string[]> | undefined,
    );
  }

  return payload as T;
}

export function guestApi(tenant: TenantRef) {
  const base = hostFor(tenant);

  return {
    init: (signal?: AbortSignal) => request<GuestInit>(base, '/api/v1/guest/init', {}, signal),

    services: (signal?: AbortSignal) => request<{ data: Service[] }>(base, '/api/v1/guest/services', {}, signal),

    join: (body: JoinBody, signal?: AbortSignal) =>
      request<JoinResponse>(base, '/api/v1/guest/join', { method: 'POST', body: JSON.stringify(body) }, signal),

    // The key is passed as a normal query value: the server decodes it once, and
    // it is url-encoded on the wire, so it must not be pre-encoded again.
    ticket: (key: string, signal?: AbortSignal) =>
      request<TicketResponse>(base, `/api/v1/guest/token?key=${encodeURIComponent(key)}`, {}, signal),

    registerDevice: (body: { key: string; push_token: string; platform?: string }, signal?: AbortSignal) =>
      request<{ status: string }>(base, '/api/v1/guest/device', { method: 'POST', body: JSON.stringify(body) }, signal),

    unregisterDevice: (body: { key: string; push_token: string }, signal?: AbortSignal) =>
      request<{ status: string }>(base, '/api/v1/guest/device', { method: 'DELETE', body: JSON.stringify(body) }, signal),
  };
}

export type GuestApi = ReturnType<typeof guestApi>;
