import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Notice, Screen } from '@/components/ui';
import { STATUS_LABEL } from '@/config';
import { useHistory } from '@/controllers/guest';
import { useDependency } from '@/di/container';
import type { HistoryEntry } from '@/models/types';
import type { RootStackParamList } from '@/navigation';
import { useSession } from '@/store/session';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

/**
 * Tickets taken on this device.
 *
 * A guest often has no account, so the device is the only place their past
 * tickets exist. Opening one restores its clinic and key, which is enough to
 * resolve the live ticket again — the key is the authorisation.
 */
export function HistoryScreen({ navigation }: Props) {
  const { data, refetch } = useHistory();
  const tickets = useDependency('tickets');
  const setTenant = useSession((state) => state.setTenant);
  const setTicketKey = useSession((state) => state.setTicketKey);

  const open = (entry: HistoryEntry) => {
    setTenant({ subdomain: entry.tenant, host: entry.tenantHost });
    setTicketKey(entry.key);
    navigation.reset({ index: 0, routes: [{ name: 'Ticket' }] });
  };

  const clear = () => {
    tickets.clear();
    refetch();
  };

  return (
    <Screen>
      <Text className="pt-4 text-lg font-bold text-primary">My tickets</Text>
      <Text className="mt-1 text-sm text-muted">The last {data?.length ?? 0} tickets taken on this phone.</Text>

      {data && data.length > 0 ? (
        data.map((entry) => (
          <Pressable key={entry.key} accessibilityRole="button" onPress={() => open(entry)}>
            <Card className="mt-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-semibold text-black">{entry.tokenNo}</Text>
                <Text className="text-xs text-muted">
                  {entry.categoryName ?? 'Service'} · {entry.tenant}
                </Text>
                <Text className="mt-1 text-xs text-primary">{STATUS_LABEL[entry.status] ?? entry.status}</Text>
              </View>
              <Text className="text-xs text-muted">{new Date(entry.createdAt).toLocaleTimeString()}</Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <View className="mt-6">
          <Notice text="No tickets on this phone yet." />
        </View>
      )}

      <Button title="Back" variant="outline" onPress={() => navigation.goBack()} className="mt-6" />
      {data && data.length > 0 ? (
        <Button title="Clear history" variant="ghost" onPress={clear} className="mt-2" />
      ) : null}
    </Screen>
  );
}
