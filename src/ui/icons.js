// Tab bar icons: one outline set, 24px grid, 2px square strokes, to match the pixel look.
const PATHS = {
  today: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  workout: '<path d="M2 9v6M5 6v12M19 6v12M22 9v6M5 12h14"/>',
  history: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  export: '<path d="M12 17V4M6 10l6-6 6 6M4 21h16"/>',
  settings: '<path d="M4 7h8M16 7h4M4 17h4M12 17h8"/><rect x="12" y="4" width="4" height="6"/><rect x="8" y="14" width="4" height="6"/>',
};

export function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${PATHS[name] || ''}</svg>`;
}
