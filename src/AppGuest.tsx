import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Providers } from '@/Providers';
import type { RootStackParamList } from '@/navigation';
import { useSession } from '@/store/session';
import { ConfirmScreen } from '@/views/ConfirmScreen';
import { HistoryScreen } from '@/views/HistoryScreen';
import { ScanScreen } from '@/views/ScanScreen';
import { ServicesScreen } from '@/views/ServicesScreen';
import { SettingsScreen } from '@/views/SettingsScreen';
import { TicketScreen } from '@/views/TicketScreen';

/**
 * The guest app: scan the space's code and follow the queue.
 *
 * Nothing is typed. The QR carries which space the guest is visiting, and the
 * space's own name is shown on the screens that follow. There is no sign-in, no
 * counter board and no dashboard anywhere in this bundle.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function GuestApp() {
  const ticketKey = useSession((state) => state.ticketKey);

  const initialRouteName = ticketKey ? 'Ticket' : 'Scan';

  return (
    <Providers>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Scan" component={ScanScreen} />
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
