# QUICK FIX GUIDE - Critical Bugs (Apply These NOW)

## 🔴 FIX #1: TOKEN_KEY MISMATCH (2 minutes)

### File: `js/cosmos-auth.js`
Line 2, change:
```javascript
TOKEN_KEY: 'cosmos_auth_token',
```

TO:
```javascript
TOKEN_KEY: 'cosmos_token',  // MUST MATCH App.jsx
```

**Why**: React App.jsx uses `cosmos_token`, cosmos-auth.js was looking for `cosmos_auth_token`. They need to match!

---

## 🔴 FIX #2: REMOVE EXPOSED CREDENTIALS (5 minutes)

### File: `backend/settings.py`

**FIND** (around line 144):
```python
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'postgres',
        'USER':     'postgres.vhkiwztuyypdtvduapqf',
        'PASSWORD': 'Drunken@1234#4321',  # ← DELETE THIS PASSWORD
        'HOST':     'aws-1-ap-southeast-2.pooler.supabase.com',
        'PORT':     '6543',
        'OPTIONS':  {'sslmode': 'require'},
    }
}
```

**REPLACE WITH**:
```python
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.environ.get('DB_NAME', 'postgres'),
        'USER':     os.environ.get('DB_USER', 'postgres.vhkiwztuyypdtvduapqf'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),  # USE ENV VARIABLE
        'HOST':     os.environ.get('DB_HOST', 'aws-1-ap-southeast-2.pooler.supabase.com'),
        'PORT':     os.environ.get('DB_PORT', '6543'),
        'OPTIONS':  {'sslmode': 'require'},
    }
}
```

**AND FIND** (around line 236):
```python
EMAIL_HOST_USER = 'seekhowithrua@gmail.com'
EMAIL_HOST_PASSWORD = 'Drunken@123'  # ← DELETE THIS
```

**REPLACE WITH**:
```python
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'seekhowithrua@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
```

**Then** set these environment variables in your deployment:
```bash
DB_PASSWORD=your_actual_password_here
EMAIL_HOST_PASSWORD=your_actual_email_password_here
```

---

## 🔴 FIX #3: DISABLE CORS_ALLOW_ALL_ORIGINS (1 minute)

### File: `backend/settings.py`

**FIND** (line 65):
```python
CORS_ALLOW_ALL_ORIGINS = True
```

**REPLACE WITH**:
```python
CORS_ALLOW_ALL_ORIGINS = False  # MUST BE FALSE IN PRODUCTION
```

