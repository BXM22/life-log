// Direct Dropbox upload with OAuth PKCE. No backend, no client secret.
// Setup (once): create a Dropbox app with "Full Dropbox" access and the files.content.write
// permission, then add this page's URL as a redirect URI (for example http://localhost:5173/index.html).

const STORE_KEY = 'lifelog.dropbox';
export const DEFAULT_FOLDER = '/myVault/sources/life-log';
const BLOCK = 4 * 1024 * 1024;

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { return {}; }
};
const save = (patch) => {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...load(), ...patch })); } catch { /* storage blocked */ }
};

// Public under PKCE (no client secret), so it is safe to ship. Saves retyping it on every device.
export const DEFAULT_APP_KEY = 'b58aif9n41rzxep';

export const getConfig = () => {
  const saved = load();
  return { folder: DEFAULT_FOLDER, ...saved, appKey: saved.appKey || DEFAULT_APP_KEY };
};
export const isConnected = () => Boolean(load().refresh);
export const disconnect = () => save({ refresh: null, access: null, expires: 0 });

const redirectUri = () => location.origin + location.pathname;

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Dropbox content hash: sha256 of the concatenated sha256 of each 4 MB block. Hex string. */
export async function contentHash(bytes) {
  const hashes = [];
  for (let i = 0; i < Math.max(bytes.length, 1); i += BLOCK) {
    hashes.push(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice(i, i + BLOCK))));
  }
  const joined = new Uint8Array(hashes.length * 32);
  hashes.forEach((h, i) => joined.set(h, i * 32));
  return toHex(await crypto.subtle.digest('SHA-256', joined));
}

/** Leave the page to sign in to Dropbox. Returns after setting location. */
export async function startAuth(appKey) {
  const key = appKey.trim();
  if (!key) throw new Error('Enter your Dropbox app key first.');
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  save({ appKey: key, verifier });
  location.href = 'https://www.dropbox.com/oauth2/authorize?' + new URLSearchParams({
    client_id: key,
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    token_access_type: 'offline',
    redirect_uri: redirectUri(),
  });
}

async function tokenRequest(params) {
  const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(`Dropbox sign-in failed (${res.status}).`);
  return res.json();
}

/** Call on page load. Completes sign-in if Dropbox just redirected back. Returns true if it did. */
export async function finishAuthIfRedirected() {
  const code = new URLSearchParams(location.search).get('code');
  if (!code) return false;
  history.replaceState({}, '', location.pathname);
  const { verifier } = load();
  const { appKey } = getConfig();
  if (!appKey || !verifier) throw new Error('Sign-in was interrupted. Connect again.');
  const j = await tokenRequest({
    code, grant_type: 'authorization_code', client_id: appKey, code_verifier: verifier, redirect_uri: redirectUri(),
  });
  save({ refresh: j.refresh_token, access: j.access_token, expires: Date.now() + j.expires_in * 1000 - 60000, verifier: null });
  return true;
}

async function accessToken() {
  const c = load();
  if (c.access && Date.now() < c.expires) return c.access;
  if (!c.refresh) throw new Error('Not connected to Dropbox.');
  const j = await tokenRequest({ grant_type: 'refresh_token', refresh_token: c.refresh, client_id: getConfig().appKey });
  save({ access: j.access_token, expires: Date.now() + j.expires_in * 1000 - 60000 });
  return j.access_token;
}

/**
 * Upload text as a new file in the vault folder. Never overwrites: if the name exists, Dropbox
 * returns a conflict and this throws. Resolves { path, verified } where verified means Dropbox
 * reports the same byte size and content hash as what we sent.
 */
export async function upload(filename, text, folder = DEFAULT_FOLDER) {
  if (!/^life-log-[\d-]+\.md$/.test(filename)) throw new Error('Unexpected file name.');
  const bytes = new TextEncoder().encode(text);
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path: `${folder}/${filename}`, mode: 'add', autorename: false, mute: true }),
    },
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 409 && body.includes('conflict')) throw new Error(`${filename} already exists in Dropbox. Nothing changed.`);
    throw new Error(`Dropbox upload failed (${res.status}). Nothing changed.`);
  }
  const j = await res.json();
  const verified = j.size === bytes.length && j.content_hash === (await contentHash(bytes));
  return { path: j.path_display, verified };
}
