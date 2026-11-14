// Life Log service worker: cache-first app shell so the app opens offline.
// Bump CACHE on every deploy that changes a shell file, so old files are dropped.
const CACHE = 'life-log-shell-v26';
const FONT_CACHE = 'life-log-fonts-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'src/styles/main.css',
  'src/ui/app.js',
  'src/db/store.js',
  'src/dropbox/dropbox.js',
  'src/logic/dates.js',
  'src/logic/exportBuilder.js',
  'src/logic/habits.js',
  'src/logic/retainedStats.js',
  'src/logic/records.js',
  'src/logic/backup.js',
  'src/db/backupStore.js',
  'src/ui/backupPanel.js',
  'src/logic/wipeEligibility.js',
  'src/logic/entries.js',
  'src/logic/template.js',
  'src/logic/workout.js',
  'src/logic/demo.js',
  'src/ui/workoutView.js',
  'src/ui/workoutActions.js',
  'src/ui/exportWipeView.js',
  'src/logic/settings.js',
  'src/logic/install.js',
  'src/ui/format.js',
  'src/ui/icons.js',
  'src/logic/templateEdit.js',
  'src/ui/templateView.js',
  'src/ui/templateActions.js',
  'src/ui/todayView.js',
  'src/logic/rest.js',
  'src/ui/restView.js',
  'src/ui/restActions.js',
  'src/ui/historyView.js',
  'src/logic/workoutHistory.js',
  'src/ui/workoutHistoryView.js',
  'src/ui/mealView.js',
  'src/ui/recordsView.js',
  'src/ui/mealActions.js',
  'src/ui/notesView.js',
  'src/ui/notesActions.js',
  'src/logic/notesExport.js',
  'src/ui/settingsView.js',
  'src/logic/exportReminder.js',
  'src/logic/practiceTimer.js',
  'src/logic/streaks.js',
  'src/logic/study.js',
  'src/logic/weekView.js',
  'src/logic/workoutExtras.js',
  'src/ui/practiceActions.js',
  'src/ui/practiceView.js',
  'src/ui/studyActions.js',
  'src/ui/studyView.js',
  'src/ui/weekPanel.js',
  'src/ui/workoutExtrasActions.js',
  'src/ui/workoutExtrasView.js',
  'icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL.map((p) => new Request(p, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never intercept Dropbox (API, content, OAuth) traffic.
  if (/(^|\.)dropbox(api)?\.com$/.test(url.hostname)) return;

  // Fonts: serve cached copy, refresh in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const fresh = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; });
        return hit || fresh;
      }).catch(() => fetch(req)),
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // OAuth redirect back from Dropbox carries ?code=; always go to the network for it.
  if (url.searchParams.has('code') || url.searchParams.has('error')) return;

  // App shell: cache first. Navigations ignore the query string so "/?x" still opens offline.
  event.respondWith(
    caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error()));
    }),
  );
});
