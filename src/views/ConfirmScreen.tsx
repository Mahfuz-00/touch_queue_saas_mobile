import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Button, Card, Field, Notice, Screen } from '@/components/ui';
import { useJoin } from '@/controllers/guest';
import { normalisePhone } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation';
import { ApiError } from '@/services/guestApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirm'>;

/**
 * Confirm details (screen two).
 *
 * The token is only allocated here, on the server, after these details arrive —
 * selecting a service on the previous screen does not take a number.
 */
export function ConfirmScreen({ navigation, route }: Props) {
  const { service } = route.params;
  const join = useJoin();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [reservation, setReservation] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const serverErrors = join.error instanceof ApiError ? (join.error.errors ?? {}) : {};

  const submit = () => {
    const normalised = normalisePhone(phone);

    if (!normalised) {
      setLocalError('Enter a mobile number like 01712345678.');
      return;
    }

    const size = parseInt(partySize, 10);

    if (Number.isNaN(size) || size < 1 || size > 50) {
      setLocalError('Party size must be between 1 and 50.');
      return;
    }

    setLocalError(null);

    join.mutate(
      {
        category_id: service.id,
        name: name.trim(),
        phone: normalised,
        party_size: size,
      },
      { onSuccess: () => navigation.reset({ index: 0, routes: [{ name: 'Ticket' }] }) },
    );
  };

  return (
    <Screen>
      <Text className="pt-4 text-lg font-bold text-primary">{service.name_en}</Text>
      <Text className="mt-1 text-sm text-muted">
        Your token is confirmed once your name and number are entered.
      </Text>

      <Card className="mt-4">
        <View className="gap-4">
          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoComplete="name"
            error={serverErrors.name?.[0] ?? null}
          />

          <Field
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            placeholder="01712345678"
            keyboardType="phone-pad"
            error={serverErrors.phone?.[0] ?? null}
          />

          <Field
            label="Party size"
            value={partySize}
            onChangeText={setPartySize}
            keyboardType="number-pad"
            error={serverErrors.party_size?.[0] ?? null}
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted">This is a reservation</Text>
            <Switch value={reservation} onValueChange={setReservation} trackColor={{ true: '#6153a3' }} />
          </View>
        </View>
      </Card>

      {localError ? (
        <View className="mt-3">
          <Notice text={localError} tone="error" />
        </View>
      ) : null}

      {join.error && !localError ? (
        <View className="mt-3">
          <Notice
            text={join.error instanceof ApiError ? join.error.message : 'Could not take a token. Try again.'}
            tone="error"
          />
        </View>
      ) : null}

      <Button
        title="Confirm and get my token"
        onPress={submit}
        loading={join.isPending}
        disabled={name.trim().length === 0 || phone.trim().length === 0}
        className="mt-5"
      />

      <Button title="Back" variant="ghost" onPress={() => navigation.goBack()} className="mt-2" />
    </Screen>
  );
}
