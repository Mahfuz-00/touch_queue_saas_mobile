import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Field, Notice, Screen } from '@/components/ui';
import { useLogin } from '@/controllers/clinic';
import type { RootStackParamList } from '@/navigation';
import { hostFor } from '@/services/guestApi';
import { MobileApiError } from '@/services/mobileApi';
import { useAuth } from '@/store/auth';
import { useSession } from '@/store/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/**
 * Clinic staff and admin sign-in.
 *
 * Guests never see this: they take a token without an account. The clinic is
 * already chosen by this point (scanned or typed on the previous screen), which
 * is what makes the credentials check against the right database.
 */
export function LoginScreen({ navigation }: Props) {
  const tenant = useSession((state) => state.tenant);
  const isAdmin = useAuth((state) => state.isAdmin);
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fieldErrors = login.error instanceof MobileApiError ? (login.error.errors ?? {}) : {};

  const submit = () => {
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
      <View className="pt-6">
        <Text className="text-2xl font-bold text-primary">{tenant?.name ?? 'Space'}</Text>
        <Text className="mt-1 text-sm text-muted">Sign in with your space account.</Text>
        <Text className="mt-1 text-xs text-muted">{tenant ? hostFor(tenant) : ''}</Text>
      </View>

      <Card className="mt-5">
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

      <Button
        title="Continue as a guest"
        variant="outline"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Scan' }] })}
        className="mt-2"
      />

      <Button
        title="Change space"
        variant="ghost"
        onPress={() => navigation.navigate('Tenant', { next: 'Login' })}
        className="mt-2"
      />

      {isAdmin ? null : (
        <Text className="mt-4 text-center text-xs text-muted">
          Only space staff and admins have accounts. Guests just take a token.
        </Text>
      )}
    </Screen>
  );
}
