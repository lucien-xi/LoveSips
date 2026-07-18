import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { loadNotifState, saveNotifState } from './storage';

export const CHANNEL_ID = 'lovesips-reminders';

// Android 8+ requires a channel; on Android 13+ the permission prompt will not
// even appear until at least one channel exists — so this must run first.
export async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reminders from him 💜',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#A855F7',
  });
}

// Resolves to 'granted' | 'denied' | 'blocked'.
//  - 'denied'  → she said no to this prompt (we won't flip the toggle on)
//  - 'blocked' → OS won't let us ask again; she must enable it in Settings.
// We only ever *request* when the OS says asking is still allowed, so she is
// never nagged repeatedly.
export async function ensurePermission() {
  await ensureChannel();
  let result;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    result = 'granted';
  } else if (current.canAskAgain) {
    const req = await Notifications.requestPermissionsAsync();
    result = req.granted ? 'granted' : 'denied';
  } else {
    result = 'blocked';
  }
  const st = await loadNotifState();
  st.permissionStatus = result;
  await saveNotifState(st);
  return result;
}
