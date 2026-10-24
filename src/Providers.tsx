import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependencyProvider, container } from '@/di/container';
import { initStorage } from '@/services/storage';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';

/**
 * Everything an app shell needs, shared by the guest and staff entries.
 *
 * The QueryClient is created per app process: the two apps are separate builds,
 * so neither should inherit the other's cache behaviour.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            gcTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  // Storage is read synchronously from memory, so it must load before the first
  // screen renders. Both stores are re-read afterwards: they are created at
  // module load, before the async storage has finished reading from disk.
  useEffect(() => {
    initStorage().finally(() => {
      useSession.getState().hydrate();
      useAuth.getState().hydrate();
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#6153a3" />
      </View>
    );
  }

  return (
    <DependencyProvider value={container}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          {children}
          <StatusBar barStyle="dark-content" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </DependencyProvider>
  );
}
