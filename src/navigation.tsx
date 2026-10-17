import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { Service } from '@/models/types';
import { useSession } from '@/store/session';
import { ConfirmScreen } from '@/views/ConfirmScreen';
import { HistoryScreen } from '@/views/HistoryScreen';
import { ScanScreen } from '@/views/ScanScreen';
import { ServicesScreen } from '@/views/ServicesScreen';
import { SettingsScreen } from '@/views/SettingsScreen';
import { TenantScreen } from '@/views/TenantScreen';
import { TicketScreen } from '@/views/TicketScreen';

export type RootStackParamList = {
  Tenant: undefined;
  Scan: undefined;
  Services: undefined;
  Confirm: { service: Service };
  Ticket: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Where the app opens depends on what the guest already has: no clinic chosen
 * means the picker, a live ticket key means the ticket, otherwise the services.
 */
export function RootNavigator() {
  const tenant = useSession((state) => state.tenant);
  const ticketKey = useSession((state) => state.ticketKey);

  const initialRouteName = !tenant ? 'Tenant' : ticketKey ? 'Ticket' : 'Services';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tenant" component={TenantScreen} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
