import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';

import { QUICK_PICK_TENANTS } from '@/config';
import { useChooseTenant } from '@/controllers/tenant';
import { parseJoinUrl, tenantFromSubdomain } from '@/lib/utils';
import type { RootStackParamList } from '@/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

/** Indigo from the scan-screen design. */
const ACCENT = '#4F46E5';
const SURFACE = '#F8FAFC';

/**
 * Scan the space's code.
 *
 * Nothing is typed: the QR carries the space. Both shapes the admin QR page
 * prints are accepted, and a code that is not ours says so instead of failing
 * silently. The scanner pauses itself while the space is validated so a burst of
 * frames cannot fire two lookups.
 */
export function ScanScreen({ navigation }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const { choose, busy, error, setError } = useChooseTenant();
  const [handled, setHandled] = useState(false);
  const [torch, setTorch] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const inFlight = useRef(false);

  // The laser sweeps the reticle while the camera is live, and stops on unmount.
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [sweep]);

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
      <SafeAreaView className="flex-1 justify-center px-6" style={{ backgroundColor: SURFACE }}>
        <Text className="text-2xl font-bold" style={{ color: ACCENT }}>
          Camera access needed
        </Text>
        <Text className="mt-2 text-[15px] leading-relaxed text-slate-500">
          Touch Queue uses the camera only to read the space's code.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => requestPermission()}
          className="mt-6 items-center rounded-2xl py-3.5"
          style={{ backgroundColor: ACCENT }}
        >
          <Text className="text-base font-semibold text-white">Allow camera</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: SURFACE }}>
      <View className="flex-1 px-5 pt-6 pb-6">
        <View className="space-y-1.5">
          <Text className="text-center text-2xl font-bold tracking-tight" style={{ color: ACCENT }}>
            Scan the join code
          </Text>
          <Text className="mt-1.5 text-center text-[15px] leading-relaxed text-slate-500">
            Point the camera at the QR code at the entrance or reception.
          </Text>
        </View>

        <View className="flex-1 items-center justify-center py-2">
          <View
            className="w-full overflow-hidden rounded-3xl border-4 border-white bg-slate-900"
            style={[styles.viewport, styles.shadow]}
          >
            {device ? (
              <Camera
                key={cameraKey}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={!handled}
                torch={torch ? 'on' : 'off'}
                codeScanner={codeScanner}
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-white/70">No camera available on this device.</Text>
              </View>
            )}

            {/* Vignette, so the reticle reads against a bright scene. */}
            <View className="absolute inset-0 bg-black/20" pointerEvents="none" />

            <View className="absolute inset-7 items-center justify-center" pointerEvents="none">
              <View className="absolute inset-0 rounded-2xl border border-white/20" />

              <View className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4" style={styles.corner} />
              <View className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4" style={styles.corner} />
              <View className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4" style={styles.corner} />
              <View className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4" style={styles.corner} />

              <Animated.View
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  height: 2.5,
                  backgroundColor: ACCENT,
                  shadowColor: ACCENT,
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  transform: [
                    {
                      translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [-110, 110] }),
                    },
                  ],
                }}
              />

              <View className="h-6 w-6 items-center justify-center rounded-full border border-white/40">
                <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
              </View>
            </View>

            <View className="absolute inset-x-0 bottom-4 items-center" pointerEvents="none">
              <View className="flex-row items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5">
                <View className="h-2 w-2 rounded-full bg-emerald-400" />
                <Text className="text-xs font-medium tracking-wide text-white/90">
                  {busy || handled ? 'Checking the space…' : 'Detecting QR code…'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View className="mb-3 rounded-xl bg-red-50 px-3 py-2">
            <Text className="text-sm text-red-600">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => setTorch((value) => !value)}
            className="flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5"
          >
            <Text className="text-sm font-medium text-slate-700">{torch ? 'Torch on' : 'Flashlight'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setCameraKey((key) => key + 1)}
            className="flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5"
          >
            <Text className="text-sm font-medium text-slate-700">Recenter</Text>
          </Pressable>
        </View>

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            className="mt-3 items-center py-2"
            onPress={() => choose(tenantFromSubdomain(QUICK_PICK_TENANTS[0]))}
          >
            <Text className="text-xs text-slate-400">Dev: use test space</Text>
          </Pressable>
        ) : null}

        <View className="mt-2 h-1 w-32 self-center rounded-full bg-slate-300" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  viewport: {
    aspectRatio: 4 / 5,
    maxHeight: 460,
  },
  shadow: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  corner: {
    borderColor: ACCENT,
  },
});
