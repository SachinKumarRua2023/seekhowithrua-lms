# CRITICAL BUG REPORT - Cross-Domain Login Implementation
## Status: ❌ NOT READY FOR PRODUCTION ❌

---

## 🔴 CRITICAL BUGS (Will Cause Login Failure)

### BUG #1: TOKEN_KEY MISMATCH - LOGIN WILL FAIL
**Severity**: 🔴 CRITICAL  
**Location**: 
- `App.jsx` line 20: `export const TOKEN_KEY = "cosmos_token"`
- `cosmos-auth.js` line 9: `TOKEN_KEY: 'cosmos_auth_token'`

**Issue**:
React app saves token as `cosmos_token`, but cosmos-auth.js looks for `cosmos_auth_token`. They don't match!

**Impact**:
- Login on app.seekhowithrua.com saves as `cosmos_token`
- User clicks login on lms.seekhowithrua.com
- cosmos-auth.js checks for `cosmos_auth_token` → NOT FOUND
- User sees "Not logged in" even though token exists
- **COMPLETE LOGIN FAILURE ACROSS DOMAINS**

**Fix Required**:
Option A (Recommended):
```javascript
// In cosmos-auth.js, change to:
TOKEN_KEY: 'cosmos_token',  // Match what React uses

// Also update USER_KEY to match:
USER_KEY: 'cosmos_user',    // Keep as is
```

OR Option B:
```javascript
// In Login_Signup_Logout.jsx, change all occurrences:
localStorage.setItem('cosmos_auth_token', token);  // Use cosmos-auth.js key
localStorage.setItem('cosmos_user', JSON.stringify(user));
```

---

### BUG #2: CREDENTIALS EXPOSED IN SOURCE CODE
**Severity**: 🔴 CRITICAL SECURITY  
**Location**: `backend/settings.py` lines 130-138

**Issue**:
```python
DATABASE PASSWORD: 'Drunken@1234#4321'  # ← EXPOSED IN REPO
EMAIL PASSWORD: 'Drunken@123'            # ← EXPOSED IN REPO
```

**Impact**:
- Anyone with repo access can connect to your database
- Anyone can send emails from your account
- Credentials will be visible on GitHub if you push this
- **CLIENT WILL REJECT DUE TO SECURITY**

**Fix Required**:
```python
# REMOVE credentials from settings.py and use environment variables:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'postgres'),
        'USER': os.environ.get('DB_USER', 'postgres.vhkiwztuyypdtvduapqf'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),  # FROM ENV ONLY
        'HOST': os.environ.get('DB_HOST', 'aws-1-ap-southeast-2.pooler.supabase.com'),
        'PORT': os.environ.get('DB_PORT', '6543'),
        'OPTIONS': {'sslmode': 'require'},
    }
}

EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
```

---

### BUG #3: CORS_ALLOW_ALL_ORIGINS = True (Security Risk)
**Severity**: 🔴 CRITICAL SECURITY  
**Location**: `backend/settings.py` line 65

**Issue**:
```python
CORS_ALLOW_ALL_ORIGINS = True  # ← SECURITY ISSUE
CORS_ALLOW_CREDENTIALS = True
```

**Impact**:
- ANY website can make authenticated requests to your API
- Violates CORS security model
- Even though CORS_ALLOWED_ORIGINS is restrictive, having both is confusing

**Fix Required**:
```python
# Change to:
CORS_ALLOW_ALL_ORIGINS = False  # ← MUST BE FALSE IN PRODUCTION

# Keep CORS_ALLOWED_ORIGINS as specified (which is correct)
CORS_ALLOWED_ORIGINS = [
    'https://app.seekhowithrua.com',
    # ... rest of list
]
```

---

## 🟠 HIGH PRIORITY BUGS

### BUG #4: Race Condition in cosmos-auth.js init()
**Severity**: 🟠 HIGH  
**Location**: `cosmos-auth.js` lines 173-180

**Issue**:
```javascript
// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => COSMOS_AUTH.init());  // ← NOT AWAITED
} else {
  COSMOS_AUTH.init();
}
```

**Problem**:
- `init()` is async but not waited for
- `verifyToken()` might still be running when page loads
- User might get redirected while token is being verified
- Multiple calls to init() = multiple requests to backend

**Fix Required**:
```javascript
// Make init() properly awaited:
async function initializeAuth() {
  await COSMOS_AUTH.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  initializeAuth();
}

// Also fix init() to be idempotent:
init() {
  if (this._initialized) return;  // ← Add this check
  this._initialized = true;
  
  this.checkUrlForToken();
  // ... rest of init
}
```

---

### BUG #5: No Timeout on Network Requests
**Severity**: 🟠 HIGH  
**Location**: `cosmos-auth.js` lines 81-102, lines 110-135

