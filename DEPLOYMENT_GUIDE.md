# LMS Deployment Guide - Hostinger + Vercel

## Overview
- **Frontend (LMS)**: Hosted on Vercel → `lms.seekhowithrua.com`
- **Backend (Django API)**: Hosted on Render → `django-react-ml-app.onrender.com`
- **Domain**: Managed in Hostinger

---

## STEP 1: Domain Setup in Hostinger

### 1.1 Add Subdomain in Hostinger
1. Login to Hostinger Panel (hPanel)
2. Go to **Domains** → Select `seekhowithrua.com`
3. Click **DNS Zone Editor**
4. Add new DNS record:

| Type | Name | Target/Value | TTL |
|------|------|--------------|-----|
| CNAME | lms | cname.vercel-dns.com | 14400 |

Or use A Record (if Vercel provides IP):
| Type | Name | Target/Value | TTL |
|------|------|--------------|-----|
| A | lms | 76.76.21.21 | 14400 |

> **Note**: Vercel recommends using CNAME for subdomains

### 1.2 SSL Certificate (HTTPS)
1. In Hostinger, go to **SSL** section
2. Click **Force HTTPS** (redirects HTTP to HTTPS)
3. SSL should auto-activate once DNS propagates

---

## STEP 2: Deploy Frontend on Vercel

### 2.1 Prepare Your Code
```bash
cd seekhowithrua-lms

# Create vercel.json config
cat > vercel.json << 'EOF'
{
  "version": 2,
  "name": "seekhowithrua-lms",
  "builds": [
    {
      "src": "**/*.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
EOF

# Push to GitHub
git init
git add .
git commit -m "Initial LMS deployment"
git remote add origin https://github.com/YOUR_USERNAME/seekhowithrua-lms.git
git push -u origin main
```

### 2.2 Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **Add New Project**
4. Import `seekhowithrua-lms` repository
5. Configure:
   - **Framework Preset**: Other (static HTML)
   - **Root Directory**: `./` (default)
   - **Build Command**: (leave empty for static)
   - **Output Directory**: (leave empty)
6. Click **Deploy**

### 2.3 Add Custom Domain in Vercel
1. In Vercel dashboard, select your project
2. Go to **Settings** → **Domains**
3. Add Domain: `lms.seekhowithrua.com`
4. Vercel will show DNS instructions - but you already added CNAME in Hostinger
5. Wait for DNS propagation (5-30 minutes)
6. Domain status will show **Valid Configuration**

### 2.4 Enable SSL (HTTPS) on Vercel
1. Vercel auto-provides SSL via Let's Encrypt
2. In Project Settings → **Domains**
3. Enable **SSL Certificate** (should be auto-enabled)

---

## STEP 3: Backend Already Deployed

Your Django backend is already on Render:
- **URL**: `https://django-react-ml-app.onrender.com`
- **API**: `https://django-react-ml-app.onrender.com/api/lms/`

No changes needed here!

---

## STEP 4: Update API URLs in Frontend

Edit `seekhowithrua-lms/js/lms.js`:
```javascript
// Change this line at the top of lms.js
const API_BASE_URL = 'https://django-react-ml-app.onrender.com/api/lms';
```

Also update `seekhowithrua-lms/course.html` and other pages if they have hardcoded URLs.

---

## STEP 5: Verify Deployment

### Checklist:
- [ ] `https://lms.seekhowithrua.com` loads without errors
- [ ] SSL certificate is valid (green lock in browser)
- [ ] API calls work (check browser Network tab)
- [ ] Videos load from YouTube
- [ ] LocalStorage works for progress tracking

---

## DNS Troubleshooting

### If domain doesn't work:
1. Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
   - Enter: `lms.seekhowithrua.com`
   - Select: CNAME or A record
   - Wait for global propagation

2. Flush DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo killall -HUP mDNSResponder
   ```

3. Check Vercel domain status in dashboard

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Hostinger Domain | ₹199-599/year |
| Vercel (Static) | FREE |
| Render (Backend) | FREE tier ($0) |
| **Total** | **~₹20-50/month** |

---

## Quick Commands Summary

```bash
# 1. Push code to GitHub
cd seekhowithrua-lms
git add .
git commit -m "Ready for deployment"
git push

# 2. Deploy to Vercel (via web UI)
# - Import from GitHub
# - Add domain lms.seekhowithrua.com
# - Done!

# 3. Check deployment
curl -I https://lms.seekhowithrua.com
```

---

## Support Contacts

- **Vercel Help**: [vercel.com/support](https://vercel.com/support)
- **Hostinger Support**: hPanel → Help Center
- **Render Support**: [render.com/docs](https://render.com/docs)

---

**Ready to deploy!** 🚀
