# Cross-Domain Login - Quick Deployment Guide

## Pre-Deployment Checklist

### 1. Backend Update
```bash
cd backend
# Update Django settings.py with the new cookie domain settings
# Ensure these are in place:
# - SESSION_COOKIE_DOMAIN = '.seekhowithrua.com'
# - CSRF_COOKIE_DOMAIN = '.seekhowithrua.com'  
# - CORS_EXPOSE_HEADERS configured
```

### 2. Shared Library Deployment
```bash
# Ensure js/cosmos-auth.js is deployed to CDN or static folder
# Path: /js/cosmos-auth.js
# Used by:
# - lms.seekhowithrua.com (../js/cosmos-auth.js)
# - gaming.seekhowithrua.com (../js/cosmos-auth.js)
# - animation.seekhowithrua.com (../js/cosmos-auth.js)
```

### 3. Frontend React App
```bash
cd django-react-ml-app/frontend
# Build production version
npm run build

# .env.production should exist with:
VITE_API_URL=https://api.seekhowithrua.com
VITE_GOOGLE_CLIENT_ID=<your-client-id>

# Deploy dist/ folder to Vercel or hosting
```

### 4. LMS Platform
```bash
# Already updated in seekhowithrua-lms/
# - js/lms.js refactored to use COSMOS_AUTH
# - index.html includes cosmos-auth.js
# - Ensure ../js/cosmos-auth.js is accessible when deployed
```

### 5. Gaming Platform
```bash
# Already updated in seekhowithrua-gaming/
# - js/auth.js refactored to use COSMOS_AUTH
# - index.html includes cosmos-auth.js (2 places)
# - Ensure ../js/cosmos-auth.js is accessible
```

### 6. Animation Lab
```bash
# Already updated in seekhowithrua-animation/
# - js/auth.js refactored to use COSMOS_AUTH
# - index.html includes cosmos-auth.js
# - Ensure ../js/cosmos-auth.js is accessible
```

---

## Testing Steps (Manual)

### Test 1: Basic Login and Redirect
1. Navigate to https://app.seekhowithrua.com/login
2. Enter valid credentials or use Google login
3. Verify you're placed in app.seekhowithrua.com dashboard
4. Check browser DevTools → Application → Storage → localStorage
   - Should contain: `cosmos_auth_token` and `cosmos_user`
5. Check DevTools → Application → Cookies
   - Verify session/auth cookies show domain: `.seekhowithrua.com`

### Test 2: Cross-Domain Login
1. Still logged into app.seekhowithrua.com
2. Navigate to https://lms.seekhowithrua.com
3. Click the "🔐 Login" button in top-right
4. System should redirect to app.seekhowithrua.com/login?redirect=...
5. After successful login, verify redirect back to lms.seekhowithrua.com with token in URL
6. Verify localStorage on lms.seekhowithrua.com contains the token
7. Verify you can see your username in the user-section

### Test 3: Gaming After Login
1. While logged in from above, navigate to https://gaming.seekhowithrua.com
2. Should immediately show your username/avatar (not "🔐 Login" button)
3. Try playing a game
4. Game should record your score (if tracking is enabled)

### Test 4: Cross-Tab Logout
1. Open https://lms.seekhowithrua.com in Tab A (already logged in)
2. Open https://gaming.seekhowithrua.com in Tab B (already logged in)
3. In Tab A, click Logout button
4. Switch to Tab B - should automatically show "🔐 Login" button (no page refresh needed)
5. Return to Tab A - should be on login page

### Test 5: Logout and Re-login
1. From any authenticated page, click Logout
2. Verify you're redirected to app.seekhowithrua.com/login
3. Verify all localStorage is cleared (use DevTools)
4. Verify all cookies are deleted (use DevTools)
5. Log back in successfully
6. Verify token is new (different from before)

### Test 6: Token Expiry Recovery
1. Log in successfully
2. Wait for token to expire (or manually set expiry in code)
3. Try to access an API endpoint
4. Should receive 401 response
5. App should automatically redirect to login
6. After re-login, should work again

