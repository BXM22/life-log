// Life Log service worker: cache-first app shell so the app opens offline.
// Shell files are fetched network-first (cache is the offline fallback), so deploys
// show up on the next open without re-adding the bookmark. Bump CACHE only to drop stale entries.
const CACHE = 'life-log-shell-v41';
const FONT_CACHE = 'life-log-fonts-v1';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'src/styles/main.css',
  'src/styles/today.css',
  'src/styles/forma.css',
  'src/styles/workout-today.css',
  'src/styles/workout-sheets.css',
  'src/styles/workout-pages.css',
  'src/logic/quickAdd.js',
  'src/logic/studySubjects.js',
  'src/ui/quickAddView.js',
  'src/ui/todayActions.js',
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
  'src/ui/syncView.js',
  'src/ui/syncActions.js',
  'src/ui/autoSync.js',
  'src/logic/autoSync.js',
  'src/ui/syncChip.js',
  'src/logic/syncStatus.js',
  'src/ui/manageHabitsView.js',
  'src/ui/manageHabitsActions.js',
  'src/logic/weeklyReview.js',
  'src/logic/backupNudge.js',
  'src/logic/wipeEligibility.js',
  'src/logic/entries.js',
  'src/logic/template.js',
  'src/logic/workout.js',
  'src/logic/demo.js',
  'src/ui/workoutView.js',
  'src/ui/workoutToday.js',
  'src/ui/workoutExercise.js',
  'src/ui/workoutNavActions.js',
  'src/ui/workoutSheets.js',
  'src/ui/workoutSheetActions.js',
  'src/ui/workoutActivities.js',
  'src/ui/activityActions.js',
  'src/ui/libraryActions.js',
  'src/ui/workoutActions.js',
  'src/ui/exportWipeView.js',
  'src/logic/settings.js',
  'src/logic/updates.js',
  'src/logic/extras.js',
  'src/logic/workoutPlan.js',
  'src/logic/activities.js',
  'src/logic/library.js',
  'src/logic/install.js',
  'src/ui/format.js',
  'src/ui/historyWindows.js',
  'src/ui/icons.js',
  'src/logic/templateEdit.js',
  'src/ui/templateView.js',
  'src/ui/templateActions.js',
  'src/logic/templateTags.js',
  'src/ui/templateTagsView.js',
  'src/ui/templateTagsActions.js',
  'src/logic/plates.js',
  'src/ui/platesView.js',
  'src/ui/platesActions.js',
  'src/ui/todayView.js',
  'src/logic/rest.js',
  'src/ui/restView.js',
  'src/ui/restActions.js',
  'src/ui/historyView.js',
  'src/logic/progress.js',
  'src/ui/progressView.js',
  'src/logic/workoutHistory.js',
  'src/ui/workoutHistoryView.js',
  'src/ui/mealView.js',
  'src/ui/logWindow.js',
  'src/ui/notesWindow.js',
  'src/ui/learnView.js',
  'src/ui/learnActions.js',
  'src/logic/areas.js',
  'src/logic/logWin.js',
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
  'src/logic/todayWin.js',
  'src/ui/todayWindows.js',
  'src/ui/todayWinActions.js',
  'src/logic/weekView.js',
  'src/logic/workoutExtras.js',
  'src/ui/practiceActions.js',
  'src/ui/practiceView.js',
  'src/ui/studyActions.js',
  'src/ui/studyView.js',
  'src/ui/weekPanel.js',
  'src/ui/workoutExtrasActions.js',
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

  // App shell: network first (fresh when online), cache fallback (offline / slow network).
  // Navigations ignore the query string so "/?x" still opens offline.
  const ignoreSearch = req.mode === 'navigate';
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
      ]);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(req, { ignoreSearch });
      if (hit) return hit;
      return req.mode === 'navigate' ? (await cache.match('./')) || Response.error() : Response.error();
    }
  })());
});
