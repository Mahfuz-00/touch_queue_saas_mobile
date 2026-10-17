import './global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DependencyProvider, container } from '@/di/container';
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