### Test 7: Browser Refresh on Subdomain
1. Log in on app.seekhowithrua.com
2. Navigate to gaming.seekhowithrua.com with token in URL
3. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
4. Should stay logged in (token restored from localStorage)
5. No additional login required

### Test 8: Direct Navigation (No URL Token)
1. Log in and get token on app.seekhowithrua.com
2. Directly navigate to lms.seekhowithrua.com in new tab
3. Should show as logged in (uses localStorage)
4. Logout button should work
5. Should redirect properly

---

## Troubleshooting in Production

### Debug Mode Activation
Add this to browser console on any domain:
```javascript
// Enable debug logging
localStorage.setItem('cosmos_auth_debug', 'true');
COSMOS_AUTH.verifyToken().then(isValid => {
  console.log('Token valid:', isValid);
});
```

### Check Token Status
```javascript
console.log('Token:', COSMOS_AUTH.getToken());
console.log('User:', COSMOS_AUTH.getUser());
console.log('Authenticated:', COSMOS_AUTH.isAuthenticated());
```

### Network Logging
1. Open DevTools → Network tab
2. Filter for `/api/auth/` requests
3. Check response status codes:
   - 200 = Success
   - 401 = Unauthorized (token expired)
   - 403 = Forbidden (CORS issue)
   - 500 = Server error

### CORS Issue Diagnostic
1. Check console for CORS errors
2. Go to Network tab
3. Look for request headers:
   ```
   Origin: https://lms.seekhowithrua.com
   Authorization: Token <your-token>
   ```
4. Check response headers:
   ```
   Access-Control-Allow-Origin: https://lms.seekhowithrua.com
   Access-Control-Allow-Credentials: true
   ```

---

## Rollback Plan

If issues arise in production:

### Option 1: Quick Fix (Keep Users Logged In)
1. Keep old auth.js files as backups
2. Revert `index.html` files to not include `cosmos-auth.js`
3. Revert JS auth files to previous versions
4. Keep Django settings.py changes (they're backward compatible)

### Option 2: Partial Deployment  
1. Deploy cosmos-auth.js and Django settings first
2. Test on staging environment
3. Update sites one at a time (app.seekhowithrua.com → lms → gaming → animation)
4. Monitor error rates between each update

### Option 3: Feature Flag
Add this to cosmos-auth.js top:
```javascript
if (!window.COSMOS_AUTH_ENABLED) {
  console.log('COSMOS_AUTH is disabled');
} else {
  // ... rest of cosmos-auth.js
}
```

Then control via:
```javascript
window.COSMOS_AUTH_ENABLED = true; // or false to disable
```

---

## Performance Optimization

### Current Implementation
- cosmos-auth.js: ~2KB minified
- Token verification: Async (non-blocking)
- localStorage checks: <1ms
- Cookie access: <1ms

### Recommended CDN Caching
```
cosmos-auth.js: Cache-Control: max-age=604800 (1 week)
```

### Pre-load Optimization
Add before cosmos-auth.js:
```html
<link rel="preload" href="../js/cosmos-auth.js" as="script">
```

---

## Monitoring Metrics

Track these in your analytics:
1. Login success rate
2. Cross-domain redirect success rate
3. Token validation failures
4. CORS errors
5. localStorage quota exceeded errors
6. Logout across tabs success rate

---

## Support & Escalation

### Level 1: User-Facing Issues
- Clear localStorage/cookies
- Hard refresh browser
- Try different browser
- Check if same on other devices

### Level 2: Developer Issues
- Check browser console for errors
- Verify network requests in DevTools
- Check Response headers for CORS
- Verify backend logs for 401/403

### Level 3: Infrastructure Issues
- Check API server status
- Verify DNS resolution for all subdomains
- Check SSL/TLS certificate validity
- Verify CDN cache purge (if needed)

---

**Deployment Status**: ✅ Ready
**Last Updated**: April 10, 2026
**Version**: 1.0.0
