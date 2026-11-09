// Reads and writes the data a backup covers: entries, habits, exports.
// Uses openDb() from store.js read-only; it never touches other stores (such as retained_stats).

import { openDb } from './store.js';

function finished(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted.'));
  });
}

/** Everything a backup covers: { entries, habits, exports }. */
export async function loadForBackup() {
  const db = await openDb();
  const tx = db.transaction(['entries', 'habits', 'exports'], 'readonly');
  const entries = tx.objectStore('entries').getAll();
  const habits = tx.objectStore('habits').getAll();
  const exports = tx.objectStore('exports').getAll();
  await finished(tx);
  return { entries: entries.result, habits: habits.result, exports: exports.result };
}

/** Write merged data in ONE transaction. Puts only, so nothing is deleted. All or nothing. */
export async function applyRestore(merged) {
  const db = await openDb();
  const tx = db.transaction(['entries', 'habits', 'exports'], 'readwrite');
  const entries = tx.objectStore('entries');
  const habits = tx.objectStore('habits');
  const exports = tx.objectStore('exports');
  for (const e of merged.entries) entries.put(e);
  for (const h of merged.habits) habits.put(h);
  for (const x of merged.exports) exports.put(x);
  await finished(tx);
}