**Issue**:
```javascript
// These fetch calls have NO timeout:
async logout() {
  await fetch(`${this.API_BASE_URL}/api/auth/logout/`, {
    // No timeout! Could hang forever
  });
}

async verifyToken() {
  const response = await fetch(`${this.API_BASE_URL}/api/auth/user/`, {
    // No timeout! Could hang forever
  });
}
```

**Impact**:
- If API is unreachable, page hangs forever
- User gets stuck waiting
- No way to cancel the request

**Fix Required**:
```javascript
async logout() {
  const token = this.getToken();
  if (token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 second timeout
      
      await fetch(`${this.API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        credentials: 'include',
        signal: controller.signal,  // ← Add timeout
      });
      clearTimeout(timeoutId);
    } catch (err) {
      console.error('Logout API error:', err);
    }
  }
  this.clearAuth();
  window.location.href = `${this.MAIN_APP_URL}/login`;
}
```

---

### BUG #6: Storage Event Not Fired on Current Tab
**Severity**: 🟠 HIGH  
**Location**: `cosmos-auth.js` lines 151-157

**Issue**:
```javascript
// Storage event listener:
window.addEventListener('storage', (e) => {
  // ← This only fires on OTHER tabs, not current tab
  if (e.key === this.TOKEN_KEY || e.key === this.USER_KEY) {
    window.dispatchEvent(new CustomEvent('cosmosAuthChanged', {...}));
  }
});
```

**Problem**:
- When you call `saveAuth()` on current tab, other tabs don't get notified
- Tab A saves token → Tab B doesn't receive `cosmosAuthChanged` event
- Cross-tab sync partially broken

**Fix Required**:
```javascript
// In saveAuth():
saveAuth(token, user) {
  localStorage.setItem(this.TOKEN_KEY, token);
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  
  // Dispatch event on CURRENT tab too:
  window.dispatchEvent(new CustomEvent('cosmosAuthChanged', { 
    detail: { isLoggedIn: true, user } 
  }));
}

// Also fire event for other tabs:
// (storage event already handles this)
```

---

### BUG #7: Potential Infinite Redirect Loop
**Severity**: 🟠 HIGH  
**Location**: `cosmos-auth.js` lines 120-125

**Issue**:
```javascript
async init() {
  this.checkUrlForToken();
  
  if (this.isAuthenticated()) {
    const isValid = await this.verifyToken();
    if (!isValid && !this.isLoginPage()) {
      this.redirectToLogin();  // ← Might cause loop
    }
  }
}
```

**Problem**:
- If `redirectToLogin()` goes to `/login`, but page detects token as invalid
- Could redirect multiple times
- User gets stuck in redirect loop

**Fix Required**:
```javascript
async init() {
  // Prevent multiple init calls
  if (this._initInProgress) return;
  this._initInProgress = true;
  
  this.checkUrlForToken();
  
  if (this.isAuthenticated()) {
    const isValid = await this.verifyToken();
    if (!isValid) {
      this.clearAuth();  // Ensure data is cleared
      if (!this.isLoginPage()) {
        this.redirectToLogin();  // Safe to redirect now
      }
    }
  }
  
  // ... rest of init
}
```

---

### BUG #8: No Error Handling for Malformed User Data
**Severity**: 🟠 HIGH  
**Location**: `cosmos-auth.js` lines 139-147

**Issue**:
```javascript
checkUrlForToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userData = urlParams.get('user');
  
  if (token && userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData));  // ← Can fail silently
      this.saveAuth(token, user);
      return true;
    } catch (err) {
      console.error('Failed to parse user data from URL:', err);  // ← Only logs
    }
  }
  return false;
}
```

**Problem**:
- If userData is corrupted, error is silently caught
- User doesn't know why login failed
- Token is saved without user data → partial login state

**Fix Required**:
```javascript
checkUrlForToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userData = urlParams.get('user');
  
  if (token && userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData));
      
      // Validate user object has required fields:
      if (!user.email || !user.id) {
        throw new Error('Invalid user data: missing email or id');
      }
      
      this.saveAuth(token, user);
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    } catch (err) {
      console.error('Failed to parse user data from URL:', err);
      // Show error to user:
      alert('Login failed: ' + err.message);
      // Clear the URL params:
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  return false;
}
```

---

## 🟡 MEDIUM PRIORITY BUGS

### BUG #9: Open Redirect Vulnerability in handleLMSRedirect()
**Severity**: 🟡 MEDIUM  
**Location**: `Login_Signup_Logout.jsx` lines 6-24

**Issue**:
```javascript
function handleLMSRedirect(navigate, token, user) {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get('redirect');
  
  if (redirectUrl) {
    // Only checks domain inclusion, not exact match:
    const isLMS = redirectUrl.includes('lms.seekhowithrua.com');  // ← Loose check
    
    if (isLMS || isGaming || isAnimation || isLocalhost) {
      window.location.href = `${decodeURIComponent(redirectUrl)}?token=${token}&user=${userJson}`;
      return true;
    }
  }
  return false;
}
```

**Problem**:
- `redirectUrl.includes('lms.seekhowithrua.com')` is loose validation
- Attacker could use: `https://evil.com/lms.seekhowithrua.com`
- Token could be leaked to malicious site

