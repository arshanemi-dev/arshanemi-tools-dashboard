/**
 * Shared by login.html and index.html. Loaded as a plain <script> (no build step).
 * Talks to the arshanemi-admin-pannels API (see ../../.. — app/api/*) for theme,
 * auth, and per-user tools data.
 */

// ---------------------------------------------------------------------------
// CONFIG — swap this for the admin panel's production URL once it's deployed.
// ---------------------------------------------------------------------------
const API_BASE = 'http://localhost:3000';

// ---------------------------------------------------------------------------
// TOKEN STORE (localStorage) — same key names as tools/arshanemi-tools-1's
// lib/tokenStore.js so the two apps can share a login session if ever hosted
// under the same parent domain.
// ---------------------------------------------------------------------------
const AUTH_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  expiresAt: 'token_expires_at',
  user: 'user',
};

function saveAuthTokens({ accessToken, refreshToken, expiresIn = 900, user }) {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(AUTH_KEYS.accessToken, accessToken);
  localStorage.setItem(AUTH_KEYS.refreshToken, refreshToken);
  localStorage.setItem(AUTH_KEYS.expiresAt, String(expiresAt));
  if (user) localStorage.setItem(AUTH_KEYS.user, JSON.stringify(user));
}

function getAccessToken() {
  return localStorage.getItem(AUTH_KEYS.accessToken) || null;
}

function getRefreshToken() {
  return localStorage.getItem(AUTH_KEYS.refreshToken) || null;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEYS.user) || 'null');
  } catch {
    return null;
  }
}

function isTokenExpired() {
  const expiresAt = Number(localStorage.getItem(AUTH_KEYS.expiresAt) || 0);
  return Date.now() > expiresAt - 30_000; // 30s buffer
}

function isLoggedIn() {
  return !!getRefreshToken();
}

function clearAuthTokens() {
  Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
}

let _refreshPromise = null;

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuthTokens();
      throw new Error('Session expired');
    }

    const data = await res.json();
    saveAuthTokens({
      accessToken: data.accessToken,
      refreshToken,
      expiresIn: data.expiresIn ?? 900,
      user: getStoredUser(),
    });
    return data.accessToken;
  })();

  try {
    return await _refreshPromise;
  } finally {
    _refreshPromise = null;
  }
}

// Fetch with auto Bearer header + one retry after a 401 (refreshing first).
async function authFetch(path, options = {}) {
  if (isTokenExpired() && getRefreshToken()) {
    await refreshAccessToken().catch(() => {});
  }

  const url = `${API_BASE}${path}`;
  const doFetch = (token) =>
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await doFetch(getAccessToken());

  if (res.status === 401 && getRefreshToken()) {
    try {
      const token = await refreshAccessToken();
      res = await doFetch(token);
    } catch {
      // refresh failed — fall through with the original 401
    }
  }

  return res;
}

// ---------------------------------------------------------------------------
// THEME — fetch + apply GET /api/admin/theme. No auth required; called on
// every page load before anything else renders.
// ---------------------------------------------------------------------------
const THEME_CACHE_KEY = 'arshanemi-dashboard-theme';
const THEME_CACHE_TTL = 10 * 60 * 1000; // 10 min

function hexToRgbTriplet(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#') return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) ? null : `${r} ${g} ${b}`;
}

function applyColors(colors) {
  const root = document.documentElement;
  Object.entries(colors || {}).forEach(([key, val]) => {
    root.style.setProperty(`--color-${key}`, val);
    const rgb = hexToRgbTriplet(val);
    if (rgb) root.style.setProperty(`--color-${key}-rgb`, rgb);
  });
}

const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

function applyTypography(typography) {
  if (!typography) return;
  const root = document.documentElement;
  if (typography.fontFamily) {
    const f = typography.fontFamily;
    if (f === 'System') {
      root.style.setProperty('--font-sans', SYSTEM_FONT_STACK);
    } else {
      root.style.setProperty('--font-sans', `${f}, ui-sans-serif, system-ui, -apple-system, sans-serif`);
      if (f !== 'Inter') {
        const id = `gf-${f.replace(/\s+/g, '-').toLowerCase()}`;
        if (!document.getElementById(id)) {
          const link = document.createElement('link');
          link.id = id;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
          document.head.appendChild(link);
        }
      }
    }
  }
  if (typography.scale != null) {
    root.style.setProperty('--si-font-scale', String(typography.scale));
  }
}

function applyBorderRadius(borderRadius) {
  if (!borderRadius) return;
  Object.entries(borderRadius).forEach(([k, v]) => {
    if (k === 'preset') return;
    const cssKey = k === 'base' ? '--radius' : `--radius-${k}`;
    document.documentElement.style.setProperty(cssKey, v);
  });
}

function applyFullTheme(siteTheme) {
  const mode = siteTheme.mode || 'dark';
  const colors = siteTheme[mode] || siteTheme.dark || {};
  document.documentElement.setAttribute('data-theme', mode);
  applyColors(colors);
  applyTypography(siteTheme.typography);
  applyBorderRadius(siteTheme.borderRadius);
}

// Applies a cached theme immediately (avoids a flash of wrong colors), then
// always refetches from the API in the background and re-applies + re-caches.
async function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_CACHE_KEY);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < THEME_CACHE_TTL && data?.mode) applyFullTheme(data);
    }
  } catch {}

  try {
    const res = await fetch(`${API_BASE}/api/admin/theme`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      applyFullTheme(data);
      localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    }
  } catch {
    // offline / API down — the :root fallback values (or cached theme above) stay active
  }
}

// ---------------------------------------------------------------------------
// TOAST NOTIFICATIONS
// ---------------------------------------------------------------------------
function ensureToastHost() {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'fixed top-20 right-4 z-[100] flex flex-col gap-2 items-end';
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type = 'info', duration = 3200) {
  const host = ensureToastHost();
  const toneClass =
    type === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : type === 'success'
      ? 'border-accent/30 bg-accent/10 text-foreground'
      : 'border-divider bg-card text-foreground';

  const el = document.createElement('div');
  el.className = `pointer-events-auto max-w-sm rounded-xl border ${toneClass} backdrop-blur-xl px-4 py-3 text-sm font-medium shadow-2xl shadow-black/40 translate-x-6 opacity-0 transition-all duration-300`;
  el.textContent = message;
  host.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.remove('translate-x-6', 'opacity-0');
  });

  setTimeout(() => {
    el.classList.add('translate-x-6', 'opacity-0');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ---------------------------------------------------------------------------
// AUTH GUARDS
// ---------------------------------------------------------------------------
function loginUrlWithRedirect() {
  const redirect = encodeURIComponent(location.pathname + location.search);
  return `login.html?redirect=${redirect}`;
}

// Call at the top of any protected page. Redirects immediately if not logged in.
function requireAuth() {
  if (!isLoggedIn()) {
    location.replace(loginUrlWithRedirect());
    return false;
  }
  return true;
}

// Call when an API response comes back 401 even after the auto-refresh retry.
function handleUnauthorized(message = 'Your session has expired. Redirecting to login…') {
  showToast(message, 'error');
  clearAuthTokens();
  setTimeout(() => {
    location.href = loginUrlWithRedirect();
  }, 1400);
}

function redirectAfterLogin() {
  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');
  location.href = redirect && redirect.startsWith('login.html') ? 'index.html' : redirect || 'index.html';
}
