import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Card, Field, Notice, Screen } from '@/components/ui';
import { QUICK_PICK_TENANTS } from '@/config';
import { useChooseTenant } from '@/controllers/tenant';
import { tenantFromSubdomain } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Space'>;

/**
 * The guest's first screen: which space are you visiting?
 *
 * Deliberately generic — a doctor's chamber, a hospital, a bank, a service
 * office. The space is remembered, so this screen appears once; changing it
 * later is available from settings.
 */
export function SpaceScreen({ navigation }: Props) {
  const { choose, busy, error } = useChooseTenant();
  const [code, setCode] = useState('');

  const quickPicks = useMemo(() => QUICK_PICK_TENANTS, []);

  const submit = async (subdomain: string) => {
    if (await choose(tenantFromSubdomain(subdomain))) {
      navigation.reset({ index: 0, routes: [{ name: 'Scan' }] });
    }
  };

  return (
    <Screen>
      <View className="pt-8 pb-2">
        <Text className="text-2xl font-bold text-primary">Which space are you visiting?</Text>
        <Text className="mt-1 text-sm text-muted">
          Enter the space code, or scan the code at the entrance.
        </Text>
      </View>

      <Field
        label="Space code"
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

      <Button
        title="Scan the space code instead"
        variant="outline"
        onPress={() => navigation.navigate('Scan')}
        className="mt-3"
      />

      {quickPicks.length > 0 ? (
        <Card className="mt-6">
          <Text className="text-sm font-semibold text-black">Spaces on this device</Text>
          <Text className="mt-1 text-xs text-muted">Development shortcuts.</Text>

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
