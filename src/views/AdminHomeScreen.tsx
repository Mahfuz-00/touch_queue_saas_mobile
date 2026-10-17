import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Text, View } from 'react-native';

import { Badge, Button, Card, Notice, Screen, Stat } from '@/components/ui';
import { STATUS_LABEL } from '@/config';
import { useDashboard, useLogout } from '@/controllers/clinic';
import type { RootStackParamList } from '@/navigation';
import { useAuth } from '@/store/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminHome'>;

/**
 * The compact tenant-admin dashboard: the same figures the web dashboard shows,
 * without the charts.
 */
export function AdminHomeScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch, isRefetching } = useDashboard(true);
  const logout = useLogout();
  const user = useAuth((state) => state.user);

  if (isLoading && !data) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color="#6153a3" />
      </Screen>
    );
  }

  const stats = data?.stats;

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-4">
        <View>
          <Text className="text-lg font-bold text-primary">Dashboard</Text>
          <Text className="text-xs text-muted">{user.name} · {user.role}</Text>
        </View>
        <Button title="Sign out" variant="ghost" onPress={() => logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))} />
      </View>

      <View className="mt-4 flex-row gap-3">
        <Stat label="Waiting now" value={String(stats?.waiting_now ?? 0)} />
        <Stat label="Served / month" value={String(stats?.served_this_month ?? 0)} />
      </View>

      <View className="mt-3 flex-row gap-3">
        <Stat label="Served / year" value={String(stats?.served_this_year ?? 0)} />
        <Stat label="Services" value={String(stats?.services ?? 0)} />
      </View>

      <View className="mt-3 flex-row gap-3">
        <Stat label="Counters" value={String(stats?.counters ?? 0)} />
        <Stat label="Staff" value={String(stats?.staff ?? 0)} />
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-black">Recent tokens</Text>
        <Text className="text-sm text-primary" onPress={() => refetch()}>
          {isRefetching ? 'Refreshing…' : 'Refresh'}
        </Text>
      </View>

      {(data?.recent_tokens ?? []).map((token) => (
        <Card key={token.id} className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-semibold text-black">{token.full_token_no}</Text>
            <Text className="text-xs text-muted">
              {token.category ?? 'Service'}
              {token.counter ? ` · ${token.counter}` : ''}
            </Text>
          </View>
          <Badge text={STATUS_LABEL[token.status] ?? token.status} tone="muted" />
        </Card>
      ))}

      {error ? (
        <View className="mt-4">
          <Notice text="Could not load the dashboard." tone="error" />
        </View>
      ) : null}
    </Screen>
  );
}
