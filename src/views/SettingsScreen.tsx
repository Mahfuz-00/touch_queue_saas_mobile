import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { Button, Card, Screen, Stat } from '@/components/ui';
import { useDependency } from '@/di/container';
import type { RootStackParamList } from '@/navigation';
import { hostFor } from '@/services/guestApi';
import { KEYS, storage } from '@/services/storage';
import { useSession } from '@/store/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

/** Device-side settings: where we are pointed, and how to start over. */
export function SettingsScreen({ navigation }: Props) {
  const tenant = useSession((state) => state.tenant);
  const ticketKey = useSession((state) => state.ticketKey);
  const setTicketKey = useSession((state) => state.setTicketKey);
  const forgetTenant = useSession((state) => state.forgetTenant);
  const tickets = useDependency('tickets');
  const pushToken = storage.getString(KEYS.pushToken);

  const changeClinic = () => {
    setTicketKey(null);
    forgetTenant();
    navigation.reset({ index: 0, routes: [{ name: 'Tenant' }] });
  };

  const clearDevice = () => {
    tickets.clear();
    setTicketKey(null);
    forgetTenant();
    navigation.reset({ index: 0, routes: [{ name: 'Tenant' }] });
  };

  return (
    <Screen>
      <Text className="pt-4 text-lg font-bold text-primary">Settings</Text>

      <Card className="mt-4">
        <Text className="text-sm font-semibold text-black">Clinic</Text>
        <Text className="mt-1 text-sm text-muted">{tenant?.name ?? 'Not selected'}</Text>
        <Text className="mt-1 text-xs text-muted">{tenant ? hostFor(tenant) : '-'}</Text>
      </Card>

      <View className="mt-3 flex-row gap-3">
        <Stat label="Ticket" value={ticketKey ? 'Open' : 'None'} />
        <Stat label="Push" value={pushToken ? 'On' : 'Off'} />
      </View>

      <Text className="mt-5 text-xs text-muted">
        Push notifications arrive even when this app is closed, as long as you have a ticket open and
        notifications are allowed for Touch Queue in your phone settings.
      </Text>

      <Button title="Change clinic" variant="outline" onPress={changeClinic} className="mt-6" />
      <Button title="Clear tickets and clinic" variant="ghost" onPress={clearDevice} className="mt-2" />
      <Button title="Back" variant="ghost" onPress={() => navigation.goBack()} className="mt-2" />
    </Screen>
  );
}
