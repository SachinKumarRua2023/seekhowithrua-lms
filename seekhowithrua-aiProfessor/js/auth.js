/**
 * AI Professor Authentication Module
 * Uses COSMOS_AUTH for cross-domain authentication
 */

const aiProfessorAuth = {
  // Check if user is authenticated
  checkAuth: function() {
    if (typeof COSMOS_AUTH !== 'undefined') {
      return COSMOS_AUTH.checkAuth();
    }
    
    // Fallback: check localStorage directly
    const token = localStorage.getItem('cosmos_token') || localStorage.getItem('lms_token');
    const userInfo = localStorage.getItem('cosmos_user') || localStorage.getItem('lms_user');
    
    return !!(token && userInfo);
  },

  // Get user information
  getUserInfo: function() {
    if (typeof COSMOS_AUTH !== 'undefined') {
      return COSMOS_AUTH.getUserInfo();
    }
    
    // Fallback: parse from localStorage
    try {
      const userInfo = localStorage.getItem('cosmos_user') || localStorage.getItem('lms_user');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (e) {
      console.error('Error parsing user info:', e);
      return null;
    }
  },

  // Get auth token
  getToken: function() {
    if (typeof COSMOS_AUTH !== 'undefined') {
      return COSMOS_AUTH.getToken();
    }
    
    return localStorage.getItem('cosmos_token') || localStorage.getItem('lms_token');
  },

  // Show login required modal
  showLoginModal: function(message) {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.add('active');
    } else {
      // Fallback alert
      alert(message || 'Please login to continue');
      window.location.href = 'https://app.seekhowithrua.com/login?redirect=' + encodeURIComponent(window.location.href);
    }
  },

  // Logout user
  logout: function() {
    if (typeof COSMOS_AUTH !== 'undefined') {
      COSMOS_AUTH.logout();
    } else {
      // Manual cleanup
      localStorage.removeItem('cosmos_token');
      localStorage.removeItem('cosmos_user');
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
    }
    
    // Reload page
    window.location.reload();
  },

  // Redirect to login
  redirectToLogin: function() {
    const currentUrl = window.location.href;
    const loginUrl = 'https://app.seekhowithrua.com/login?redirect=' + encodeURIComponent(currentUrl);
    window.location.href = loginUrl;
  },

  // Update UI based on auth state
  updateUI: function() {
    const userSection = document.getElementById('userSection');
    if (!userSection) return;

    if (this.checkAuth()) {
      const userInfo = this.getUserInfo();
      if (userInfo) {
        userSection.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: var(--text-secondary); font-size: 13px;">${userInfo.name || userInfo.email || 'User'}</span>
            <button onclick="aiProfessorAuth.logout()" style="background: transparent; border: 1px solid #2a2a3a; color: #a0a0b0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Logout</button>
          </div>
        `;
      }
    } else {
      userSection.innerHTML = `
        <button onclick="aiProfessorAuth.redirectToLogin()" style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 13px;">
          Login
        </button>
      `;
    }
  }
};

// Auto-update UI when auth state changes
document.addEventListener('cosmosAuthChanged', function(e) {
  aiProfessorAuth.updateUI();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    aiProfessorAuth.updateUI();
  }, 500);
});
