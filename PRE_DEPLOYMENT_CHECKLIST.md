# ✅ PRE-DEPLOYMENT CHECKLIST
## Before Submitting to Client

---

## PHASE 1: ENVIRONMENT CONFIGURATION (5 minutes)

### Backend Environment Variables
On your deployment platform (Vercel/Render), set these variables:

- [ ] `DB_PASSWORD` = [your database password]
- [ ] `DB_USER` = your_db_user
- [ ] `DB_HOST` = your_db_host.supabase.co
- [ ] `DB_PORT` = 5432
- [ ] `EMAIL_HOST_PASSWORD` = [your email password]
- [ ] `GOOGLE_CLIENT_ID` = [your google oauth client id]

### Frontend Environment Configuration
Update: `django-react-ml-app/frontend/.env.production`

```
VITE_API_URL=https://api.seekhowithrua.com
VITE_GOOGLE_CLIENT_ID=[REPLACE_WITH_REAL_ID]
```

- [ ] Replace `[REPLACE_WITH_REAL_ID]` with actual Google OAuth client ID

### Verification
```bash
# Check no credentials in source code
grep -r "Drunken" backend/
grep -r "password123" .
grep -r "Bearer " .
```

- [ ] No hardcoded passwords found ✅

---

## PHASE 2: BUILD & DEPLOY (10 minutes)

### Frontend Build
```bash
cd django-react-ml-app/frontend
npm install
npm run build
```

- [ ] Build completes without errors
- [ ] No console warnings about missing env vars

### Backend Deploy
```bash
# Deploy to Render/production server
git add .
git commit -m "Pre-deployment: Config ready"
git push origin main
```

- [ ] Backend deployed successfully
- [ ] Environment variables loaded correctly

---

## PHASE 3: TESTING AUDIT (20 minutes)

### Test Case 1: Basic Login ✅
```
1. Go to: https://app.seekhowithrua.com
2. Click Login
3. Enter test email & password
4. Check console (Press F12)
   - Expected: No errors
   - Check: localStorage has 'cosmos_token' key
5. Result: ✅ PASS or ❌ FAIL
```

- [ ] Test Case 1 PASSED

### Test Case 2: Cross-Domain Redirect ✅
```
1. Login on app.seekhowithrua.com
2. Click "Go to LMS" button
3. You're automatically logged in on lms.seekhowithrua.com
4. Check browser's Application tab
   - Expected: Same token exists on both domains
5. Result: ✅ PASS or ❌ FAIL
```

- [ ] Test Case 2 PASSED

### Test Case 3: Gaming Auto-Login ✅
```
1. While logged in on LMS, visit https://gaming.seekhowithrua.com
2. Expected: You're already logged in
3. No login form should appear
4. User profile shows in top-right
5. Result: ✅ PASS or ❌ FAIL
```

- [ ] Test Case 3 PASSED

### Test Case 4: Cross-Tab Logout ✅
```
1. Login on app.seekhowithrua.com (Tab A)
2. Open lms.seekhowithrua.com in Tab B
3. In Tab A, click Logout
4. Go back to Tab B (within 5 seconds)
5. Expected: You're immediately logged out
6. Result: ✅ PASS or ❌ FAIL
```

- [ ] Test Case 4 PASSED

### Test Case 5: Network Timeout Handling ✅
```
1. Open DevTools (F12)
2. Network tab → throttle to "Offline"
3. Click Logout button
4. Wait 5 seconds
5. Expected: Page remains responsive (doesn't hang)
6. Restore network connection
7. Result: ✅ PASS or ❌ FAIL
```

- [ ] Test Case 5 PASSED

### Test Case 6: Console Error Check ✅
```
1. Open all 4 domains while logged in:
   - https://app.seekhowithrua.com
   - https://lms.seekhowithrua.com
   - https://gaming.seekhowithrua.com
   - https://animation.seekhowithrua.com
2. Open DevTools Console (F12 → Console tab)
3. Check for RED error messages
4. Expected: No red errors (warnings are OK)
5. Result: ✅ PASS (no errors) or ❌ FAIL (has errors)
```

