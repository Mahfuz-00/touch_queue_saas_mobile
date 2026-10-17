import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';

import { Button, Card, Notice, Screen, Stat } from '@/components/ui';
import { STATUS_LABEL, TOKEN_STATUS } from '@/config';
import { useTicket } from '@/controllers/guest';
import { useDependency } from '@/di/container';
import { alertCalled, speak, vibrate } from '@/lib/alerts';
import { callText } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation';
import { KEYS, storage } from '@/services/storage';
import { useSession } from '@/store/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Ticket'>;

/**
 * The live ticket — the screen the app exists for.
 *
 * When the counter calls this token the guest is told three ways: the phone
 * speaks, it vibrates, and a dialog appears. The dialog is the guarantee: speech
 * can be muted and iOS exposes no vibration API, so the message must also be on
 * screen.
 */
export function TicketScreen({ navigation }: Props) {
  const { data, isLoading, error, refetch, isRefetching } = useTicket(true);
  const push = useDependency('push');
  const api = useDependency('api');
  const ticketKey = useSession((state) => state.ticketKey);
  const tenant = useSession((state) => state.tenant);
  const setTicketKey = useSession((state) => state.setTicketKey);

  const [called, setCalled] = useState(false);
  const previousStatus = useRef<string | null>(null);

  const live = data?.live;
  const categoryName = data?.category.name_en ?? null;

  // Fire once per transition into "pending", never on a re-render or a poll.
  useEffect(() => {
    if (!live) {
      return;
    }

    if (live.status === TOKEN_STATUS.pending && previousStatus.current !== TOKEN_STATUS.pending) {
      setCalled(true);
      alertCalled(callText(live.full_token_no, categoryName));
      void push.notifyCalled(live.full_token_no, data?.category.name_en ?? null);
    }

    previousStatus.current = live.status;
  }, [live?.status]);

  // Permission plus, when a push provider exists, registering this device.
  // Both are optional: without them the screen simply keeps polling.
  useEffect(() => {
    if (!ticketKey || !tenant) {
      return undefined;
    }

    let cancelled = false;

    void push.register(api(tenant), ticketKey).then((registered) => {
      if (!cancelled && registered) {
        storage.set(KEYS.pushToken, registered);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketKey]);

  const repeat = () => {
    speak(callText(live?.full_token_no ?? null, categoryName));
    vibrate();
  };

  const startAnother = () => {
    setTicketKey(null);
    navigation.reset({ index: 0, routes: [{ name: 'Services' }] });
  };

  if (!ticketKey) {
    return (
      <Screen>
        <Text className="mt-10 text-center text-muted">No ticket on this device yet.</Text>
        <Button title="Take a token" onPress={startAnother} className="mt-4" />
      </Screen>
    );
  }

  if (isLoading && !data) {
    return (
      <Screen>
        <ActivityIndicator className="mt-16" color="#6153a3" />
      </Screen>
    );
  }

  if (live?.served) {
    return (
      <Screen>
        <Card className="mt-10 items-center">
          <Text className="text-2xl font-bold text-primary">You have been served</Text>
          <Text className="mt-2 text-muted">Thank you for visiting.</Text>
          <Text className="mt-4 text-4xl font-bold text-black">{data?.token.full_token_no}</Text>
        </Card>

        <Button title="Take another token" onPress={startAnother} className="mt-6" />
        <Button title="My tickets" variant="outline" onPress={() => navigation.navigate('History')} className="mt-2" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="pt-5 items-center">
        <Text className="text-xs uppercase text-muted">{categoryName ?? 'Your token'}</Text>
        <Text className="mt-1 text-6xl font-bold text-primary">{data?.token.full_token_no ?? '-'}</Text>
        <Text className="mt-2 text-sm font-semibold text-black">
          {STATUS_LABEL[live?.status ?? ''] ?? live?.status}
        </Text>
      </View>

      <View className="mt-6 flex-row gap-3">
        <Stat label="Ahead of you" value={String(live?.position ?? 0)} />
        <Stat label="Est. wait" value={live?.estimated_wait ? `${live.estimated_wait} min` : 'You are next'} />
      </View>

      <View className="mt-3 flex-row gap-3">
        <Stat label="Now serving" value={live?.serving_now ?? '-'} />
        <Stat label="Party" value={String(data?.token.party_size ?? 1)} />
      </View>

      {error ? (
        <View className="mt-4">
          <Notice
            text="Losing connection to the clinic. This page keeps trying."
            tone="error"
          />
        </View>
      ) : null}

      <Text className="mt-5 text-center text-xs text-muted">
        This page updates every few seconds. Keep it open, and keep notifications on.
      </Text>

      <Button
        title={isRefetching ? 'Refreshing…' : 'Refresh now'}
        variant="outline"
        onPress={() => refetch()}
        className="mt-4"
      />
      <Button title="My tickets" variant="ghost" onPress={() => navigation.navigate('History')} className="mt-2" />

      <Modal visible={called} transparent animationType="fade" onRequestClose={() => setCalled(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full rounded-2xl bg-surface p-6">
            <Text className="text-center text-xl font-bold text-primary">It&apos;s your turn</Text>
            <Text className="mt-1 text-center text-sm text-muted">
              {categoryName ? `Please proceed to the counter for ${categoryName}.` : 'Please proceed to the counter.'}
            </Text>

            <Text className="mt-4 text-center text-4xl font-bold text-black">{data?.token.full_token_no}</Text>

            <View className="mt-6 flex-row gap-3">
              <Button title="Hear it again" variant="outline" onPress={repeat} className="flex-1" />
              <Button title="On my way" onPress={() => setCalled(false)} className="flex-1" />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
