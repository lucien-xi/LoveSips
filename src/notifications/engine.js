// The only module that talks to the expo-notifications scheduling APIs.
// applyPlan() reconciles a desired plan (from scheduler.js) with what is
// actually scheduled: cancel stale, schedule missing, leave the rest alone —
// so unchanged slots are never churned (battery + no lost notifications).
import * as Notifications from 'expo-notifications';
import { CHANNEL_ID } from './permissions';
import { poolFor } from './messages';
import { pickWithoutRepeatingLast, format } from './messages/utils';
import { loadNotifState, saveNotifState } from './storage';
import { planHash } from './scheduler';

// Message text is chosen once, when a slot is first scheduled, using the
// per-category "don't repeat the last one" picker.
function compose(st, category, vars) {
  const pool = poolFor(category);
  const { item, index } = pickWithoutRepeatingLast(pool, st.lastMsg[category]);
  if (!item) return null;
  st.lastMsg[category] = index;
  return {
    title: format(item.title, vars),
    body: format(item.body, vars),
    data: { screen: 'home', category },
  };
}

export async function applyPlan(items, vars) {
  const st = await loadNotifState();
  const hash = planHash(items);
  if (hash === st.planHash) return; // plan unchanged → zero native calls

  const desired = new Set(items.map((i) => i.key));

  // 1. Cancel slots that should no longer exist (incl. already-fired leftovers;
  //    cancelling a delivered id is a harmless no-op).
  for (const [key, id] of Object.entries(st.scheduled)) {
    if (!desired.has(key)) {
      try { await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {}
      delete st.scheduled[key];
    }
  }

  // 2. Schedule slots that are new in this plan.
  for (const item of items) {
    if (st.scheduled[item.key]) continue;
    const content = compose(st, item.category, vars);
    if (!content) continue;
    try {
      st.scheduled[item.key] = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.at,
          channelId: CHANNEL_ID,
        },
      });
    } catch (e) {}
  }

  st.planHash = hash;
  await saveNotifState(st);
}

// Used when reminders are switched off or permission is lost.
export async function cancelAllTracked() {
  const st = await loadNotifState();
  if (!st.planHash && Object.keys(st.scheduled).length === 0) return;
  for (const id of Object.values(st.scheduled)) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch (e) {}
  }
  st.scheduled = {};
  st.planHash = null;
  await saveNotifState(st);
}

// Immediate delivery (milestones). trigger:null == "now".
export async function presentNow(category, vars) {
  const st = await loadNotifState();
  const content = compose(st, category, vars);
  if (!content) return;
  try {
    await Notifications.scheduleNotificationAsync({ content, trigger: null });
    await saveNotifState(st); // persist lastMsg so repeats stay avoided
  } catch (e) {}
}
