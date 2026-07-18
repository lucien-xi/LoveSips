// Come-back reminders after 2 / 5 / 10 days away — warmer as time passes.
// Exported as tiers; the scheduler picks the pool matching the days-away mark.
// Tokens: {name}
export const TIERS = [
  {
    afterDays: 2,
    pool: [
      { title: 'It’s been a couple of days 💧', body: 'Your glass misses you, {name}. Quick sip check-in? 💜' },
      { title: 'Hey stranger 💜', body: 'LoveSips has been quiet without you. Come say hi to your streak 💧' },
      { title: 'Two days, {name}? 💭', body: 'He noticed. Just saying. Your water goal is waiting 💙' },
      { title: 'Small nudge 💧', body: 'A minute and a glass of water — that’s all it takes to come back ✨' },
    ],
  },
  {
    afterDays: 5,
    pool: [
      { title: 'He misses you here 💜', body: 'Five days without you, {name}. The app feels empty. So does your glass 💧' },
      { title: 'Come back soon? 💌', body: 'Your vault, your stars, your hearts — they’re all keeping your seat warm 💜' },
      { title: '{name}… 🥺', body: 'It’s been a while. One little glass to break the silence? 💧' },
      { title: 'Still here for you 💙', body: 'No guilt, no pressure — just water and love, whenever you’re ready ✨' },
    ],
  },
  {
    afterDays: 10,
    pool: [
      { title: 'He asked about you 💜', body: 'Ten days, {name}. Whatever’s going on, he’s on your side. Always 💌' },
      { title: 'This app runs on you 💧', body: 'No streaks, no numbers today. Just — he loves you. Come back when you can 💜' },
      { title: 'Missing you lots, {name} 💌', body: 'Your little universe here is untouched and waiting. So is he 💙' },
      { title: 'Whenever you’re ready 💜', body: 'One sip. One smile. We’ll take it from there, {name} ✨' },
    ],
  },
];
export default TIERS;
