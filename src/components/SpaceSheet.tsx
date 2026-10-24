import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button, Field, Notice } from '@/components/ui';
import { QUICK_PICK_TENANTS } from '@/config';
import { useChooseTenant } from '@/controllers/tenant';
import { tenantFromSubdomain } from '@/lib/utils';

/**
 * Choosing a space, as a bottom sheet.
 *
 * It used to be a full screen, which is heavy for a single field: the sheet
 * keeps the sign-in form behind it and closes as soon as the space is accepted.
 */
export function SpaceSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { choose, busy, error, setError } = useChooseTenant();
  const [code, setCode] = useState('');

  const quickPicks = useMemo(() => QUICK_PICK_TENANTS, []);

  const submit = async (value: string) => {
    if (!value.trim()) {
      setError('Enter the space code.');

      return;
    }

    if (await choose(tenantFromSubdomain(value))) {
      setCode('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityRole="button" className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-surface px-4 pt-4 pb-8" onPress={() => undefined}>
          <View className="mb-2 h-1 w-10 self-center rounded-full bg-border" />

          <Text className="text-lg font-bold text-primary">Choose your space</Text>
          <Text className="mt-1 text-sm text-muted">Enter the code your space gave you.</Text>

          <View className="mt-4">
            <Field
              label="Space code"
              value={code}
              onChangeText={setCode}
              placeholder="metro"
              autoCapitalize="none"
              autoCorrect={false}
              error={null}
            />
          </View>

          {error ? (
            <View className="mt-3">
              <Notice text={error} tone="error" />
            </View>
          ) : null}

          <Button
            title="Continue"
            onPress={() => submit(code)}
            loading={busy}
            className="mt-4"
          />

          {quickPicks.length > 0 ? (
            <View className="mt-4 flex-row flex-wrap gap-2">
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
          ) : null}

          <Button title="Cancel" variant="ghost" onPress={onClose} className="mt-2" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
