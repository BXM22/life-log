// Plate calculator (F38). Pure: plates per side for a working weight. Settings live under their own
// localStorage key, passed in as `storage` so tests can stub it.

export const PLATES_KEY = 'lifelog.plates';
export const PLATE_CHOICES = [55, 45, 35, 25, 10, 5, 2.5, 1.25];
export const DEFAULT_PLATES = { bar: 45, owned: [45, 35, 25, 10, 5, 2.5] };

export function normalizePlates(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const bar = Number(s.bar);
  const owned = Array.isArray(s.owned) ? PLATE_CHOICES.filter((p) => s.owned.map(Number).includes(p)) : null;
  return {
    bar: s.bar !== '' && s.bar != null && Number.isFinite(bar) && bar >= 0 && bar <= 100 ? Math.round(bar * 10) / 10 : DEFAULT_PLATES.bar,
    owned: owned && owned.length ? owned : [...DEFAULT_PLATES.owned],
  };
}

export function loadPlates(storage) {
  try { return normalizePlates(JSON.parse(storage.getItem(PLATES_KEY) || 'null')); } catch { return normalizePlates(null); }
}

/** Returns true if saved, false if storage refused. */
export function savePlates(storage, settings) {
  try { storage.setItem(PLATES_KEY, JSON.stringify(normalizePlates(settings))); return true; } catch { return false; }
}

/**
 * Plates for one side to reach `target` lb. Greedy from the heaviest plate owned.
 * Returns { perSide: [{ plate, count }], loaded, short } where loaded is the total reachable weight
 * and short is how far under the target that is (0 when exact). Or { error }.
 */
export function platesFor(target, { bar, owned }) {
  const t = Number(target);
  if (!(t > 0) || t > 1500) return { error: 'Enter a working weight.' };
  if (t < bar) return { error: `The bar alone is ${bar} lb.` };
  let left = Math.round(((t - bar) / 2) * 100) / 100;
  const perSide = [];
  for (const plate of [...owned].sort((a, b) => b - a)) {
    const count = Math.floor(left / plate + 1e-9);
    if (count > 0) { perSide.push({ plate, count }); left = Math.round((left - count * plate) * 100) / 100; }
  }
  return { perSide, loaded: Math.round((t - left * 2) * 100) / 100, short: Math.round(left * 2 * 100) / 100 };
}
