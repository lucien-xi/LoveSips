// Pure planning. buildPlan() computes the exact set of one-shot notifications
// that SHOULD exist right now, given app state. It has no side effects —
// engine.js diffs the plan against what is actually scheduled with the OS.
//
// Why one-shots instead of repeating triggers: expo-notifications runs no JS at
// delivery time, so rules like "stop at 100%" or "only if gift unclaimed" can
// only be enforced by scheduling concrete dates ahead (today + tomorrow) and
// re-planning on every relevant in-app event. Correctness over infinity: if the
// app isn't opened for ~2 days the daily plan runs out, and the pre-scheduled
// comeback chain takes over.

// Quiet hours. A constant today; designed to become a user setting later —
// everything below reads from this object.
export const QUIET = { startMin: 9 * 60, endMin: 22 * 60 };

const HYDRATION_FIRST_MIN = 9 * 60;       // spec: active from 9:00…
const HYDRATION_LAST_MIN = 20 * 60 + 50;  // …to 21:00, padded for alarm drift
const MORNING_START_MIN = 8 * 60 + 30;    // spec: random within 8:30–9:00.
//   NOTE: this window is the one sanctioned exception to QUIET (the spec sets
//   both), like an alarm clock; every other category is clamped to QUIET.
const MORNING_SPAN_MIN = 31;
const GIFT_MIN = 9 * 60 + 30;             // 9:30
const STREAK_MIN = 20 * 60;               // 20:00
const BEDTIME_MIN = 21 * 60 + 55;         // spec 22:00 == QUIET end; 5 min of
//                                           padding so drift can't cross it
const COMEBACK_DAYS = [2, 5, 10];
const COMEBACK_MIN = 12 * 60;             // midday, comfortably inside QUIET
const LOVE_NOTE_WINDOW = { startMin: 11 * 60, endMin: 18 * 60 };

export const dayKeyOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const atMinutes = (day, minutes) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minutes / 60), minutes % 60).getTime();

// Deterministic pseudo-random in [0,1) from a string seed (FNV-1a). Used for
// per-day random times (e.g. the morning slot) so repeated re-planning on the
// same day always lands on the same minute — otherwise every sync would see a
// "changed" plan and churn the schedule.
function seededFrac(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// Picks the next surprise love-note moment: 2–3 days out, random daytime hour.
// The result is persisted (notifState.nextLoveNoteAt) so it stays stable.
export function pickNextLoveNoteAt(now = new Date()) {
  const days = 2 + (Math.random() < 0.5 ? 0 : 1);
  const span = LOVE_NOTE_WINDOW.endMin - LOVE_NOTE_WINDOW.startMin;
  const minutes = LOVE_NOTE_WINDOW.startMin + Math.floor(Math.random() * (span + 1));
  return atMinutes(addDays(startOfDay(now), days), minutes);
}

// snap: { remindersOn, interval, goalDone, streak, lastCompletedDate, giftClaimedToday }
// meta: notification storage blob { lastOpenDate, nextLoveNoteAt }
export function buildPlan(snap, meta, now = new Date()) {
  const items = [];
  if (!snap.remindersOn) return items; // master switch: silence means silence

  const today = startOfDay(now);
  const todayKey = dayKeyOf(today);
  const yesterdayKey = dayKeyOf(addDays(today, -1));
  const horizon = [today, addDays(today, 1)];
  const push = (key, category, at) => items.push({ key, category, at });

  for (const day of horizon) {
    const key = dayKeyOf(day);
    const isToday = key === todayKey;
    const goalOpen = !isToday || !snap.goalDone; // tomorrow always starts at 0%

    // Good morning — stable random minute per day.
    const morningMin = MORNING_START_MIN + Math.floor(seededFrac(`morning:${key}`) * MORNING_SPAN_MIN);
    push(`morning:${key}`, 'morning', atMinutes(day, morningMin));

    // Hydration slots on a fixed grid (stable keys across re-plans).
    if (goalOpen) {
      const step = Math.max(30, Number(snap.interval) || 120);
      for (let m = HYDRATION_FIRST_MIN; m <= HYDRATION_LAST_MIN; m += step) {
        push(`hydration:${key}:${m}`, 'hydration', atMinutes(day, m));
      }
    }

    // Daily gift — until claimed.
    if (!isToday || !snap.giftClaimedToday) {
      push(`gift:${key}`, 'gift', atMinutes(day, GIFT_MIN));
    }

    // Streak protection — only when there is a live streak to protect:
    // today: she completed yesterday and hasn't finished today;
    // tomorrow: she completed today (cancelled on next re-plan if that changes).
    const streakAlive = isToday
      ? snap.streak > 0 && snap.lastCompletedDate === yesterdayKey && !snap.goalDone
      : snap.lastCompletedDate === todayKey;
    if (streakAlive) push(`streak:${key}`, 'streak', atMinutes(day, STREAK_MIN));

    // Final reminder of the day.
    if (goalOpen) push(`bedtime:${key}`, 'bedtime', atMinutes(day, BEDTIME_MIN));
  }

  // Surprise love note — single pending appointment, persisted in meta.
  if (meta.nextLoveNoteAt && meta.nextLoveNoteAt > now.getTime()) {
    push(`lovenote:${meta.nextLoveNoteAt}`, 'lovenote', meta.nextLoveNoteAt);
  }

  // Comeback chain, anchored to the last app open (updated by onAppOpen, so
  // any open cancels the old chain and re-arms a fresh one).
  const anchorKey = meta.lastOpenDate || todayKey;
  const [ay, am, ad] = anchorKey.split('-').map(Number);
  const anchor = new Date(ay, am - 1, ad);
  for (const n of COMEBACK_DAYS) {
    push(`comeback${n}:${anchorKey}`, `comeback${n}`, atMinutes(addDays(anchor, n), COMEBACK_MIN));
  }

  // Safety nets: future-only, and hard quiet-hours clamp (morning excepted).
  const cutoff = now.getTime() + 5000;
  return items
    .filter((i) => i.at > cutoff)
    .filter((i) => {
      const d = new Date(i.at);
      const min = d.getHours() * 60 + d.getMinutes();
      if (i.category === 'morning') return min >= MORNING_START_MIN;
      return min >= QUIET.startMin && min <= QUIET.endMin;
    })
    .sort((a, b) => a.at - b.at);
}

// Cheap fingerprint: identical plans → engine skips all native work.
export function planHash(items) {
  return items.map((i) => `${i.key}@${i.at}`).join('|');
}
