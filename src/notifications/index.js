// Public API of the LoveSips notification service. Screens and the store talk
// ONLY to this module — never to expo-notifications directly.
//
//   init()                    once at startup (foreground behaviour)
//   ensurePermission()        permission flow for the Settings toggle
//   attachNavigation(goHome)  tap-on-notification → Home (returns detach fn)
//   onAppOpen(snap)           app launched / came to foreground
//   onToggle / onIntervalChange / onGoalProgress / onGiftClaimed / syncNow
//                             re-plan after an in-app event
//   maybeNotifyMilestone(pct, snap)  instant milestone push (background only)
//
// `snap` is the store's notifSnapshot(): { remindersOn, interval, goalDone,
// streak, lastCompletedDate, giftClaimedToday, name }.
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ensurePermission as requestPermission } from './permissions';
import { buildPlan, pickNextLoveNoteAt, dayKeyOf } from './scheduler';
import { applyPlan, cancelAllTracked, presentNow } from './engine';
import { loadNotifState, saveNotifState } from './storage';

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;
  // While she's inside the app, OS banners stay silent — the in-app toasts and
  // reward modals own the foreground experience.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission() {
  try {
    return await requestPermission();
  } catch (e) {
    return 'denied';
  }
}

const msgVars = (snap) => ({
  name: (snap.name || '').trim() || 'baby',
  streak: snap.streak,
});

async function hasPermission() {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch (e) {
    return false;
  }
}

// Recomputes the desired plan and reconciles it with the OS. Cheap when
// nothing changed (plan-hash short-circuit in the engine).
export async function syncNow(snap) {
  try {
    if (!snap.remindersOn || !(await hasPermission())) {
      await cancelAllTracked();
      return;
    }
    const meta = await loadNotifState();
    await applyPlan(buildPlan(snap, meta, new Date()), msgVars(snap));
  } catch (e) {}
}

// Named aliases so call sites in the store read as intent, and so individual
// events can diverge from a full sync later without touching the store again.
export const onToggle = syncNow;
export const onIntervalChange = syncNow;
export const onGoalProgress = syncNow;
export const onGiftClaimed = syncNow;

// App open / return to foreground: record the visit (re-arms the comeback
// chain), roll the love-note appointment forward if it fired, then re-plan.
export async function onAppOpen(snap) {
  try {
    const st = await loadNotifState();
    st.lastOpenDate = dayKeyOf(new Date());
    if (!st.nextLoveNoteAt || st.nextLoveNoteAt <= Date.now()) {
      st.nextLoveNoteAt = pickNextLoveNoteAt(new Date());
    }
    await saveNotifState(st);
    await syncNow(snap);
  } catch (e) {}
}

// Milestone pushes exist ONLY for the app-in-background case; in the
// foreground the existing reward modal + confetti handle it (per spec).
export async function maybeNotifyMilestone(pct, snap) {
  try {
    if (AppState.currentState === 'active') return;
    if (!snap.remindersOn || !(await hasPermission())) return;
    await presentNow('milestone', { ...msgVars(snap), pct });
  } catch (e) {}
}

// Wires notification taps to navigation; handles the cold-start tap too
// (app launched by tapping a notification → getLastNotificationResponse).
export function attachNavigation(navigateHome) {
  const sub = Notifications.addNotificationResponseReceivedListener(() => navigateHome());
  try {
    if (Notifications.getLastNotificationResponse()) {
      navigateHome();
      Notifications.clearLastNotificationResponse();
    }
  } catch (e) {}
  return () => sub.remove();
}
