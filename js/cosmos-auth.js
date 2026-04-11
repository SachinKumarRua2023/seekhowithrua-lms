/**
 * COSMOS AUTH - Cross-Domain Authentication
 * Domains: app.seekhowithrua.com (auth source) ↔ lms.seekhowithrua.com (consumer)
 *
 * FLOW:
 *   1. LMS page loads → checks localStorage for token
 *   2. Not logged in → redirect to app.seekhowithrua.com/login?redirect=<lms_url>
 *   3. App logs user in → redirects back to LMS with ?token=XXX&user=<json>
 *   4. LMS reads token from URL → saves to localStorage → strips URL params
 *   5. Done. User is now authenticated on LMS domain.
 *
 *   If user is ALREADY logged in on app.seekhowithrua.com (has token in its localStorage)
 *   the app's login page should auto-redirect back to LMS with the token immediately.
 *   (Implement that check on the App side — see comment in redirectToLogin below.)
 */

const COSMOS_AUTH = {
  TOKEN_KEY: 'cosmos_token',
  USER_KEY:  'cosmos_user',

  API_BASE_URL:  'https://api.seekhowithrua.com',
  MAIN_APP_URL:  'https://app.seekhowithrua.com',

  /* ─── READ ─────────────────────────────────────────────── */

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY) || null;
  },

  getUser() {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!(this.getToken() && this.getUser());
  },

  /* ─── WRITE ─────────────────────────────────────────────── */

  saveAuth(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('cosmosAuthChanged', {
      detail: { isLoggedIn: true, user }
    }));
  },

  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.dispatchEvent(new CustomEvent('cosmosAuthChanged', {
      detail: { isLoggedIn: false }
    }));
  },

  /* ─── URL TOKEN HANDSHAKE ────────────────────────────────── */
  /**
   * Called on every page load.
   * If the app redirected back with ?token=&user= in the URL,
   * we capture them, persist to localStorage, and clean the URL.
   * Returns true if a token was found and saved.
   */
  checkUrlForToken() {
    const params = new URLSearchParams(window.location.search);
    const token    = params.get('token');
    const userJson = params.get('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(decodeURIComponent(userJson));
        this.saveAuth(token, user);
      } catch (e) {
        console.warn('[COSMOS_AUTH] Failed to parse user from URL:', e);
      }
      // Strip auth params from URL so they don't linger
      params.delete('token');
      params.delete('user');
      const cleanSearch = params.toString();
      const cleanUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '');
      window.history.replaceState({}, document.title, cleanUrl);
      return true;
    }
    return false;
  },

  /* ─── NAVIGATION HELPERS ────────────────────────────────── */

  /**
   * Send user to app login.
   * The app's /login page should:
   *   a) If already logged in → immediately redirect to `redirect` param with token appended
   *   b) If not logged in → show login form, then redirect on success
   */
  redirectToLogin(returnUrl) {
    const target = returnUrl || window.location.href;
    window.location.href =
      `${this.MAIN_APP_URL}/login?redirect=${encodeURIComponent(target)}`;
  },

  /* ─── LOGOUT ────────────────────────────────────────────── */

  async logout() {
    const token = this.getToken();
    if (token) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 5000);
        await fetch(`${this.API_BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: ctrl.signal,
        });
      } catch { /* ignore - we log out locally regardless */ }
    }
    this.clearAuth();
    // Stay on LMS after logout (just refresh to update UI)
    window.location.reload();
  },

  /* ─── VERIFY TOKEN ──────────────────────────────────────── */

  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`${this.API_BASE_URL}/api/auth/user/`, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: ctrl.signal,
      });
      if (res.ok) {
        const userData = await res.json();
        this.saveAuth(token, userData);
        return true;
      }
      if (res.status === 401) {
        this.clearAuth();
        return false;
      }
    } catch { /* network error - assume token still valid offline */ }
    return true; // optimistic if network fails
  },

  /* ─── AUTH HEADERS ──────────────────────────────────────── */

  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json',
    };
  },

  /* ─── INIT ──────────────────────────────────────────────── */

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    // 1. Grab token from URL if app redirected back here
    this.checkUrlForToken();

    // 2. Silently verify stored token (non-blocking UI)
    if (this.isAuthenticated()) {
      this.verifyToken(); // fire and forget - don't block page render
    }

    // Listen for auth changes in other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === this.TOKEN_KEY || e.key === this.USER_KEY) {
        window.dispatchEvent(new CustomEvent('cosmosAuthChanged', {
          detail: { isLoggedIn: this.isAuthenticated() }
        }));
      }
    });
  },

  onAuthChange(callback) {
    window.addEventListener('cosmosAuthChanged', (e) => callback(e.detail));
  },
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => COSMOS_AUTH.init());
} else {
  COSMOS_AUTH.init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = COSMOS_AUTH;
}