Keep `CORS_ALLOWED_ORIGINS` as is (it's already restricted correctly).

---

## 🟠 FIX #4: ADD TIMEOUT TO NETWORK REQUESTS (8 minutes)

### File: `js/cosmos-auth.js`

**FIND** the `logout()` function (around line 70) and **REPLACE ENTIRE FUNCTION**:

```javascript
// Logout from backend and clear all data
async logout() {
  const token = this.getToken();
  if (token) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 second timeout
      
      await fetch(`${this.API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,  // ADD THIS
      });
      clearTimeout(timeoutId);
    } catch (err) {
      console.error('Logout API error:', err);
      // Still clear auth even if API fails
    }
  }
  
  // Clear local auth
  this.clearAuth();
  
  // Redirect to main app login
  window.location.href = `${this.MAIN_APP_URL}/login`;
}
```

**FIND** the `verifyToken()` function (around line 110) and **REPLACE ENTIRE FUNCTION**:

```javascript
// Verify token is still valid with backend
async verifyToken() {
  const token = this.getToken();
  if (!token) return false;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);  // 5 second timeout
    
    const response = await fetch(`${this.API_BASE_URL}/api/auth/user/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      signal: controller.signal,  // ADD THIS
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
}
```

---

## 🟠 FIX #5: PREVENT DUPLICATE INIT CALLS (3 minutes)

### File: `js/cosmos-auth.js`

**FIND** (around line 117) the beginning of `async init()` function and **ADD** these lines:

```javascript
async init() {
  // Prevent multiple init calls
  if (this._initialized) return;
  this._initialized = true;
  
  // Check URL for token from redirect
  this.checkUrlForToken();
  
  // ... rest of function remains the same
```

---

## 🟡 FIX #6: FIX OPEN REDIRECT VULNERABILITY (5 minutes)

### File: `django-react-ml-app/frontend/src/components/Login_Signup_Logout.jsx`

**FIND** the `handleLMSRedirect` function (around line 6) and **REPLACE ENTIRE FUNCTION**:

```javascript
// Whitelist of allowed redirect domains
const REDIRECT_WHITELIST = new Set([
  'https://lms.seekhowithrua.com',
  'https://gaming.seekhowithrua.com',
  'https://animation.seekhowithrua.com',
  'https://app.seekhowithrua.com',
  'http://localhost:5173',
  'http://localhost:3000',
]);

// Helper to handle LMS, Gaming, and Animation redirect after login
function handleLMSRedirect(navigate, token, user) {
  const urlParams = new URLSearchParams(window.location.search);
  let redirectUrl = urlParams.get('redirect');
  
  if (redirectUrl) {
    try {
      // Strict URL validation
      const url = new URL(decodeURIComponent(redirectUrl));
      
      // Only allow whitelisted domains
      if (REDIRECT_WHITELIST.has(url.origin)) {
        const userJson = encodeURIComponent(JSON.stringify(user));
        window.location.href = `${url.origin}${url.pathname || ''}?token=${token}&user=${userJson}`;
        return true;
      } else {
        console.warn('Redirect URL not in whitelist:', url.origin);
      }
    } catch (err) {
      console.error('Invalid redirect URL:', err);
    }
  }
  return false;
}
```

---

## ✅ TESTING AFTER FIXES

After making all fixes, test these scenarios:

### Test 1: Login on app.seekhowithrua.com
1. Navigate to https://app.seekhowithrua.com/login
2. Log in with credentials
3. Check browser DevTools → Storage → localStorage
4. Verify `cosmos_token` key exists (NOT `cosmos_auth_token`)
5. Value should be your JWT token

### Test 2: Cross-Domain Redirect
1. Logged in from previous test
2. Navigate to https://lms.seekhowithrua.com
3. Click Login button
4. Should redirect to app.seekhowithrua.com/login?redirect=...
5. After login, should redirect back with token in URL
6. Verify you're logged in on LMS
7. Check localStorage on lms domain should have `cosmos_token`

### Test 3: Gaming Site
1. Visit https://gaming.seekhowithrua.com
2. Should show your username (because token exists in localStorage)
3. Should NOT show "🔐 Login" button

### Test 4: Cross-Tab Logout
1. Open Tab A: https://lms.seekhowithrua.com (logged in)
2. Open Tab B: https://gaming.seekhowithrua.com (logged in)
3. In Tab A, click Logout
4. Switch to Tab B
5. Should see "🔐 Login" button (without page refresh)
6. Tab A should be on login page

### Test 5: No Console Errors
1. Open ALL domains in tabs
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Should have NO errors (only info/debug logs)
5. Look for any red error messages

---

## ⏱️ ESTIMATED FIX TIME: 15-20 minutes

Follow the fixes in this order:
1. TOKEN_KEY fix (2 min) ← MOST CRITICAL
2. Remove credentials (5 min) ← SECURITY CRITICAL
3. CORS fix (1 min)
4. Network timeouts (8 min)
5. Init prevention (3 min)
6. Redirect validation (5 min)

**Total: ~24 minutes of work**

After fixes, run the testing checklist above.

---

## BEFORE SUBMITTING TO CLIENT:
- [ ] All CRITICAL bug fixes applied
- [ ] No credentials in source code
- [ ] All tests pass
- [ ] No console errors
- [ ] .env.production has real Google Client ID
