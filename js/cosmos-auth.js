/**
 * Shared Cross-Domain Authentication Management
 * Used by: app.seekhowithrua.com, lms.seekhowithrua.com, gaming.seekhowithrua.com, animation.seekhowithrua.com
 */

const COSMOS_AUTH = {
  TOKEN_KEY: 'cosmos_token',  // MUST MATCH App.jsx export
  USER_KEY: 'cosmos_user',
  API_BASE_URL: 'https://api.seekhowithrua.com',
  MAIN_APP_URL: 'https://app.seekhowithrua.com',
  
  // Get stored token
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  // Get stored user data
  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  },

  // Save login data across domains
  saveAuth(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    // Notify other tabs/windows about the login
    window.dispatchEvent(new CustomEvent('cosmosAuthChanged', { 
      detail: { isLoggedIn: true, user } 
    }));
  },

  // Clear auth data (logout)
  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Notify other tabs/windows about the logout
    window.dispatchEvent(new CustomEvent('cosmosAuthChanged', { 
      detail: { isLoggedIn: false } 
    }));
  },

  // Logout from backend and clear all data
  async logout() {
    const token = this.getToken();
    if (token) {
      try {
        // Add 5-second timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await fetch(`${this.API_BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err) {
        console.error('Logout API error:', err);
        // Continue logout even if API call fails
      }
    }
    
    // Clear local auth
    this.clearAuth();
    
    // Redirect to main app login
    window.location.href = `${this.MAIN_APP_URL}/login`;
  },

  // Redirect to login on main app with return URL
  redirectToLogin(returnUrl = window.location.href) {
    const encodedUrl = encodeURIComponent(returnUrl);
    window.location.href = `${this.MAIN_APP_URL}/login?redirect=${encodedUrl}`;
  },

  // Get auth headers for API calls
  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': token ? `Token ${token}` : '',
      'Content-Type': 'application/json',
    };
  },

  // Verify token is still valid with backend
  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Add 5-second timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.API_BASE_URL}/api/auth/user/`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const userData = await response.json();
        this.saveAuth(token, userData);
        return true;
      } else if (response.status === 401) {
        // Token is invalid, clear auth
        this.clearAuth();
        return false;
      }
    } catch (err) {
      console.error('Token verification error:', err);
    }
    
    return false;
  },

  // Initialize auth on page load
  async init() {
    // Prevent multiple init calls (idempotent)
    if (this._initialized) return;
    this._initialized = true;
    
    // Check URL for token from redirect
    this.checkUrlForToken();
    
    // Verify stored token is still valid
    if (this.isAuthenticated()) {
      const isValid = await this.verifyToken();
      if (!isValid) {
        this.clearAuth();
        if (!this.isLoginPage()) {
          this.redirectToLogin();
        }
      }
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

  // Check if token is present in URL query params (from redirect)
  checkUrlForToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        this.saveAuth(token, user);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      } catch (err) {
        console.error('Failed to parse user data from URL:', err);
      }
    }
    return false;
  },

  // Check if current page is login page
  isLoginPage() {
    const path = window.location.pathname;
    return path.includes('/login') || path.includes('/auth');
  },

  // Listen for auth changes
  onAuthChange(callback) {
    window.addEventListener('cosmosAuthChanged', (e) => {
      callback(e.detail);
    });
  },
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => COSMOS_AUTH.init());
} else {
  COSMOS_AUTH.init();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = COSMOS_AUTH;
}
