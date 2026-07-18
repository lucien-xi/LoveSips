import React, { createContext, useContext, useEffect, useReducer, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  REWARD_MESSAGES, SHOP_ITEMS, MYSTERY_POOL, MYSTERY_BOX_COST, DAILY_GIFT_AMOUNT,
  ACHIEVEMENTS, MILESTONE_HEART_VALUES, DAILY_COMPLETION_BONUS, STREAK7_BONUS, PERFECT_WEEK_BONUS,
} from './data';
import { haptic } from './haptics';
import * as notif from './notifications';

const STORAGE_KEY = 'hydrate_cosmic_v1';

// ---------- date helpers (ported) ----------
export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const todayStr = () => dateKey(new Date());
export const getPastDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return dateKey(d);
};
export const friendlyDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

function defaultState() {
  return {
    name: 'Ankita',
    goal: 2000,
    remindersOn: false,
    interval: 120,
    days: {},
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    vault: [],
    lastNoteIndex: {},
    unlockedAch: [],
    confettiShown: false,
    goalHitTimes: [],
    hearts: 0,
    heartsEarnedDates: {},
    inventory: [],
    awaiting: [],
    memories: [],
    goldenTickets: 0,
    goldenTicketMode: false,
    doubleRewardsUntil: null,
    lastDailyGiftDate: null,
    lastPerfectWeekAward: null,
    mysteryItems: {},
  };
}

// Apply the same migrations the original ran on load.
function migrate(state) {
  if (state.longestStreak === undefined) state.longestStreak = state.streak || 0;
  if (state.lastCompletedDate === undefined) state.lastCompletedDate = state.lastStreakDate || null;
  if (state.lastNoteIndex === undefined) state.lastNoteIndex = {};
  if (state.unlockedAch === undefined) state.unlockedAch = [];
  if (state.confettiShown === undefined) state.confettiShown = false;
  if (state.goalHitTimes === undefined) state.goalHitTimes = [];
  if (state.hearts === undefined) state.hearts = 0;
  if (state.heartsEarnedDates === undefined) state.heartsEarnedDates = {};
  if (!Array.isArray(state.inventory)) {
    const old = state.inventory || {};
    state.inventory = [];
    const allItems = [...(SHOP_ITEMS.small || []), ...(SHOP_ITEMS.big || [])];
    Object.keys(old).forEach((id) => {
      const meta = allItems.find((i) => i.id === id) || (state.mysteryItems || {})[id] || { icon: '🎁', title: id };
      for (let n = 0; n < (old[id] || 0); n++) {
        state.inventory.push({ uid: Date.now() + Math.random(), id, icon: meta.icon, title: meta.title, purchaseDate: todayStr() });
      }
    });
  }
  if (!Array.isArray(state.awaiting)) state.awaiting = [];
  if (!Array.isArray(state.memories)) state.memories = [];
  if (state.lastDailyGiftDate === undefined) state.lastDailyGiftDate = null;
  if (state.goldenTickets === undefined) state.goldenTickets = 0;
  if (state.goldenTicketMode === undefined) state.goldenTicketMode = false;
  if (state.doubleRewardsUntil === undefined) state.doubleRewardsUntil = null;
  if (state.lastPerfectWeekAward === undefined) state.lastPerfectWeekAward = null;
  if (state.mysteryItems === undefined) state.mysteryItems = {};
  Object.values(state.days || {}).forEach((d) => { if (!d.actions) d.actions = []; });
  return state;
}

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

