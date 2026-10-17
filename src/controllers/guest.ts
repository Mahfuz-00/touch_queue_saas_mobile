import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { POLL_MS } from '@/config';
import { useDependency } from '@/di/container';
import type { JoinBody, Service } from '@/models/types';
import { hostFor } from '@/services/guestApi';
import { useSession } from '@/store/session';

/**
 * Controllers: the layer between the screens and the data.
 *
 * Screens render; these hooks decide what to fetch, when to refetch, and where
 * the result is cached. Nothing here touches the network directly — it all goes
 * through the injected client.
 */

/** Clinic branding and availability, used to validate a chosen clinic. */
export function useGuestInit(enabled = true) {
  const api = useDependency('api');
  const tenant = useSession((state) => state.tenant);

  return useQuery({
    queryKey: ['guest', 'init', tenant?.subdomain],
    queryFn: ({ signal }) => api(tenant!).init(signal),
    enabled: Boolean(tenant) && enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Active services, served from the SQLite cache first when we have one. */
export function useServices() {
  const api = useDependency('api');
  const services = useDependency('services');
  const tenant = useSession((state) => state.tenant);

  // The data type is pinned: without it TypeScript settles on the placeholder
  // function's own type and rejects the query function.
  return useQuery<Service[]>({
    queryKey: ['guest', 'services', tenant?.subdomain],
    queryFn: async ({ signal }): Promise<Service[]> => {
      const { data } = await api(tenant!).services(signal);
      services.replace(tenant!.subdomain, data);

      return data;
    },
    enabled: Boolean(tenant),
    placeholderData: () => (tenant ? services.list(tenant.subdomain) : undefined),
    staleTime: 30_000,
    retry: 1,
  });
}

/** Confirm details and take a token. */
export function useJoin() {
  const api = useDependency('api');
  const tickets = useDependency('tickets');
  const queryClient = useQueryClient();
  const tenant = useSession((state) => state.tenant);
  const setTicketKey = useSession((state) => state.setTicketKey);

  return useMutation({
    mutationFn: (body: JoinBody) => api(tenant!).join(body),
    onSuccess: (response) => {
      if (!tenant) {
        return;
      }

      setTicketKey(response.key);
      tickets.fromJoin(response.key, tenant.subdomain, hostFor(tenant), null);
      queryClient.invalidateQueries({ queryKey: ['guest', 'history'] });
    },
  });
}

/**
 * The guest's live ticket.
 *
 * Polls only while the app is in the foreground: a background timer is throttled
 * by the OS anyway and would just burn battery. The SQLite row is refreshed on
 * each status change so history stays truthful.
 */
export function useTicket(enabled = true) {
  const api = useDependency('api');
  const tickets = useDependency('tickets');
  const tenant = useSession((state) => state.tenant);
  const key = useSession((state) => state.ticketKey);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
    });

    return () => subscription.remove();
  }, []);

  const query = useQuery({
    queryKey: ['guest', 'ticket', key],
    queryFn: ({ signal }) => api(tenant!).ticket(key!, signal),
    enabled: Boolean(tenant && key) && enabled,
    refetchInterval: foreground ? POLL_MS : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: 1,
  });

  const status = query.data?.live.status;

  useEffect(() => {
    if (!tenant || !key || !query.data) {
      return;
    }

    tickets.touch(key, tenant.subdomain, hostFor(tenant), query.data.live, query.data.category.name_en);
    // Only the status matters: rewriting the row on every poll would be waste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return query;
}

/** Tickets this device has taken, newest first. */
export function useHistory() {
  const tickets = useDependency('tickets');

  return useQuery({
    queryKey: ['guest', 'history'],
    queryFn: () => tickets.list(),
    staleTime: 0,
  });
}
