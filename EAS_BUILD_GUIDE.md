# 🚀 BUILD APK WITH EAS (Updated Guide)
## Expo's New Build System

The old `expo build:android` command is deprecated. You now need to use **EAS Build** (Expo Application Services).

---

## 📋 OPTION 1: QUICK APK BUILD (Recommended)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo Account
```bash
eas login
```
*You'll be asked for your email and password (create free account if needed)*

### Step 3: Configure EAS (One-time setup)
```bash
cd seekhowithrua-mobile
eas build:configure
```
*Press Enter for default when asked*

### Step 4: Build APK
```bash
eas build --platform android --local
```

This will:
- ✅ Build APK locally on your machine
- ✅ Don't need Expo servers
- ✅ Take 10-15 minutes
- ✅ Save to `dist/` folder

**After build completes**, you'll have:
- ✅ APK file ready
- ✅ Can upload directly to Indus

---

## 📋 OPTION 2: FASTER BUILD (Uses Expo Cloud)

If local build is slow, use Expo's servers:

```bash
cd seekhowithrua-mobile
eas build --platform android
```

This will:
- Build on Expo's servers (faster)
- Email download link when done
- Takes 10-15 minutes

---

## 📋 OPTION 3: DEVELOPMENT APK (Fastest)

If you just want to test on device:

```bash
cd seekhowithrua-mobile
eas build --platform android --profile preview
```

Much faster build for testing.

---

## ✅ QUICK STEP-BY-STEP

### 1. Install EAS (one-time)
```bash
npm install -g eas-cli
```

### 2. Navigate to app folder
```bash
cd seekhowithrua-mobile
```

### 3. Login to Expo
```bash
eas login
```
*(Create free account if you don't have one)*

### 4. Configure (one-time)
```bash
eas build:configure
```

### 5. Build APK
```bash
eas build --platform android --local
```

### 6. Wait 10-15 minutes ⏳

### 7. Get APK from `dist/` folder ✅

---

## 🎯 RECOMMENDED: Option 1 (Local Build)

**Why local build?**
- ✅ Fastest (no upload)
- ✅ Free (no Expo credits needed)
- ✅ Offline capable
- ✅ Full control

**Command:**
```bash
cd seekhowithrua-mobile
eas login
eas build:configure
eas build --platform android --local
```

---

## 🆘 IF YOU DON'T HAVE EXPO ACCOUNT

### Create Free Expo Account
1. Go to: https://expo.dev/
2. Click "Sign up"
3. Enter email and password
4. Verify email
5. Use same credentials in `eas login`

---

## ❓ COMMON ISSUES

### Issue: "eas: command not found"
**Fix**: Reinstall EAS CLI
```bash
npm install -g eas-cli
```

### Issue: "Not authenticated"
**Fix**: Login again
```bash
eas logout
eas login
```

### Issue: Build takes too long
**Fix**: Use `--local` flag for faster build
```bash
eas build --platform android --local
```

### Issue: "No valid iOS credentials"
**Fix**: Ignore, we're building Android only
```bash
eas build --platform android --local
```

---

## 📍 WHERE IS MY APK?

After successful build:

**Local Build:**
```
seekhowithrua-mobile/dist/your-app.apk
```

**Cloud Build:**
- Check your email (download link)
- Or check Expo Dashboard: https://expo.dev/

---

## 📥 DOWNLOAD APK

### From Local Build
```bash
# Navigate to dist folder
cd seekhowithrua-mobile/dist
ls *.apk    # See your APK file
```

### From Email
Expo sends download link via email when cloud build completes.

---

## ✅ READY FOR INDUS?

Once you have APK:
1. ✅ APK ready
2. ✅ Follow: `INDUS_APP_STORE_UPLOAD_GUIDE.md`
3. ✅ Start from Step 2 (Register Indus)
4. ✅ Upload APK to Indus

---

## 🚀 FULL COMMAND FOR YOU TO COPY

```bash
npm install -g eas-cli
cd seekhowithrua-mobile
eas login
eas build:configure
eas build --platform android --local
```

That's it! Follow these commands in order.

---

**Time needed:** ~20 minutes total  
**Result**: APK ready for Indus App Store
