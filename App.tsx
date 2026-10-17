import './global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependencyProvider, container } from '@/di/container';
import { bootstrap } from '@/models/db';
import { RootNavigator } from '@/navigation';

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

  useEffect(() => {
    // Local tables must exist before any screen reads cached data.
    bootstrap();
    setReady(true);
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
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </DependencyProvider>
  );
}