**Fix Required**:
```javascript
const REDIRECT_WHITELIST = new Set([
  'https://lms.seekhowithrua.com',
  'https://gaming.seekhowithrua.com',
  'https://animation.seekhowithrua.com',
  'https://app.seekhowithrua.com',
  'http://localhost:5173',
  'http://localhost:3000',
]);

function handleLMSRedirect(navigate, token, user) {
  const urlParams = new URLSearchParams(window.location.search);
  let redirectUrl = urlParams.get('redirect');
  
  if (redirectUrl) {
    try {
      const url = new URL(decodeURIComponent(redirectUrl));
      // Strict URL validation:
      if (REDIRECT_WHITELIST.has(url.origin)) {
        const userJson = encodeURIComponent(JSON.stringify(user));
        window.location.href = `${url.origin}${url.pathname}?token=${token}&user=${userJson}`;
        return true;
      }
    } catch (err) {
      console.error('Invalid redirect URL:', err);
    }
  }
  return false;
}
```

---

### BUG #10: Multiple onAuthChange Listeners (Memory Leak)
**Severity**: 🟡 MEDIUM  
**Location**: `cosmos-auth.js` lines 161-166

**Issue**:
```javascript
onAuthChange(callback) {
  window.addEventListener('cosmosAuthChanged', (e) => {
    callback(e.detail);
  });
}
```

**Problem**:
- Every time `onAuthChange()` is called, a new listener is added
- React components might call it in useEffect multiple times
- Memory leak from duplicate listeners
- Callbacks fire multiple times for same event

**Fix Required**:
```javascript
onAuthChange(callback) {
  // Track unique callbacks:
  if (!this._authChangeListeners) {
    this._authChangeListeners = new Set();
  }
  
  if (!this._authChangeListeners.has(callback)) {
    const handler = (e) => callback(e.detail);
    window.addEventListener('cosmosAuthChanged', handler);
    this._authChangeListeners.add(callback);
    
    // Return unsubscribe function:
    return () => {
      window.removeEventListener('cosmosAuthChanged', handler);
      this._authChangeListeners.delete(callback);
    };
  }
}
```

---

### BUG #11: Missing .env.production Setup
**Severity**: 🟡 MEDIUM  
**Location**: Created but might not have content

**Issue**:
The `.env.production` file has placeholder values:
```
VITE_API_URL=https://api.seekhowithrua.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Problem**:
- VITE_GOOGLE_CLIENT_ID needs to be updated
- File might not be read during build
- Google login will fail if not configured

**Fix Required**:
```bash
# .env.production needs actual Google Client ID:
VITE_API_URL=https://api.seekhowithrua.com
VITE_GOOGLE_CLIENT_ID=<actual-client-id-from-google-cloud>

# Build must include this:
npm run build  # Uses .env.production
```

---

## 📋 SUMMARY OF FIXES REQUIRED

| Bug | Severity | Quick Fix Time | Must Fix Before Release |
|-----|----------|---|---|
| TOKEN_KEY Mismatch | CRITICAL | 2 min | ✅ YES |
| Exposed Credentials | CRITICAL | 10 min | ✅ YES |
| CORS_ALLOW_ALL_ORIGINS | CRITICAL | 2 min | ✅ YES |
| Race Condition | HIGH | 5 min | ✅ YES |
| Network Timeout | HIGH | 10 min | ✅ YES |
| Storage Event Bug | HIGH | 5 min | ✅ YES |
| Redirect Loop | HIGH | 5 min | ✅ YES |
| Malformed Data | HIGH | 5 min | ✅ YES |
| Open Redirect | MEDIUM | 10 min | ✅ YES |
| Memory Leak | MEDIUM | 5 min | ⚠️ Later |
| .env Setup | MEDIUM | 5 min | ✅ YES |

---

## ✅ TESTING CHECKLIST NEEDED BEFORE DEPLOYMENT

- [ ] TOKEN_KEY fixed and tested
- [ ] No credentials in source code
- [ ] CORS_ALLOW_ALL_ORIGINS = False
- [ ] Login → LMS redirect works
- [ ] Token validation doesn't redirect loop
- [ ] Timeout on slow network
- [ ] Cross-tab logout sync works
- [ ] Google OAuth configured
- [ ] .env.production updated
- [ ] No console errors in any domain
- [ ] Network requests have proper auth headers

---

## RECOMMENDATION

🛑 **DO NOT SUBMIT TO CLIENT YET**

**Estimated Fix Time**: 1-2 hours  
**Risk Level if Submitted**: VERY HIGH (will fail in production)

Start with CRITICAL bugs immediately. The TOKEN_KEY mismatch alone will break the entire login system.

---

**Generated**: April 10, 2026  
**Status**: Needs Urgent Fixes
