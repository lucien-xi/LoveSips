import hydration from './hydration';
import morning from './morning';
import milestones from './milestones';
import streak from './streak';
import bedtime from './bedtime';
import gift from './gift';
import loveNotes from './loveNotes';
import { TIERS as COMEBACK_TIERS } from './comeback';
import fallback from './random';

// Category → pool. Add a file + an entry here to introduce a new category.
export const POOLS = {
  hydration,
  morning,
  milestone: milestones,
  streak,
  bedtime,
  gift,
  lovenote: loveNotes,
};

export { COMEBACK_TIERS };

// Resolves the pool for a plan category. Comeback categories are named
// "comeback2" / "comeback5" / "comeback10" and map to warmth tiers.
export function poolFor(category) {
  if (category.startsWith('comeback')) {
    const days = Number(category.slice('comeback'.length));
    const tier = COMEBACK_TIERS.find((t) => t.afterDays === days);
    if (tier && tier.pool.length) return tier.pool;
  }
  const pool = POOLS[category];
  return pool && pool.length ? pool : fallback;
}
