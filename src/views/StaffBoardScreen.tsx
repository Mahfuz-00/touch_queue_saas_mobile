import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

import { Button, Card, Notice, Screen, Stat } from '@/components/ui';
import { STATUS_LABEL } from '@/config';
import { useBoard, useCounterAction, useLogout } from '@/controllers/clinic';
import type { BoardToken } from '@/services/mobileApi';
import type { RootStackParamList } from '@/navigation';
import { useAuth } from '@/store/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffBoard'>;

/** Memoised row: the board polls, and rows must not re-render with it. */
const QueueRow = memo(function QueueRow({ token, secondary }: { token: BoardToken; secondary: boolean }) {
  const label = secondary ? token.category.name_secondary : token.category.name_en;

  return (
    <Card className="mt-2 flex-row items-center justify-between">
      <View>
        <Text className="text-lg font-semibold text-black">{token.full_token_no}</Text>
        <Text className="text-xs text-muted">{label ?? 'Service'}</Text>
      </View>
      <Text className="text-xs text-primary">{STATUS_LABEL[token.status] ?? token.status}</Text>
    </Card>
  );
});

/**
 * The staff counter board — the reason a clinic phone exists.
 *
 * Same rules as the web counter screen, enforced server side: this account only
 * ever sees its own counter's mapped services, and the actions 422 if no counter
 * is assigned.
 */
export function StaffBoardScreen({ navigation }: Props) {
  const { data, isLoading, error, isRefetching, refetch } = useBoard(true);
  const action = useCounterAction();
  const logout = useLogout();
  const user = useAuth((state) => state.user);

  const run = useCallback(
    (name: 'next' | 'recall' | 'skip' | 'serve') => action.mutate({ action: name }),
    [action],
  );

  if (isLoading && !data) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color="#6153a3" />
      </Screen>
    );
  }

  const serving = data?.serving;
  const secondary = data?.counter?.label === 'secondary';

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-4">
        <View>
          <Text className="text-lg font-bold text-primary">{data?.counter?.name ?? 'No counter'}</Text>
          <Text className="text-xs text-muted">{user.name} · {data?.served_today ?? 0} served today</Text>
        </View>
        <Button title="Sign out" variant="ghost" onPress={() => logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }))} />
      </View>

      <Card className="mt-4 items-center">
        <Text className="text-xs uppercase text-muted">Now serving</Text>
        <Text className="mt-1 text-5xl font-bold text-primary">{serving?.full_token_no ?? '—'}</Text>
        <Text className="mt-1 text-xs text-muted">
          {serving ? (serving.category.name_en ?? '') : 'Nothing is being served'}
        </Text>
      </Card>

      {data?.can_call ? (
        <View className="mt-3 gap-2">
          <Button title="Call next" onPress={() => run('next')} loading={action.isPending} />
          <View className="flex-row gap-2">
            <Button title="Recall" variant="outline" onPress={() => run('recall')} className="flex-1" />
            <Button title="Served" variant="outline" onPress={() => run('serve')} className="flex-1" />
            <Button title="Skip" variant="outline" onPress={() => run('skip')} className="flex-1" />
          </View>
        </View>
      ) : (
        <View className="mt-3">
          <Notice text="No counter is assigned to this account, so calls are disabled." />
        </View>
      )}

      {action.error ? (
        <View className="mt-3">
          <Notice text={action.error.message} tone="error" />
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <Stat label="Waiting" value={String(data?.waiting.length ?? 0)} />
        <Stat label="Missed" value={String(data?.missed.length ?? 0)} />
      </View>

      <View className="mt-5 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-black">Waiting queue</Text>
        <Text className="text-sm text-primary" onPress={() => refetch()}>
          {isRefetching ? 'Refreshing…' : 'Refresh'}
        </Text>
      </View>

      <FlatList
        data={data?.waiting ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <QueueRow token={item} secondary={secondary} />}
        scrollEnabled={false}
        removeClippedSubviews
        initialNumToRender={10}
        windowSize={5}
        ListEmptyComponent={<Text className="mt-4 text-center text-muted">Nobody is waiting.</Text>}
      />

      {error ? (
        <View className="mt-4">
          <Notice text="Lost connection to the space. Retrying…" tone="error" />
        </View>
      ) : null}
    </Screen>
  );
}
