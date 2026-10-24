import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

import { Button, Notice, Screen } from '@/components/ui';
import { useChooseTenant } from '@/controllers/tenant';
import { parseJoinUrl } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

/**
 * Scan the clinic's join code.
 *
 * Both QR shapes the admin QR Setup page prints are accepted. A code that is not
 * ours gets a clear message rather than a silent no-op, and the scanner pauses
 * itself while we validate so a burst of frames cannot fire two lookups.
 */
export function ScanScreen({ navigation }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const { choose, busy, error, setError } = useChooseTenant();
  const [handled, setHandled] = useState(false);
  const inFlight = useRef(false);

  const onScanned = useCallback(
    async (data: string) => {
      if (inFlight.current || handled) {
        return;
      }

      const tenant = parseJoinUrl(data);

      if (!tenant) {
        setError("That code isn't a Touch Queue join code.");
        return;
      }

      inFlight.current = true;
      setHandled(true);

      if (await choose(tenant)) {
        navigation.reset({ index: 0, routes: [{ name: 'Services' }] });
      } else {
        // Let them try again without leaving the camera.
        setHandled(false);
      }

      inFlight.current = false;
    },
    [choose, handled, navigation, setError],
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      const value = codes[0]?.value;

      if (value) {
        void onScanned(value);
      }
    },
  });

  if (!hasPermission) {
    return (
      <Screen>
        <Text className="mt-6 text-lg font-bold text-primary">Camera access needed</Text>
        <Text className="mt-1 text-sm text-muted">
          Touch Queue uses the camera only to read the clinic's join code.
        </Text>
        <Button title="Allow camera" onPress={() => requestPermission()} className="mt-4" />
        <Button title="Enter the code instead" variant="ghost" onPress={() => navigation.goBack()} className="mt-2" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="mt-4 text-lg font-bold text-primary">Scan the join code</Text>
      <Text className="mt-1 text-sm text-muted">Point the camera at the QR code at the entrance or reception.</Text>

      <View className="mt-4 h-80 overflow-hidden rounded-2xl border border-border bg-black">
        {device ? (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive={!handled} codeScanner={codeScanner} />
        ) : (
          <Text className="mt-10 text-center text-white">No camera available on this device.</Text>
        )}
      </View>

      {busy ? <Text className="mt-3 text-center text-sm text-muted">Checking the clinic…</Text> : null}

      {error ? (
        <View className="mt-3">
          <Notice text={error} tone="error" />
        </View>
      ) : null}

      <Button title="Enter the code instead" variant="ghost" onPress={() => navigation.goBack()} className="mt-4" />

      {__DEV__ ? (
        <Button
          title="Dev: choose space"
          variant="ghost"
          onPress={() => navigation.navigate('Space')}
          className="mt-1"
        />
      ) : null}
    </Screen>
  );
}
