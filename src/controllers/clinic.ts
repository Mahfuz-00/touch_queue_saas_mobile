import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { POLL_MS } from '@/config';
import { useDependency } from '@/di/container';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';

/** Sign in with the clinic account. */
export function useLogin() {
  const api = useDependency('mobileApi');
  const tenant = useSession((state) => state.tenant);
  const signIn = useAuth((state) => state.signIn);

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api(tenant!).login(email, password, 'touch-queue-mobile'),
    onSuccess: (session) => {
      signIn({
        token: session.token,
        user: session.user,
        capabilities: session.capabilities,
        abilities: session.abilities,
      });
    },
  });
}

/**
 * The counter board, refreshed only while the screen is in front of someone.
 * A counter phone that is put down must not keep polling.
 */
export function useBoard(enabled = true) {
  const api = useDependency('mobileApi');
  const tenant = useSession((state) => state.tenant);
  const token = useAuth((state) => state.token);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));

    return () => subscription.remove();
  }, []);

  return useQuery({
    queryKey: ['mobile', 'board', tenant?.subdomain],
    queryFn: ({ signal }) => api(tenant!).board(token, signal),
    enabled: Boolean(enabled && tenant && token),
    refetchInterval: foreground ? POLL_MS : false,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

/** Counter actions, with the board refreshed as soon as one lands. */
export function useCounterAction() {
  const api = useDependency('mobileApi');
  const tenant = useSession((state) => state.tenant);
  const token = useAuth((state) => state.token);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ action, counterId }: { action: 'next' | 'recall' | 'skip' | 'serve' | 'forward'; counterId?: number }) =>
      action === 'forward' ? api(tenant!).forward(token, counterId!) : api(tenant!).call(token, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mobile', 'board'] }),
  });
}

/** The tenant admin summary. */
export function useDashboard(enabled = true) {
  const api = useDependency('mobileApi');
  const tenant = useSession((state) => state.tenant);
  const token = useAuth((state) => state.token);

  return useQuery({
    queryKey: ['mobile', 'dashboard', tenant?.subdomain],
    queryFn: ({ signal }) => api(tenant!).dashboard(token, signal),
    enabled: Boolean(enabled && tenant && token),
    staleTime: 30_000,
    retry: 1,
  });
}

/** Sign out: revoke the token server-side, then forget it here. */
export function useLogout() {
  const api = useDependency('mobileApi');
  const tenant = useSession((state) => state.tenant);
  const token = useAuth((state) => state.token);
  const signOut = useAuth((state) => state.signOut);
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api(tenant!).logout(token);
    } catch {
      // Offline sign-out still has to forget the token locally.
    }

    queryClient.clear();
    signOut();
  };
}
