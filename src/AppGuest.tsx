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
import { SpaceScreen } from '@/views/SpaceScreen';
import { TicketScreen } from '@/views/TicketScreen';

/**
 * The guest app: pick the space once, then join its queue.
 *
 * Only guest screens are reachable from this entry — there is no sign-in, no
 * counter board and no dashboard anywhere in this bundle, so a guest build
 * carries no staff code at all.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function GuestApp() {
  const tenant = useSession((state) => state.tenant);
  const ticketKey = useSession((state) => state.ticketKey);

  // The space is remembered, so it is only asked for the first time.
  const initialRouteName = !tenant ? 'Space' : ticketKey ? 'Ticket' : 'Scan';

  return (
    <Providers>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Space" component={SpaceScreen} />
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
