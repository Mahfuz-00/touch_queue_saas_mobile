import notifee, { AndroidImportance } from '@notifee/react-native';

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