export function StoreProvider({ children }) {
  const stateRef = useRef(defaultState());
  const [ready, setReady] = useState(false);
  const [version, bump] = useReducer((x) => x + 1, 0);

  // ---- ephemeral UI state (overlays / toasts) ----
  const [confirm, setConfirm] = useState(null); // {message, onConfirm}
  const [reward, setReward] = useState(null); // {milestone, note}
  const [toasts, setToasts] = useState([]); // [{id, amount, label}]
  const [invToast, setInvToast] = useState(null); // {icon, title, key}
  const [memoryToast, setMemoryToast] = useState(null); // {title, key}
  const [ticketPopup, setTicketPopup] = useState(false);
  const [redeem, setRedeem] = useState(null); // {item}
  const [mysteryReveal, setMysteryReveal] = useState(null); // {icon, title, desc}
  const [confettiKey, setConfettiKey] = useState(0);
  const [vaultBadge, setVaultBadge] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopPanel, setShopPanel] = useState('shop'); // 'shop' | 'inventory' | 'memories'
  const navRef = useRef(() => {}); // set by Root: goToScreen

  const s = stateRef.current;

  // ---- persistence ----
  const persist = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current)).catch(() => {});
  }, []);
  const saveRender = useCallback(() => { persist(); bump(); }, [persist]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) stateRef.current = JSON.parse(raw);
      } catch (e) {}
      migrate(stateRef.current);
      setReady(true);
      bump();
    })();
  }, []);

  // ---- toast helpers ----
  const toastId = useRef(0);
  const showHeartsToast = useCallback((amount, label) => {
    const id = ++toastId.current;
    const clean = String(label).replace(/^\+\d+ ❤️ /, '');
    setToasts((t) => [...t, { id, amount, label: clean }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  const showInvToast = useCallback((icon, title) => {
    setInvToast({ icon, title, key: Date.now() });
    setTimeout(() => setInvToast(null), 2800);
  }, []);
  const showMemoryToast = useCallback((title) => {
    setMemoryToast({ title, key: Date.now() });
    setTimeout(() => setMemoryToast(null), 3000);
  }, []);
  const fireConfetti = useCallback(() => setConfettiKey((k) => k + 1), []);

  const showConfirm = useCallback((message, onConfirm) => setConfirm({ message, onConfirm }), []);

  // ---------- read helpers ----------
  const readToday = () => s.days[todayStr()] || { amount: 0, milestones: [], actions: [] };
  const ensureToday = () => {
    const k = todayStr();
    if (!s.days[k]) s.days[k] = { amount: 0, milestones: [], actions: [] };
    if (!s.days[k].actions) s.days[k].actions = [];
    return s.days[k];
  };
  const wasGoalHit = (dateStr) => {
    const d = s.days[dateStr];
    return !!(d && d.amount >= s.goal);
  };

  // Minimal snapshot the notification service plans from (see src/notifications).
  const notifSnapshot = () => {
    const t = todayStr();
    const d = s.days[t];
    return {
      remindersOn: s.remindersOn,
      interval: s.interval,
      goalDone: !!(d && d.amount >= s.goal),
      streak: s.streak,
      lastCompletedDate: s.lastCompletedDate,
      giftClaimedToday: s.lastDailyGiftDate === t,
      name: s.name,
    };
  };

  function greetingText() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning, my baby 💜';
    if (h >= 12 && h < 17) return 'Good afternoon, my baby 💜';
    if (h >= 17 && h < 21) return 'Good evening, my baby 💜';
    return 'Still up, my baby? 💜';
  }

  // ---------- hearts / milestones ----------
  function todayHeartLog() {
    const t = todayStr();
    if (!s.heartsEarnedDates[t]) s.heartsEarnedDates[t] = { milestones: [], dailyBonus: false, streak7: false };
    return s.heartsEarnedDates[t];
  }
  function earnHearts(amount, toastLabel) {
    const doubled = s.doubleRewardsUntil && new Date(todayStr() + 'T00:00:00') <= new Date(s.doubleRewardsUntil + 'T00:00:00');
    const actual = doubled && amount > 0 ? amount * 2 : amount;
    s.hearts += actual;
    if (toastLabel) showHeartsToast(actual, toastLabel + (doubled && amount > 0 ? ' (×2!)' : ''));
  }
  function awardMilestoneHearts(milestone) {
    const log = todayHeartLog();
    if (log.milestones.includes(milestone)) return;
    log.milestones.push(milestone);
    earnHearts(MILESTONE_HEART_VALUES[milestone], `+${MILESTONE_HEART_VALUES[milestone]} ❤️ for reaching ${milestone}%`);
  }
  function pickNote(milestone) {
    const pool = REWARD_MESSAGES[milestone] || ["You're doing beautifully."];
    if (pool.length === 1) return { note: pool[0], idx: 0 };
    const lastIdx = s.lastNoteIndex[milestone];
    let idx;
    do { idx = Math.floor(Math.random() * pool.length); } while (idx === lastIdx);
    return { note: pool[idx], idx };
  }
  function showReward(milestone, note) {
    setReward({ milestone, note });
    setVaultBadge(true);
    haptic(milestone === 100 ? 'success' : 'light');
  }
  function checkMilestones(prevAmount, newAmount) {
    const d = ensureToday();
    [25, 50, 75, 100].forEach((m) => {
      const threshold = s.goal * (m / 100);
      if (newAmount >= threshold && prevAmount < threshold && !d.milestones.includes(m)) {
        d.milestones.push(m);
        const { note, idx } = pickNote(m);
        s.lastNoteIndex[m] = idx;
        s.vault.unshift({ date: todayStr(), milestone: m, note });
        awardMilestoneHearts(m);
        showReward(m, note);
        // Push only fires when the app is backgrounded (gated inside).
        notif.maybeNotifyMilestone(m, notifSnapshot());
      }
    });
  }

  function maybeFireConfetti() {
    if (s.confettiShown === todayStr()) return;
    s.confettiShown = todayStr();
    fireConfetti();
  }

  function updateStreak() {
    const t = todayStr();
    if (s.lastCompletedDate === t) return;
    const yesterday = getPastDateStr(1);
    if (s.lastCompletedDate === yesterday) s.streak += 1;
    else s.streak = 1;
    s.lastCompletedDate = t;
    if (s.streak > s.longestStreak) s.longestStreak = s.streak;

    const log = todayHeartLog();
    if (!log.dailyBonus) {
      log.dailyBonus = true;
      earnHearts(DAILY_COMPLETION_BONUS, `+${DAILY_COMPLETION_BONUS} ❤️ for finishing today's goal`);
    }
    if (s.streak >= 7 && s.streak % 7 === 0 && !log.streak7) {
      log.streak7 = true;
      earnHearts(STREAK7_BONUS, `+${STREAK7_BONUS} ❤️ for a 7-day streak`);
    }
    checkPerfectWeekBonus();
  }
  function checkPerfectWeekBonus() {
    let allHit = true;
    for (let i = 0; i < 7; i++) { if (!wasGoalHit(getPastDateStr(i))) { allHit = false; break; } }
    if (!allHit) return;
    const windowKey = getPastDateStr(6);
    if (s.lastPerfectWeekAward === windowKey) return;
    s.lastPerfectWeekAward = windowKey;
    earnHearts(PERFECT_WEEK_BONUS, `+${PERFECT_WEEK_BONUS} ❤️ for a perfect week`);
  }

  // ---------- actions ----------
  function addWater(amount) {
    const d = ensureToday();
    const prev = d.amount;
    d.amount += amount;
    d.actions.push(amount);
    checkMilestones(prev, d.amount);
    if (d.amount >= s.goal && prev < s.goal) {
      updateStreak();
      s.goalHitTimes.push(new Date().getHours());
      maybeFireConfetti();
    }
    haptic('light');
    saveRender();
    notif.onGoalProgress(notifSnapshot()); // stop/adjust reminders as goal fills
  }
  function undo() {
    const d = ensureToday();
    if (!d.actions || d.actions.length === 0) return;
    const last = d.actions.pop();
    d.amount = Math.max(0, d.amount - last);
    const t = todayStr();
    const droppedMilestones = d.milestones.filter((m) => d.amount < s.goal * (m / 100));
    if (droppedMilestones.length) {
      s.vault = s.vault.filter((entry) => !(entry.date === t && droppedMilestones.includes(entry.milestone)));
    }
    d.milestones = d.milestones.filter((m) => d.amount >= s.goal * (m / 100));
    saveRender();
    notif.onGoalProgress(notifSnapshot()); // goal may have re-opened → reschedule
  }
  function resetToday() {
    showConfirm("Reset today's water?", () => {
      const t = todayStr();
      s.vault = s.vault.filter((entry) => entry.date !== t);
      s.days[t] = { amount: 0, milestones: [], actions: [] };
      saveRender();
    });
  }

  // ---------- settings ----------
  function setName(name) { s.name = name; saveRender(); }
  function setGoal(goal) { s.goal = goal; saveRender(); notif.syncNow(notifSnapshot()); }
  async function toggleReminders() {
    if (!s.remindersOn) {
      // Turning ON for the first time: notifications need OS permission.
      const status = await notif.ensurePermission();
      if (status !== 'granted') {
        showHeartsToast(0, status === 'blocked'
          ? 'Notifications are blocked — enable LoveSips in your phone Settings 💜'
          : 'No reminders then! Flip the toggle anytime you change your mind 💜');
        saveRender(); // leave the toggle off
        return;
      }
    }
    s.remindersOn = !s.remindersOn;
    saveRender();
    notif.onToggle(notifSnapshot());
  }
  function setInterval_(v) { s.interval = v; saveRender(); notif.onIntervalChange(notifSnapshot()); }
  function resetAll() {
    showConfirm('This clears everything — her name, goal, streak, stars and history. Sure?', () => {
      stateRef.current = defaultState();
      persist();
      bump();
      notif.syncNow(notifSnapshot()); // remindersOn is now false → cancels all
    });
  }

  // ---------- achievements ----------
  function computeAchievements() {
    const dayKeys = Object.keys(s.days);
    const allAmounts = dayKeys.map((k) => s.days[k].amount);
    const totalLogged = allAmounts.some((a) => a > 0);
    const supernovaEarned = allAmounts.some((amt) => amt >= s.goal + 500);

    let doubleVictory = false;
    for (const k of dayKeys) {
      if (wasGoalHit(k)) {
        const d = new Date(k + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        const nextKey = dateKey(d);
        if (wasGoalHit(nextKey)) { doubleVictory = true; break; }
      }
    }

    let babygirlEarned = false;
    const oldestKey = dayKeys.length ? dayKeys.slice().sort()[0] : todayStr();
    const daysSinceOldest = Math.max(7, Math.ceil((new Date(todayStr()) - new Date(oldestKey)) / 86400000) + 1);
    for (let start = 0; start <= daysSinceOldest; start++) {
      let hits = 0;
      for (let i = 0; i < 7; i++) { if (wasGoalHit(getPastDateStr(start + i))) hits++; }
      if (hits >= 5) { babygirlEarned = true; break; }
    }

    let queenOfMyHeart = false;
    for (let start = 0; start <= daysSinceOldest; start++) {
      let hits = 0;
      for (let i = 0; i < 7; i++) { if (wasGoalHit(getPastDateStr(start + i))) hits++; }
      if (hits === 7) { queenOfMyHeart = true; break; }
    }

    let wifeyEarned = false;
    if (dayKeys.length) {
      const monthsTouched = new Set(dayKeys.map((k) => k.slice(0, 7)));
      const todayKey = todayStr();
      const currentMonth = todayKey.slice(0, 7);
      monthsTouched.forEach((ym) => {
        if (wifeyEarned) return;
        const [y, m] = ym.split('-').map(Number);
        const lastDayOfMonth = new Date(y, m, 0).getDate();
        const lastDayToCheck = ym === currentMonth ? Number(todayKey.slice(8, 10)) : lastDayOfMonth;
        if (lastDayToCheck < 7) return;
        let allHit = true;
        for (let day = 1; day <= lastDayToCheck; day++) {
          const key = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          if (!wasGoalHit(key)) { allHit = false; break; }
        }
        if (allHit) wifeyEarned = true;
      });
    }

    const checks = {
      first_sip: totalLogged,
      fresh_start: dayKeys.some((k) => s.days[k].amount >= s.goal * 0.25),
      half_tide: dayKeys.some((k) => s.days[k].amount >= s.goal * 0.5),
      almost_there: dayKeys.some((k) => s.days[k].amount >= s.goal * 0.75),
      perfect_day: dayKeys.some((k) => wasGoalHit(k)),
      double_victory: doubleVictory,
      flame_7: s.longestStreak >= 7,
      moon_walker: s.longestStreak >= 14,
      my_good_girl: s.longestStreak >= 30,
      my_haven: s.longestStreak >= 60,
      hydration_queen: s.longestStreak >= 100,
      supernova: supernovaEarned,
      queen_of_my_heart: queenOfMyHeart,
      wifey: wifeyEarned,
      my_babygirl: babygirlEarned,
    };
    checks.loved_beyond = Object.keys(checks).every((id) => checks[id]);

    const newlyUnlocked = [];
    Object.keys(checks).forEach((id) => {
      if (checks[id] && !s.unlockedAch.includes(id)) {
        s.unlockedAch.push(id);
        newlyUnlocked.push(id);
      }
    });
    if (newlyUnlocked.length) persist();

    return {
      list: ACHIEVEMENTS.map((a) => ({ ...a, earned: s.unlockedAch.includes(a.id) })),
      newlyUnlocked,
    };
  }

  // ---------- shop ----------
  const ALL_SHOP_ITEMS = () => [...SHOP_ITEMS.tiny, ...SHOP_ITEMS.sweet, ...SHOP_ITEMS.premium, ...SHOP_ITEMS.legendary];

  function addToInventory(id, icon, title) {
    s.inventory.push({ uid: Date.now() + Math.random(), id, icon, title, purchaseDate: todayStr() });
  }
  function buyItem(id) {
    const item = ALL_SHOP_ITEMS().find((i) => i.id === id);
    if (!item) return;
    if (s.goldenTicketMode) {
      if (s.goldenTickets <= 0) return;
      s.goldenTickets--;
      s.goldenTicketMode = false;
    } else {
      if (s.hearts < item.cost) return;
      s.hearts -= item.cost;
    }
    addToInventory(item.id, item.icon, item.title);
    showInvToast(item.icon, item.title);
    saveRender();
  }

  function drawMysteryReward() {
    const totalWeight = MYSTERY_POOL.reduce((sum, r) => sum + r.w, 0);
    let roll = Math.random() * totalWeight;
    for (const rw of MYSTERY_POOL) {
      roll -= rw.w;
      if (roll <= 0) return rw;
    }
    return MYSTERY_POOL[0];
  }
  function openMysteryBox() {
    if (s.hearts < MYSTERY_BOX_COST) { showHeartsToast(0, 'Not enough ❤️ for a Mystery Box'); return; }
    s.hearts -= MYSTERY_BOX_COST;
    const rw = drawMysteryReward();
    let reveal;
    if (rw.type === 'hearts') {
      const amt = rw.amount;
      const multiplied = s.doubleRewardsUntil && new Date(todayStr()) <= new Date(s.doubleRewardsUntil + 'T00:00:00');
      const earned = multiplied ? amt * 2 : amt;
      s.hearts += earned;
      reveal = { icon: rw.icon, title: rw.title + (multiplied ? ' (×2!)' : ''), desc: `+${earned} ❤️ added to your balance.` };
    } else if (rw.type === 'golden_ticket') {
      s.goldenTickets++;
      reveal = { icon: '🎫', title: 'Golden Ticket!', desc: 'Use it to claim any reward for free. Jackpot! 💛' };
    } else if (rw.type === 'special' && rw.id === 'double_rewards') {
      const d = new Date(); d.setDate(d.getDate() + 3);
      s.doubleRewardsUntil = dateKey(d);
      reveal = { icon: rw.icon, title: rw.title, desc: `Every heart earned doubles for the next 3 days! Active until ${friendlyDate(s.doubleRewardsUntil)}.` };
    } else {
      const slug = rw.id || 'mystery_' + rw.title.toLowerCase().replace(/\s+/g, '_');
      addToInventory(slug, rw.icon, rw.title);
      reveal = { icon: rw.icon, title: rw.title, desc: rw.desc + ' — Added to your inventory.' };
    }
    setMysteryReveal(reveal);
    saveRender();
  }

  function claimDailyGift() {
    if (s.lastDailyGiftDate === todayStr()) return;
    s.lastDailyGiftDate = todayStr();
    s.hearts += DAILY_GIFT_AMOUNT;
    showHeartsToast(DAILY_GIFT_AMOUNT, 'Daily Love Gift');
    saveRender();
    notif.onGiftClaimed(notifSnapshot()); // cancels today's 9:30 gift reminder
  }

  // ---- golden ticket ----
  function openTicketPopup() {
    if (s.goldenTickets <= 0) { showHeartsToast(0, 'No Golden Tickets yet — try the Mystery Box!'); return; }
    setTicketPopup(true);
  }
  function activateGoldenTicket() {
    if (s.goldenTickets <= 0) return;
    s.goldenTicketMode = true;
    setTicketPopup(false);
    showHeartsToast(0, '🎫 Golden Ticket active — pick any reward!');
    saveRender();
  }
  function deactivateGoldenTicket() { s.goldenTicketMode = false; saveRender(); }

  // ---- redeem flow ----
  function openRedeem(item) { setRedeem({ item }); }
  function confirmRedeemShare() {
    const r = redeem;
    if (!r) return;
    const item = r.item;
    setRedeem(null);
    s.inventory = s.inventory.filter((i) => i.uid !== item.uid);
    s.awaiting.push({ ...item, redeemDate: todayStr() });
    saveRender();
    return item; // Root handles Share()
  }
  function markReceived(uid) {
    const idx = s.awaiting.findIndex((i) => String(i.uid) === String(uid));
    if (idx === -1) return;
    const item = s.awaiting.splice(idx, 1)[0];
    s.memories.unshift({ ...item, receivedDate: todayStr() });
    showMemoryToast(item.title);
    saveRender();
  }

  const value = {
    ready, version, s,
    // reads
    readToday, wasGoalHit, greetingText, computeAchievements, friendlyDate,
    // actions
    addWater, undo, resetToday, setName, setGoal, toggleReminders, setInterval_, resetAll,
    buyItem, openMysteryBox, claimDailyGift, openTicketPopup, activateGoldenTicket, deactivateGoldenTicket,
    openRedeem, confirmRedeemShare, markReceived,
    // ui state
    confirm, setConfirm, reward, setReward, toasts, invToast, memoryToast,
    ticketPopup, setTicketPopup, redeem, setRedeem, mysteryReveal, setMysteryReveal,
    confettiKey, vaultBadge, setVaultBadge,
    shopOpen, setShopOpen, shopPanel, setShopPanel,
    showHeartsToast, showConfirm,
    navRef,
    // notifications (App.js lifecycle wiring)
    getNotifSnapshot: notifSnapshot,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
