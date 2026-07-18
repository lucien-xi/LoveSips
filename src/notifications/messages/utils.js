// Message-pool helpers. Pools are arrays of { title, body } objects; bodies may
// contain {name}, {streak} or {pct} tokens filled in at schedule time.

export function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

// Returns { item, index } avoiding `lastIndex` so the same message never plays
// twice in a row. `lastIndex` is persisted per-category by the engine.
export function pickWithoutRepeatingLast(pool, lastIndex) {
  if (!pool || pool.length === 0) return { item: null, index: -1 };
  if (pool.length === 1) return { item: pool[0], index: 0 };
  let index;
  do { index = Math.floor(Math.random() * pool.length); } while (index === lastIndex);
  return { item: pool[index], index };
}

// Fisher–Yates copy, for future "play through the whole pool" strategies.
export function shufflePool(pool) {
  const out = [...pool];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Fills {name}-style tokens. Unknown tokens are left untouched.
export function format(text, vars = {}) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null && vars[k] !== '' ? String(vars[k]) : m === '{name}' ? 'baby' : m));
}
