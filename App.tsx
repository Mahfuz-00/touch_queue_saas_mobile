import './global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependencyProvider, container } from '@/di/container';
import { RootNavigator } from '@/navigation';
import { initStorage } from '@/services/storage';

/**
 * One QueryClient for the app. Retries are deliberately shallow: the guest is
 * standing in a queue, so a clear error beats a spinner that keeps spinning.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  const [ready, setReady] = useState(false);

  // Storage is read synchronously from memory, so it has to be loaded once
  // before the first screen renders.
  useEffect(() => {
    initStorage().finally(() => setReady(true));
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
          <RootNavigator />
          <StatusBar barStyle="dark-content" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </DependencyProvider>
  );
}
