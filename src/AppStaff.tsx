import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Providers } from '@/Providers';
import type { RootStackParamList } from '@/navigation';
import { useAuth } from '@/store/auth';
import { AdminHomeScreen } from '@/views/AdminHomeScreen';
import { LoginScreen } from '@/views/LoginScreen';
import { StaffBoardScreen } from '@/views/StaffBoardScreen';
import { TenantScreen } from '@/views/TenantScreen';

/**
 * The clinic app: sign in, run the counter, see the dashboard.
 *
 * Nothing from the guest journey is reachable here — no scanner, no ticket, no
 * guest receipt — so a staff build ships no guest code and needs no camera
 * permission.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StaffApp() {
  const token = useAuth((state) => state.token);
  const isStaff = useAuth((state) => state.isStaff);

  const initialRouteName = token ? (isStaff ? 'StaffBoard' : 'AdminHome') : 'Login';

  return (
    <Providers>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Tenant" component={TenantScreen} />
          <Stack.Screen name="StaffBoard" component={StaffBoardScreen} />
          <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Providers>
  );
}
