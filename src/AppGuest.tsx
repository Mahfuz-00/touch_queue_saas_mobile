import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Providers } from '@/Providers';
import type { RootStackParamList } from '@/navigation';
import { ConfirmScreen } from '@/views/ConfirmScreen';
import { HistoryScreen } from '@/views/HistoryScreen';
import { ScanScreen } from '@/views/ScanScreen';
import { ServicesScreen } from '@/views/ServicesScreen';
import { SettingsScreen } from '@/views/SettingsScreen';
import { TenantScreen } from '@/views/TenantScreen';
import { TicketScreen } from '@/views/TicketScreen';

/**
 * The guest app: scan the clinic's code and follow the queue.
 *
 * Only these screens are reachable from this entry, so the staff board, the
 * dashboard and the clinic login are not part of the guest bundle at all.
 * TenantScreen is included solely for the dev-only manual entry on the scanner.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function GuestApp() {
  return (
    <Providers>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scan" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Tenant" component={TenantScreen} />
          <Stack.Screen name="Services" component={ServicesScreen} />
          <Stack.Screen name="Confirm" component={ConfirmScreen} />
          <Stack.Screen name="Ticket" component={TicketScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Providers>
  );
}
