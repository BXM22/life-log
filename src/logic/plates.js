// Plate calculator (F38, redone F56). Pure: plates per side for a working weight, using only the plates you own.
// Settings live under their own localStorage key, passed in as `storage` so tests can stub it.
//
// Settings shape: { bar: number (lb), owned: { [plate lb]: pairs } } where a pair is one plate on each side.
// An older save had `owned` as a list of plate sizes; it is read as LEGACY_PAIRS of each.

export const PLATES_KEY = 'lifelog.plates';
export const PLATE_CHOICES = [55, 45, 35, 25, 10, 5, 2.5, 1.25];
export const MAX_PAIRS = 12;
const LEGACY_PAIRS = 6;

const ownedOf = (counts) => Object.fromEntries(PLATE_CHOICES.map((p) => [p, counts[p] ?? 0]));
export const DEFAULT_PLATES = { bar: 45, owned: ownedOf({ 45: 4, 35: 1, 25: 1, 10: 2, 5: 1, 2.5: 1 }) };

const pairs = (v) => { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.min(MAX_PAIRS, Math.max(0, n)) : 0; };

export function normalizePlates(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const bar = Number(s.bar);
  let owned = null;
  if (Array.isArray(s.owned)) owned = ownedOf(Object.fromEntries(s.owned.map(Number).filter((p) => PLATE_CHOICES.includes(p)).map((p) => [p, LEGACY_PAIRS])));
  else if (s.owned && typeof s.owned === 'object') owned = ownedOf(Object.fromEntries(PLATE_CHOICES.map((p) => [p, pairs(s.owned[p])])));
  if (!owned || !Object.values(owned).some((n) => n > 0)) owned = { ...DEFAULT_PLATES.owned };
  return {
    bar: s.bar !== '' && s.bar != null && Number.isFinite(bar) && bar >= 0 && bar <= 100 ? Math.round(bar * 10) / 10 : DEFAULT_PLATES.bar,
    owned,
  };
}

export function loadPlates(storage) {
  try { return normalizePlates(JSON.parse(storage.getItem(PLATES_KEY) || 'null')); } catch { return normalizePlates(null); }
}

/** Returns true if saved, false if storage refused. */
export function savePlates(storage, settings) {
  try { storage.setItem(PLATES_KEY, JSON.stringify(normalizePlates(settings))); return true; } catch { return false; }
}

const UNIT = 4; // work in quarter pounds so 1.25 and 2.5 stay whole numbers
const round2 = (n) => Math.round(n * 100) / 100;

/** Every per-side load the owned plates can make, as Map(quarter-lb -> { [plate]: count }) using the fewest plates. */
function reachable(owned, maxUnits) {
  let reps = new Map([[0, { n: 0, counts: {} }]]);
  for (const plate of [...PLATE_CHOICES].sort((a, b) => b - a)) {
    const have = pairs(owned[plate]);
    if (!have) continue;
    const u = Math.round(plate * UNIT);
    const next = new Map(reps);
    for (const [sum, r] of reps) {
      for (let k = 1; k <= have && sum + k * u <= maxUnits; k++) {
        const at = sum + k * u;
        const cand = { n: r.n + k, counts: { ...r.counts, [plate]: k } };
        if (!next.has(at) || next.get(at).n > cand.n) next.set(at, cand);
      }
    }
    reps = next;
  }
  return reps;
}

const listOf = (counts) => Object.entries(counts).map(([p, count]) => ({ plate: Number(p), count })).sort((a, b) => b.plate - a.plate);

/**
 * Plates for one side to reach `target` lb, using only the pairs you own.
 * Returns { perSide: [{ plate, count }], loaded, short, up } or { error }.
 *   loaded  the heaviest total at or under the target that you can load; short = target - loaded (0 when exact)
 *   up      when the target cannot be loaded exactly: the next total above it as { total, perSide }, or null
 */
export function platesFor(target, { bar, owned }) {
  const t = Number(target);
  if (!(t > 0) || t > 1500) return { error: 'Enter a working weight.' };
  if (t < bar) return { error: `The bar alone is ${bar} lb.` };
  const need = Math.round(((t - bar) / 2) * UNIT);
  const reps = reachable(owned, need + 55 * UNIT);
  const sums = [...reps.keys()].sort((a, b) => a - b);
  const exact = reps.get(need);
  const total = (units) => round2(bar + (2 * units) / UNIT);
  if (exact) return { perSide: listOf(exact.counts), loaded: total(need), short: round2(Math.max(0, t - total(need))), up: null };
  const down = [...sums].reverse().find((s) => s < need);
  const above = sums.find((s) => s > need);
  return {
    perSide: listOf(reps.get(down).counts),
    loaded: total(down),
    short: round2(t - total(down)),
    up: above == null ? null : { total: total(above), perSide: listOf(reps.get(above).counts) },
  };
}
