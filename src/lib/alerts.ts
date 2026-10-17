import Tts from 'react-native-tts';
import { Platform, Vibration } from 'react-native';

/**
 * Foreground alerting: say the token and buzz the phone.
 *
 * Both are best effort. Speech can be silenced by a device setting, and vibration
 * is Android-only (iOS exposes no API for it), which is exactly why the ticket
 * screen also shows a dialog — the one channel that always works.
 */
export function speak(text: string): void {
  try {
    Tts.stop();
    Tts.speak(text);
  } catch {
    // Speech is a bonus, never a failure.
  }
}

export function vibrate(pattern: number[] = [250, 120, 250, 120, 250]): void {
  try {
    Vibration.vibrate(Platform.OS === 'android' ? pattern : 400);
  } catch {
    // Unsupported platform.
  }
}

export function alertCalled(text: string): void {
  speak(text);
  vibrate();
}
