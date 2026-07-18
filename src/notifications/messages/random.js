// Generic fallback pool — used if a category pool is ever empty or missing,
// so a scheduled notification never goes out blank.
// Tokens: {name}
export default [
  { title: 'LoveSips 💜', body: 'A little water and a little love, {name} 💧' },
  { title: 'Thinking of you 💭', body: 'Take a sip and a deep breath. You’re doing fine 💜' },
  { title: 'Hey {name} 💧', body: 'This is your sign to drink some water ✨' },
  { title: 'Quick reminder 💙', body: 'Water first. Everything else can wait a minute.' },
  { title: 'From him, with love 💌', body: 'Stay hydrated, stay lovely, {name} 💜' },
  { title: 'Gentle nudge 💧', body: 'Your body does so much for you — give it a glass back 💙' },
];
