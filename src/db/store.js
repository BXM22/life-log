// IndexedDB persistence. Stores: entries (keyPath id) and exports (keyPath filename).
// Every write is one transaction, so a failure leaves the database unchanged.

const DB_NAME = 'life-log';
const VERSION = 3; // v2 added habits, v3 adds retained_stats; existing stores are left untouched
let dbPromise;

export function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        // Create only what is missing, so an upgrade never drops existing data.
        if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('exports')) db.createObjectStore('exports', { keyPath: 'filename' });
        if (!db.objectStoreNames.contains('habits')) db.createObjectStore('habits', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('retained_stats')) db.createObjectStore('retained_stats', { keyPath: 'key' });
      };
      req.onsuccess = () => {
        const db = req.result;
        // If the browser closes this connection (another tab upgrading, storage cleanup), forget it
        // so the next write opens a fresh one instead of failing on a closed database.
        const forget = () => { dbPromise = undefined; };
        db.onversionchange = () => { db.close(); forget(); };
        db.onclose = forget;
        resolve(db);
      };
      req.onerror = () => { dbPromise = undefined; reject(req.error); };
      req.onblocked = () => { dbPromise = undefined; reject(new Error('Database is blocked by another tab.')); };
    });
  }
  return dbPromise;
}

function finished(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted.'));
  });
}

/** Everything saved on this phone: { entries, exports, habits, stats } (stats is null until the first wipe). */
export async function loadAll() {
  const db = await openDb();
  const tx = db.transaction(['entries', 'exports', 'habits', 'retained_stats'], 'readonly');
  const entries = tx.objectStore('entries').getAll();
  const exports = tx.objectStore('exports').getAll();
  const habits = tx.objectStore('habits').getAll();
  const stats = tx.objectStore('retained_stats').get('stats');
  await finished(tx);
  return { entries: entries.result, exports: exports.result, habits: habits.result, stats: stats.result || null };
}

/**
 * Wipe: write the retained stats and delete the entries in ONE transaction.
 * Either both happen or neither does, so facts are never lost without being kept.
 * Only the 'entries' store is deleted from; stats are the only other thing written.
 */
export async function wipeWithStats(ids, stats) {
  const db = await openDb();
  const tx = db.transaction(['entries', 'retained_stats'], 'readwrite');
  tx.objectStore('retained_stats').put(stats);
  const store = tx.objectStore('entries');
  for (const id of ids) store.delete(id);
  await finished(tx);
}

/** Save the habit list entry. */
export async function putHabit(habit) {
  const db = await openDb();
  const tx = db.transaction('habits', 'readwrite');
  tx.objectStore('habits').put(habit);
  await finished(tx);
}

/** Remove a habit from the list. Its past checks stay in entries. */
export async function deleteHabit(id) {
  const db = await openDb();
  const tx = db.transaction('habits', 'readwrite');
  tx.objectStore('habits').delete(id);
  await finished(tx);
}

/** Insert or replace entries in a single transaction. */
export async function putEntries(entries) {
  const db = await openDb();
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  for (const e of entries) store.put(e);
  await finished(tx);
}

/** Delete entries by id in a single transaction. All or nothing. */
export async function deleteEntries(ids) {
  const db = await openDb();
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  for (const id of ids) store.delete(id);
  await finished(tx);
}

/**
 * Mark an export confirmed: save the stamped entries and the export record together,
 * so an entry is never marked exported without its export being recorded.
 */
export async function confirmExportRecord(stampedEntries, record) {
  const db = await openDb();
  const tx = db.transaction(['entries', 'exports'], 'readwrite');
  const entries = tx.objectStore('entries');
  for (const e of stampedEntries) entries.put(e);
  tx.objectStore('exports').put(record);
  await finished(tx);
}
