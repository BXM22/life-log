// Resolve Appearance (system | light | dark) to an effective light/dark theme and apply it on the document.
// Pure helpers take prefersDark / a document stub so tests do not need a browser.

export const THEME_COLORS = { light: '#FFFFFF', dark: '#141210' };

/** @returns {'light' | 'dark'} */
export function resolveTheme(theme, prefersDark) {
  if (theme === 'light' || theme === 'dark') return theme;
  return prefersDark ? 'dark' : 'light';
}

function prefersDarkScheme(win = typeof window !== 'undefined' ? window : null) {
  try { return !!(win && win.matchMedia && win.matchMedia('(prefers-color-scheme: dark)').matches); } catch { return false; }
}

/** Sets data-theme, color-scheme, theme-color meta, and iOS status-bar style. */
export function applyTheme(theme, doc = typeof document !== 'undefined' ? document : null, win = typeof window !== 'undefined' ? window : null) {
  if (!doc || !doc.documentElement) return 'light';
  const effective = resolveTheme(theme, prefersDarkScheme(win));
  doc.documentElement.dataset.theme = effective;
  doc.documentElement.style.colorScheme = effective;
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[effective]);
  const bar = doc.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (bar) bar.setAttribute('content', effective === 'dark' ? 'black-translucent' : 'default');
  return effective;
}

/** Attach a prefers-color-scheme listener only when theme is system. Returns an unsubscribe fn. */
export function watchSystemTheme(theme, onChange, win = typeof window !== 'undefined' ? window : null) {
  if (theme !== 'system' || !win || !win.matchMedia) return () => {};
  let mql;
  try { mql = win.matchMedia('(prefers-color-scheme: dark)'); } catch { return () => {}; }
  const handler = () => { onChange(); };
  if (typeof mql.addEventListener === 'function') mql.addEventListener('change', handler);
  else if (typeof mql.addListener === 'function') mql.addListener(handler);
  return () => {
    if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', handler);
    else if (typeof mql.removeListener === 'function') mql.removeListener(handler);
  };
}
