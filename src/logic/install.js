// Add to Home Screen guidance. Pure: the caller passes what the browser reports.
//
// kind: 'installed' (already a home-screen app) | 'prompt' (browser can show its install dialog)
//     | 'ios' (Safari has no dialog; the user must use the Share menu) | 'other' (nothing to offer)

export function installKind({ userAgent = '', standalone = false, canPrompt = false, maxTouchPoints = 0 }) {
  if (standalone) return 'installed';
  if (canPrompt) return 'prompt';
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return ios ? 'ios' : 'other';
}

const MESSAGES = {
  installed: 'Installed on your Home Screen.',
  prompt: 'Add this app to your Home Screen so it opens like an app and keeps your data safer.',
  ios: 'To install: tap the Share button in Safari, then Add to Home Screen. Home Screen apps keep your data safer.',
  other: '',
};

export const installMessage = (kind) => MESSAGES[kind] ?? '';
