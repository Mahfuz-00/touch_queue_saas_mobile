import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Field, Notice, Screen } from '@/components/ui';
import { useChooseTenant } from '@/controllers/tenant';
import { tenantFromSubdomain } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Tenant'>;

/**
 * Choosing a clinic.
 *
 * Scanning is the normal path, but a guest standing in the queue is not the only
 * user of this screen — developers on an emulator cannot scan anything, so the
 * clinic code can also be typed, and the clinics listed in EXPO_PUBLIC_TENANTS
 * are offered as one-tap choices.
 */
export function TenantScreen({ navigation }: Props) {
  const { choose, busy, error } = useChooseTenant();
  const [code, setCode] = useState('');

  const quickPicks = useMemo(
    () =>
      String(process.env.EXPO_PUBLIC_TENANTS ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    [],
  );

  const submit = async (subdomain: string) => {
    if (await choose(tenantFromSubdomain(subdomain))) {
      navigation.reset({ index: 0, routes: [{ name: 'Services' }] });
    }
  };

  return (
    <Screen>
      <View className="pt-6 pb-2">
        <Text className="text-2xl font-bold text-primary">Join a queue</Text>
        <Text className="mt-1 text-sm text-muted">
          Find the clinic you are visiting to take your place in line.
        </Text>
      </View>

      <Button title="Scan the clinic's QR code" onPress={() => navigation.navigate('Scan')} className="mt-4" />

      <View className="my-5 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-xs uppercase text-muted">or enter the clinic code</Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <Field
        label="Clinic code"
        value={code}
        onChangeText={setCode}
        placeholder="metro"
        autoCapitalize="none"
        autoCorrect={false}
        error={null}
      />

      <Button
        title="Continue"
        onPress={() => submit(code)}
        loading={busy}
        disabled={code.trim().length === 0}
        className="mt-3"
      />

      {error ? (
        <View className="mt-3">
          <Notice text={error} tone="error" />
        </View>
      ) : null}

      {quickPicks.length > 0 ? (
        <Card className="mt-6">
          <Text className="text-sm font-semibold text-black">Clinics on this device</Text>
          <Text className="mt-1 text-xs text-muted">
            Convenience list for development, from EXPO_PUBLIC_TENANTS.
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {quickPicks.map((subdomain) => (
              <Pressable
                key={subdomain}
                accessibilityRole="button"
                disabled={busy}
                onPress={() => submit(subdomain)}
                className="rounded-full border border-primary bg-primary-soft px-3 py-2"
              >
                <Text className="text-sm font-semibold text-primary">{subdomain}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
