import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { GuestApi } from '@/services/guestApi';

/**
 * Push registration for the guest's current ticket.
 *
 * Remote push needs a development build (Expo Go dropped Android remote push),
 * so every call is guarded: on a device that cannot provide a token the app
 * simply falls back to polling, which it does anyway.
 */
export async function registerDevice(api: GuestApi, ticketKey: string): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      // Must match the channelId the server sends, or Android 8+ drops it.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Token calls',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 120, 250],
        sound: 'default',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const granted =
      existing.granted || (await Notifications.requestPermissionsAsync()).granted;

    if (!granted) {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;

    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

    await api.registerDevice({
      key: ticketKey,
      expo_push_token: token,
      platform: Platform.OS,
    });

    return token;
  } catch {
    // No push is not a broken app: the ticket still polls.
    return null;
  }
}

export async function unregisterDevice(api: GuestApi, ticketKey: string, token: string): Promise<void> {
  try {
    await api.unregisterDevice({ key: ticketKey, expo_push_token: token });
  } catch {
    // Leaving a stale registration behind is harmless; Expo prunes dead ones.
  }
}
