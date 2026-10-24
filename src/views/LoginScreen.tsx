import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Field, Notice, Screen } from '@/components/ui';
import { SpaceSheet } from '@/components/SpaceSheet';
import { useLogin } from '@/controllers/clinic';
import type { RootStackParamList } from '@/navigation';
import { MobileApiError } from '@/services/mobileApi';
import { useSession } from '@/store/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Sign-in for a space's staff and admins.
 *
 * Generic by design: the app serves chambers, hospitals, banks and offices, so
 * nothing here assumes a clinic. The space is picked through a bottom sheet —
 * one field does not deserve a whole screen — and "Change space" sits in the
 * footer.
 */
export function LoginScreen({ navigation }: Props) {
  const tenant = useSession((state) => state.tenant);
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const fieldErrors = login.error instanceof MobileApiError ? (login.error.errors ?? {}) : {};

  const submit = () => {
    if (!tenant) {
      setSheetOpen(true);

      return;
    }

    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (session) =>
          navigation.reset({
            index: 0,
            routes: [{ name: session.abilities.includes('staff') ? 'StaffBoard' : 'AdminHome' }],
          }),
      },
    );
  };

  return (
    <Screen>
      <View className="flex-1 justify-center pb-4">
        <Text className="text-3xl font-bold text-primary">Welcome to Touch Queue</Text>
        <Text className="mt-2 text-base text-muted">Sign in with your organization account.</Text>

        <Card className="mt-6">
          <View className="gap-4">
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={fieldErrors.email?.[0] ?? null}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={fieldErrors.password?.[0] ?? null}
            />
          </View>
        </Card>

        {tenant ? (
          <Text className="mt-3 text-xs text-muted">Space: {tenant.name ?? tenant.subdomain}</Text>
        ) : null}

        {login.error && !fieldErrors.email ? (
          <View className="mt-3">
            <Notice
              text={login.error instanceof MobileApiError ? login.error.message : 'Could not sign in.'}
              tone="error"
            />
          </View>
        ) : null}

        <Button
          title="Sign in"
          onPress={submit}
          loading={login.isPending}
          disabled={email.trim().length === 0 || password.length === 0}
          className="mt-5"
        />
      </View>

      <Text
        className="pb-2 text-center text-sm text-primary"
        accessibilityRole="button"
        onPress={() => setSheetOpen(true)}
      >
        Change space
      </Text>

      <SpaceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </Screen>
  );
}
