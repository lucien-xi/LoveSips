# LoveSips

A faithful React Native (Expo SDK 57) port of the original single-file `LoveSips.html`
water-reminder app. UI, colors, animations, and functionality are preserved.

## Run

```bash
cd LoveSipsExpo
npm install          # if node_modules is missing
npx expo start       # then press i (iOS), a (Android), or scan the QR in Expo Go
```

## What was migrated (feature-by-feature)

- **Home** — galaxy water glass (animated SVG fill + wave), streak badge, greeting,
  +100/+250/+500 quick-add, undo/reset, milestone rewards + confetti.
- **Vault** — constellation of unlocked star notes, hearts & golden-ticket balances,
  floating shop button.
- **Orbit** — 7-day bar chart, six stat cards, achievements (with unlock pop animation),
  calendar month view.
- **Settings** — name, daily goal chips, in-app reminder toggle + interval, reset.
- **Love Rewards Shop** — daily gift, weighted mystery box, four reward tiers,
  golden-ticket mode, inventory → awaiting → memories redemption flow, share.
- **State** — every field and rule from the original, persisted via AsyncStorage
  (drop-in for the original `localStorage`), including all migrations.

## Architecture

| Original (HTML/JS)          | Expo port                                   |
|-----------------------------|---------------------------------------------|
| `localStorage`              | `@react-native-async-storage/async-storage` |
| CSS transitions / keyframes | `Animated` (nebula, water, confetti, toasts)|
| inline SVG                  | `react-native-svg`                          |
| CSS gradients               | `expo-linear-gradient` / SVG gradients      |
| `navigator.vibrate`         | `expo-haptics`                              |
| `navigator.share`           | React Native `Share`                        |
| Google Fonts `<link>`       | `@expo-google-fonts/{playfair-display,outfit}` |

`src/store.js` holds all state + logic in a single provider; `src/data.js` holds the
reward messages, shop catalog, mystery pool, and achievements.

## Notes

- In-app reminders trigger a haptic pulse while below goal (the original relied on the
  web `Notification`/vibrate APIs). Swap in `expo-notifications` for OS-level reminders.
- The original `LoveSips.html` project is left completely untouched.
