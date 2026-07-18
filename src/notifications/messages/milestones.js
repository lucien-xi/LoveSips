// Milestone alerts (25/50/75/100%) — delivered immediately, and ONLY when the
// app is in the background (in the foreground the reward modal handles it).
// Tokens: {name} {pct}
export default [
  { title: '{pct}% done 💜', body: 'Look at you go, {name}! A new star just lit up in your vault ✨' },
  { title: 'Milestone reached ✨', body: '{pct}% of today’s goal — he left you a note in the app 💌' },
  { title: 'That’s {pct}%! 💧', body: 'Proud of you, {name}. Come see what unlocked 💜' },
  { title: 'Ding! {pct}% 🔔', body: 'Another milestone down. Your hearts are stacking up, {name} ❤️' },
  { title: '{pct}% and glowing ✨', body: 'Keep sipping, my love — something special is waiting in the app.' },
  { title: 'You did it 💙', body: '{pct}% reached! He’d kiss your forehead right now if he could.' },
];
