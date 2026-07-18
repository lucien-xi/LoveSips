import AsyncStorage from '@react-native-async-storage/async-storage';

// All notification bookkeeping lives in one JSON blob, separate from the main
// app state so notification internals never touch gameplay data.
const KEY = 'lovesips_notifications_v1';

const DEFAULTS = {
  permissionStatus: null, // 'granted' | 'denied' | 'blocked'
  lastOpenDate: null,     // 'YYYY-MM-DD' of the most recent app open
  planHash: null,         // fingerprint of the currently-scheduled plan
  scheduled: {},          // planKey -> native notification id
  lastMsg: {},            // category -> index of last message used (no repeats)
  nextLoveNoteAt: null,   // epoch ms of the next surprise love note
};

export async function loadNotifState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export async function saveNotifState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {}
}
