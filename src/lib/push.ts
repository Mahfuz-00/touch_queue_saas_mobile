import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

import type { GuestApi } from '@/services/guestApi';

/**
 * Call alerts while the app is alive.
 *
 * This was expo-notifications. Remote push (a locked phone) needs FCM/APNs
 * credentials and a backend able to send them — the Laravel side currently sends
 * through Expo's relay, so it changes when push moves to FCM. Until then this
 * raises a local notification, which is what a guest with the app open needs; the
 * dialog and the spoken announcement remain the guarantees.
 */
let prepared = false;

export async function prepare(): Promise<boolean> {
  if (prepared) {
    return true;
  }

  try {
    await notifee.requestPermission();
    await notifee.createChannel({
      id: 'default',
      name: 'Token calls',
      importance: AndroidImportance.HIGH,
      vibration: true,
    });

    prepared = true;

    return true;
  } catch {
    return false;
  }
}

export async function notifyCalled(fullTokenNo: string | null, counterName?: string | null): Promise<void> {
  try {
    await notifee.displayNotification({
      title: `Token ${fullTokenNo ?? ''} is called`,
      body: counterName ? `Please proceed to ${counterName}.` : 'Please proceed to the counter.',
      android: { channelId: 'default', pressAction: { id: 'default' } },
    });
  } catch {
    // A missed notification must never break the ticket screen.
  }
}

/**
 * The device's push registration token, or null when no provider is installed.
 *
 * FCM is the intended provider, and this is the only place that has to change
 * for it: add @react-native-firebase/app and @react-native-firebase/messaging
 * (which needs google-services.json in the project) and return
 * `await messaging().getToken()` here. Registration then starts flowing to the
 * backend, which already delivers through FCM when its own credentials are set.
 *
 * Until then push is simply off, and the ticket screen keeps polling — the
 * channel that works with no setup at all.
 */
export async function registrationToken(): Promise<string | null> {
  return null;
}

/**
 * Ask for notification permission and, when a provider can supply a token,
 * register this device so the clinic can reach it while the screen is locked.
 */
export async function register(api: GuestApi, ticketKey: string): Promise<string | null> {
  if (!(await prepare())) {
    return null;
  }

  const token = await registrationToken();

  if (!token) {
    return null;
  }

  try {
    await api.registerDevice({ key: ticketKey, push_token: token, platform: Platform.OS });

    return token;
  } catch {
    // Registration failing only means this device relies on polling.
    return null;
  }
}
