import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { Service } from '@/models/types';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';
import { AdminHomeScreen } from '@/views/AdminHomeScreen';
import { ConfirmScreen } from '@/views/ConfirmScreen';
import { HistoryScreen } from '@/views/HistoryScreen';
import { LoginScreen } from '@/views/LoginScreen';
import { ScanScreen } from '@/views/ScanScreen';
import { ServicesScreen } from '@/views/ServicesScreen';
import { SettingsScreen } from '@/views/SettingsScreen';
import { StaffBoardScreen } from '@/views/StaffBoardScreen';
import { TenantScreen } from '@/views/TenantScreen';
import { TicketScreen } from '@/views/TicketScreen';

export type RootStackParamList = {
  Scan: undefined;
  Tenant: { next?: 'Services' | 'Login' } | undefined;
  Login: undefined;
  StaffBoard: undefined;
  AdminHome: undefined;
  Services: undefined;
  Confirm: { service: Service };
  Ticket: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Where the app opens.
 *
 * Guests start at the scanner — there is no clinic to pick, the QR carries it.
 * Clinic users open their board or dashboard, and anyone not signed in reaches
 * sign-in from the scanner. The manual clinic picker is only a development
 * convenience, because an emulator cannot scan a code.
 */
export function RootNavigator() {
  const tenant = useSession((state) => state.tenant);
  const token = useAuth((state) => state.token);
  const isStaff = useAuth((state) => state.isStaff);

  const initialRouteName = token ? (isStaff ? 'StaffBoard' : 'AdminHome') : 'Scan';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Tenant" component={TenantScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="StaffBoard" component={StaffBoardScreen} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
        <Stack.Screen name="Services" component={ServicesScreen} />
        <Stack.Screen name="Confirm" component={ConfirmScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