- [ ] Test Case 6 PASSED (or note specific errors below)

Errors found (if any):
```
[PASTE ANY ERROR MESSAGES HERE]
```

### Test Case 7: Credentials Verification ✅
```
1. Open DevTools (F12 → Console)
2. Run this command:
   localStorage.getItem('cosmos_token')
3. Expected: Returns a token (JWT string)
4. Token should NOT contain:
   - "password"
   - "email@password"
   - "Drunken"
5. Result: ✅ PASS or ❌ FAIL
```

- [ ] Test Case 7 PASSED

---

## PHASE 4: SECURITY VERIFICATION (5 minutes)

### Code Credential Check
```bash
# In project root:
grep -r "password" backend/settings.py
grep -r "Drunken" backend/
grep -r "email@" backend/
```

- [ ] NO credentials found in code ✅

### Git Repo Check
```bash
git log --all --full-history -- "*settings.py"
```

- [ ] No password commits in history (or all reverted)

### Environment Variable Validation
```bash
echo $DB_PASSWORD
echo $EMAIL_HOST_PASSWORD
```

- [ ] Variables are set on deployment platform ✅

---

## PHASE 5: FINAL VERIFICATION (5 minutes)

### User Journey Simulation
- [ ] **Scenario A**: New user can register
- [ ] **Scenario B**: User can login with email/password
- [ ] **Scenario C**: User can use Google login
- [ ] **Scenario D**: User can access LMS after login
- [ ] **Scenario E**: User can access Gaming after login
- [ ] **Scenario F**: User can logout from any domain
- [ ] **Scenario G**: Logged-out user cannot access protected pages

### Mobile Browser Test
```
Open on:
- [ ] iPhone Safari
- [ ] Android Chrome
```

Test that login works on mobile.

- [ ] Mobile testing PASSED

### Domain SSL Certificate Check
```
https://app.seekhowithrua.com
https://api.seekhowithrua.com
https://lms.seekhowithrua.com
```

- [ ] All sites show 🔒 (padlock icon)
- [ ] No certificate warnings

---

## PHASE 6: SIGN-OFF

### Overall Assessment

**All Critical Tests**: ✅ PASSED / ❌ FAILED

**Critical Issues Found**: 
```
[LIST ANY ISSUES HERE]
```

**High Priority Issues Found**:
```
[LIST ANY ISSUES HERE]
```

**Minor Issues Found**:
```
[LIST ANY ISSUES HERE]
```

### Deployment Status
- [ ] Code tested and verified
- [ ] All tests PASSED (7/7)
- [ ] No critical errors in console
- [ ] No credentials exposed
- [ ] Ready for client submission

---

## IF TESTS FAIL

### Common Issues & Fixes

**Issue: Login doesn't work**
- Check: Is `cosmos_token` in localStorage?
- Check: Is API URL correct (.env.production)?
- Check: Are environment variables set on deployment?
- Fix: Rebuild frontend (`npm run build`)

**Issue: Cross-domain login fails**
- Check: TOKEN_KEY matches (`cosmos_token`)
- Check: Cookie domain set in settings.py
- Fix: Clear browser cookies and try again

**Issue: Page hangs on logout**
- Check: Network timeout is enabled (5 seconds)
- Check: API is reachable
- Fix: Check deployment platform status

**Issue: Console errors**
- Copy exact error message
- Check TESTING_AUDIT_REPORT.md for solutions
- If not found, contact support with error message

---

## FINAL SUBMISSION MESSAGE

✅ **Ready to submit when:**
1. All 7 tests PASSED
2. No console errors
3. Environment variables set
4. Code verified (no credentials)

❌ **DO NOT SUBMIT if:**
- Any test FAILED
- Red console errors visible
- Credentials found in code
- Network issues prevent login

---

**Checklist Completed**: Date: ___________  
**Tested By**: ___________  
**Status**: ✅ READY / ⚠️ ISSUES FOUND

**Notes**:
```
[Add any additional notes here]
```

---

**Next Step**: Once all tests pass, you can confidently submit the product to your client! 🚀
