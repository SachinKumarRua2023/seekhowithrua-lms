# SEEKHOWITHRUA — MASTER TECHNICAL DOCUMENTATION
# Last Updated: March 22, 2026
# Author: Built with Claude (Anthropic)
# Status: LIVE IN PRODUCTION

---

## TABLE OF CONTENTS

1. Project Overview
2. Architecture Diagram
3. Live URLs & Domains
4. Tech Stack
5. Repository Structure
6. Backend — Django (Complete)
7. Frontend — React/Vite (Complete)
8. SEO Site — Next.js (Complete)
9. Database — Supabase PostgreSQL
10. Infrastructure — Render + Vercel
11. Authentication System
12. Voice Rooms System (VCRoom)
13. AI/ML Recommendation Engine
14. WebSocket / Real-Time System
15. Security Configuration
16. Environment Variables (All)
17. API Endpoints (Complete Reference)
18. Deployment Guide
19. Challenges Faced + Solutions
20. What Still Needs To Be Done
21. Next Session Order

---

## 1. PROJECT OVERVIEW

SeekhoWithRua is an EdTech platform built by Master Rua (Sachin Kumar).
It combines animated 3D course content, a live voice room panel system
(like Clubhouse), an AI recommendation engine, and a leaderboard/ranking
system for speakers.

Core pillars:
- Animated course content (Three.js + GSAP) for 8 tech subjects
- COSMOS Voice Chat Rooms — live audio panels with P2P WebRTC
- YouTube-style panel recommendation engine (6 signals)
- Follow/Upvote/Leaderboard ranking for speakers
- Google OAuth + email/password authentication
- SEO-optimised Next.js site targeting India EdTech keywords

---

## 2. ARCHITECTURE DIAGRAM

```
User Browser
     │
     ├── app.seekhowithrua.com (Vercel)
     │       React + Vite
     │       LoginSignupLogout.jsx
     │       VCRoom.jsx (COSMOS Voice)
     │       PeerJS WebRTC P2P Audio
     │
     ├── seekhowithrua.com (Vercel)
     │       Next.js SEO Site
     │       23 pages, 192 URLs indexed
     │
     └── api.seekhowithrua.com (Render)
             Django 6.0.2
             Daphne ASGI Server
             Django Channels WebSocket
             REST Framework API
             │
             └── Supabase PostgreSQL
                     aws-1-ap-southeast-2
                     Transaction Pooler :6543
```

P2P Audio Flow:
```
Host creates panel → PeerJS peer opens → peer_id saved to DB
Listener joins → gets host peer_id from API → PeerJS connects directly
Audio flows Host ↔ Listener (P2P, no server relay)
Signaling only goes through PeerJS free cloud (0.peerjs.com:443)
```

---

## 3. LIVE URLS & DOMAINS

| Service              | URL                                    | Platform |
|----------------------|----------------------------------------|----------|
| React Frontend       | https://app.seekhowithrua.com          | Vercel   |
| Django Backend API   | https://api.seekhowithrua.com          | Render   |
| SEO Next.js Site     | https://seekhowithrua.com              | Vercel   |
| Django Admin         | https://api.seekhowithrua.com/admin/   | Render   |
| GitHub Repo          | https://github.com/SachinKumarRua2023/django-react-ml-app | GitHub |
| Supabase Dashboard   | https://supabase.com/dashboard/project/vhkiwztuyypdtvduapqf | Supabase |

WebSocket URLs:
```
wss://api.seekhowithrua.com/ws/voice/panel/<panel_id>/
wss://api.seekhowithrua.com/ws/notifications/<user_id>/
```

---

## 4. TECH STACK

### Backend
| Technology              | Version  | Purpose                          |
|-------------------------|----------|----------------------------------|
| Django                  | 6.0.2    | Web framework                    |
| Django REST Framework   | 3.16.1   | API layer                        |
| Django Channels         | 4.3.2    | WebSocket support                |
| Daphne                  | 4.2.1    | ASGI server (HTTP + WebSocket)   |
| psycopg2-binary         | 2.9.11   | PostgreSQL adapter               |
| google-auth             | 2.49.1   | Google OAuth token verification  |
| google-auth-httplib2    | 0.3.0    | Google auth HTTP transport       |
| django-cors-headers     | 4.9.0    | CORS handling                    |
| whitenoise              | 6.11.0   | Static files serving             |
| gunicorn                | 25.1.0   | WSGI fallback (not in use)       |
| dj-database-url         | 3.1.1    | Database URL parsing             |
| scikit-learn            | 1.8.0    | ML recommendation engine         |
| pandas                  | 3.0.1    | Data processing                  |
| numpy                   | 2.4.2    | Numerical operations             |

### Frontend (React App)
| Technology    | Version | Purpose                         |
|---------------|---------|---------------------------------|
| React         | 18+     | UI framework                    |
| Vite          | 5+      | Build tool                      |
| Axios         | 1+      | HTTP client                     |
| React Router  | 6+      | Client-side routing             |
| PeerJS        | 1.5.4   | WebRTC P2P (loaded from CDN)    |

### SEO Site
| Technology    | Version | Purpose                         |
|---------------|---------|---------------------------------|
| Next.js       | 14+     | SSG/SSR for SEO                 |
| TypeScript    | 5+      | Type safety                     |
| Tailwind CSS  | 3+      | Styling                         |

### Infrastructure
| Service       | Plan    | Purpose                         |
|---------------|---------|---------------------------------|
| Render        | Free    | Django backend hosting          |
| Vercel        | Hobby   | React + Next.js hosting         |
| Supabase      | Free    | PostgreSQL database             |
| GitHub        | Free    | Source control + CI/CD          |

---

## 5. REPOSITORY STRUCTURE

```
django-react-ml-app/
│
├── backend/                          ← Django project root
│   ├── backend/                      ← Django settings package
│   │   ├── settings.py               ← Main settings (DB, security, apps)
│   │   ├── urls.py                   ← Root URL config
│   │   ├── asgi.py                   ← ASGI config (Daphne + Channels)
│   │   └── wsgi.py                   ← WSGI config (fallback)
│   │
│   ├── users/                        ← User management app
│   │   ├── models.py
│   │   └── urls.py
│   │
│   ├── ml_apps/                      ← ML features app
│   │   ├── models.py
│   │   └── urls.py
│   │
│   ├── livevc/                       ← Voice chat core app
│   │   ├── models.py                 ← UserProfile, VoicePanel, PanelMember
│   │   ├── views.py                  ← All API views
│   │   ├── urls.py                   ← URL patterns
│   │   ├── routing.py                ← WebSocket URL patterns
│   │   ├── consumers.py              ← WebSocket consumers
│   │   ├── serializers.py            ← DRF serializers
│   │   └── google_auth.py            ← Google OAuth verification
│   │
│   ├── voice_rooms/                  ← Rankings/social features app
│   │   ├── models.py                 ← 7 ranking models
│   │   ├── views.py                  ← VCR API views
│   │   ├── urls.py                   ← VCR URL patterns
│   │   ├── consumers.py              ← NotificationConsumer WebSocket
│   │   └── recommendation.py        ← AI recommendation engine
│   │
│   ├── requirements.txt              ← Python dependencies
│   └── manage.py
│
├── frontend/                         ← React/Vite app
│   ├── src/
│   │   ├── App.jsx                   ← Root component, TOKEN_KEY export
│   │   ├── components/
│   │   │   ├── VCRoom.jsx            ← COSMOS voice room (main feature)
│   │   │   ├── LoginSignupLogout.jsx ← Auth with Google OAuth
│   │   │   └── Navbar.jsx            ← Navigation
│   │   └── main.jsx
│   ├── .env                          ← VITE_API_URL, VITE_GOOGLE_CLIENT_ID
│   └── package.json
│
├── seekhowithrua-seo/                ← Next.js SEO site
│   ├── app/
│   │   ├── page.tsx                  ← Homepage
│   │   ├── courses/[slug]/           ← Course pages (dynamic)
│   │   ├── blog/[slug]/              ← Blog posts
│   │   └── live-voice-rooms/         ← VCRoom landing page
│   └── package.json
│
└── .github/
    └── workflows/
        └── ci.yml                    ← GitHub Actions CI/CD
```

---

## 6. BACKEND — DJANGO (COMPLETE)

### settings.py Key Configuration

```python
# Database — Supabase Transaction Pooler (IPv4, works on Render free)
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     'postgres',
        'USER':     'postgres.vhkiwztuyypdtvduapqf',
        'PASSWORD': 'Drunken@1234#4321',
        'HOST':     'aws-1-ap-southeast-2.pooler.supabase.com',
        'PORT':     '6543',
        'OPTIONS':  {'sslmode': 'require'},
    }
}

# ASGI — Daphne handles both HTTP and WebSocket
ASGI_APPLICATION = "backend.asgi.application"

# Channels — InMemoryChannelLayer (free tier, no Redis)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# Rate limiting
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '30/min',
        'user': '200/min',
    },
}

# Security
SECURE_SSL_REDIRECT            = False  # Render handles SSL at proxy
SECURE_PROXY_SSL_HEADER        = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE          = not DEBUG
CSRF_COOKIE_SECURE             = not DEBUG
SECURE_HSTS_SECONDS            = 31536000
X_FRAME_OPTIONS                = 'DENY'
```

### asgi.py

```python
import os
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.db import database_sync_to_async
import livevc.routing

# TokenAuthMiddleware extracts token from WebSocket query string
# ws://api.../ws/voice/panel/123/?token=abc123

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": TokenAuthMiddleware(
        URLRouter(livevc.routing.websocket_urlpatterns)
    ),
})
```

### livevc/models.py — Core Models

```python
class UserProfile(models.Model):
    user       = models.OneToOneField(User, related_name='profile')
    role       = models.CharField(choices=[('trainer','trainer'),('learner','learner')])
    is_premium = models.BooleanField(default=False)
    avatar_url = models.URLField(blank=True)
    google_id  = models.CharField(max_length=100, blank=True)

class VoicePanel(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title       = models.CharField(max_length=200)
    topic       = models.CharField(choices=TOPIC_CHOICES)
    host        = models.ForeignKey(User, related_name='hosted_panels')
    peer_id     = models.CharField(max_length=200, blank=True)  # PeerJS peer ID
    is_active   = models.BooleanField(default=True)
    max_members = models.IntegerField(default=4)
    created_at  = models.DateTimeField(auto_now_add=True)

class PanelMember(models.Model):
    panel          = models.ForeignKey(VoicePanel, related_name='members')
    user           = models.ForeignKey(User)
    role           = models.CharField(choices=[('host','host'),('co_host','co_host'),
                                               ('speaker','speaker'),('listener','listener')])
    is_muted       = models.BooleanField(default=False)
    is_hand_raised = models.BooleanField(default=False)
```

### voice_rooms/models.py — Ranking Models

```python
class VoiceRoomProfile(models.Model):
    # related_name='vcr_profile' (separate from livevc UserProfile)
    user           = models.OneToOneField(User, related_name='vcr_profile')
    college        = models.CharField(max_length=200, blank=True)
    current_course = models.CharField(max_length=100, blank=True)
    interests      = models.JSONField(default=list)
    skill_tags     = models.JSONField(default=list)
    onboarded      = models.BooleanField(default=False)

class PanelSession(models.Model):
    # Records how long each user stays in a panel
    # Used for ranking: time_minutes × 1 point
    user           = models.ForeignKey(User)
    panel_id       = models.CharField(max_length=100)
    panel_title    = models.CharField(max_length=200)
    role           = models.CharField(max_length=50)
    joined_at      = models.DateTimeField(auto_now_add=True)
    left_at        = models.DateTimeField(null=True)
    duration_minutes = models.FloatField(default=0)

    def close_session(self):
        # Called on leave_panel — calculates duration + recalculates rank
        self.left_at = timezone.now()
        delta = self.left_at - self.joined_at
        self.duration_minutes = delta.total_seconds() / 60
        self.save()
        UserRankScore.recalculate(self.user)

class UserPanelHistory(models.Model):
    # Tracks unique panels per user for co-occurrence
    user     = models.ForeignKey(User)
    panel_id = models.CharField(max_length=100)
    class Meta:
        unique_together = ('user', 'panel_id')

class PanelCoOccurrence(models.Model):
    # YouTube-style: users who joined panel_a also joined panel_b
    panel_a_id    = models.CharField(max_length=100)
    panel_b_id    = models.CharField(max_length=100)
    co_join_count = models.IntegerField(default=1)

    @classmethod
    def record_join(cls, user, new_panel_id):
        # When user joins new panel, increment co-occurrence
        # with all panels they previously joined
        past_panels = UserPanelHistory.objects.filter(
            user=user
        ).exclude(panel_id=new_panel_id).values_list('panel_id', flat=True)
        for past_id in past_panels:
            obj, created = cls.objects.get_or_create(
                panel_a_id=min(past_id, new_panel_id),
                panel_b_id=max(past_id, new_panel_id),
            )
            if not created:
                obj.co_join_count += 1
                obj.save()

class Follow(models.Model):
    from_user = models.ForeignKey(User, related_name='vcr_following')
    to_user   = models.ForeignKey(User, related_name='vcr_followers')

class Upvote(models.Model):
    from_user = models.ForeignKey(User, related_name='vcr_upvotes_given')
    to_user   = models.ForeignKey(User, related_name='vcr_upvotes_received')
    panel_id  = models.CharField(max_length=100)
    class Meta:
        unique_together = ('from_user', 'to_user', 'panel_id')

class UserRankScore(models.Model):
    # RANKING FORMULA: (time_minutes × 1) + (upvotes × 3) + (followers × 2)
    user            = models.OneToOneField(User, related_name='rank_score')
    total_score     = models.FloatField(default=0)
    time_minutes    = models.FloatField(default=0)
    upvotes_received = models.IntegerField(default=0)
    followers_count  = models.IntegerField(default=0)

    @classmethod
    def recalculate(cls, user):
        time_mins  = PanelSession.objects.filter(user=user).aggregate(
                         total=models.Sum('duration_minutes'))['total'] or 0
        upvotes    = Upvote.objects.filter(to_user=user).count()
        followers  = Follow.objects.filter(to_user=user).count()
        score      = (time_mins * 1) + (upvotes * 3) + (followers * 2)
        obj, _     = cls.objects.get_or_create(user=user)
        obj.total_score      = score
        obj.time_minutes     = time_mins
        obj.upvotes_received = upvotes
        obj.followers_count  = followers
        obj.save()
```

---

## 7. FRONTEND — REACT/VITE (COMPLETE)

### App.jsx

```javascript
export const TOKEN_KEY = 'cosmos_token'
// Token stored in localStorage as 'cosmos_token'
// All API calls use: Authorization: Token <cosmos_token>
```

### VCRoom.jsx — Architecture

```
COSMOS Voice Room (single file component ~2000 lines)

State:
  user          — from /api/profile/ on mount
  screen        — 'rooms' | 'panel'
  panelInfo     — current active panel
  participants  — array of { id, name, role, peerId, muted, handRaised }
  messages      — chat messages array
  myRole        — 'host' | 'cohost' | 'speaker' | 'listener'
  rooms         — panel list from /api/panels/
  recRows       — { because_your_course, others_also_joined, trending_now }
  followedIds   — Set of followed user IDs
  onboarded     — boolean from /api/vcr/profile/

Refs:
  myPeer        — PeerJS Peer instance
  myStream      — MediaStream (microphone)
  dataConns     — { peerId: DataConnection } for chat/signaling
  callConns     — { peerId: MediaConnection } for audio
  analyserRefs  — { peerId: { analyser, ctx } } for speaking detection

Key Functions:
  loadPanels()          — fetches /api/panels/ → YouTube rows or flat list
  handleCreatePanel()   — creates panel, opens PeerJS peer, saves peer_id
  joinPanelById(id)     — joins panel, gets host peer_id, connects via PeerJS
  setupDataConn(conn)   — sets up data channel for chat + signaling
  handleMessage(data)   — processes: room_state, announce, chat, raise_hand,
                           speak_approved, assign_cohost, force_mute, kick,
                           room_ended, participants_update
  startMic()            — getUserMedia({ audio: true })
  callPeer(peerId)       — myPeer.call(peerId, myStream)
  monitorSpeaking()     — Web Audio API analyser for speaking animation
  toggleMute()          — enables/disables audio track
  toggleHand()          — raise/lower hand via API + broadcast
  endPanel()            — host ends panel, broadcasts room_ended
  leavePanel()          — calls /api/panels/<id>/leave/, cleanup()
  handleFollow()        — POST /api/vcr/follow/<id>/
  handleUpvote()        — POST /api/vcr/upvote/
  handleGoogleLogin()   — POST /api/auth/google/verify/
  handleOnboardingComplete() — POST /api/vcr/onboarding/

WebSocket (useVCRNotifications hook):
  URL: wss://api.seekhowithrua.com/ws/notifications/<userId>/
  Events received:
    panel_created    → show popup "Host X created a new panel"
    new_follower     → show popup "Someone followed you"
  Keepalive ping every 30s

P2P Signal Flow:
  Host:
    1. POST /api/panels/create/ → get panel UUID
    2. new Peer(peerId, PEER_CONFIG) → peer.on('open')
    3. POST /api/panels/<id>/update-peer/ with peer_id
    4. peer.on('connection') → setupDataConn → send room_state
    5. peer.on('call') → call.answer(myStream) → attachAudio

  Listener:
    1. POST /api/panels/<id>/join/ → get host_peer_id
    2. new Peer(myPeerId, PEER_CONFIG) → peer.on('open')
    3. peer.connect(hostPeerId) → conn.on('open') → send announce
    4. peer.on('call') → call.answer(myStream) → attachAudio

PeerJS Config:
  host: '0.peerjs.com', port: 443, secure: true
  ICE servers: stun:stun.l.google.com:19302 (x3)
```

### LoginSignupLogout.jsx — Auth Flow

```javascript
// Email/Password Login
POST /api/login/ { email, password }
→ returns { token, user }
→ localStorage.setItem('cosmos_token', token)
→ navigate('/live-voice')

// Email/Password Register
POST /api/register/ { email, password, confirm_password,
                      first_name, last_name, role }
→ returns { token, user }
→ same storage + navigate

// Google OAuth Login
1. Load script: https://accounts.google.com/gsi/client
2. window.google.accounts.id.initialize({
     client_id: VITE_GOOGLE_CLIENT_ID,
     callback: (response) => handleGoogleLogin(response.credential)
   })
3. POST /api/auth/google/verify/ { token: googleCredential, role }
→ backend verifies JWT → creates/finds user → returns { token, user }
→ same storage + navigate

// Logout
POST /api/logout/
→ deletes server-side token
→ localStorage.removeItem('cosmos_token')
→ navigate('/login')
```

---

## 8. SEO SITE — NEXT.JS

Repository: seekhowithrua-seo/ (separate Vercel project)
Live URL: https://seekhowithrua.com

Pages built:
- / (homepage)
- /courses (course listing)
- /courses/[slug] (individual course — 8 courses)
- /courses/[slug]/[chapter] (chapter pages — 170+ pages)
- /blog/[slug] (5 blog posts published)
- /live-voice-rooms (VCRoom landing)
- /animation-lab (3D animation lab landing)
- /master-rua (trainer profile)
- /hire-rua (hiring page)

SEO Status (as of March 22, 2026):
- Google Search Console: 192 URLs indexed
- 9 URLs pending indexing (daily limit hit)
- Target keywords: "animated AI course India", "live voice classroom India"

---

## 9. DATABASE — SUPABASE POSTGRESQL

Project ID: vhkiwztuyypdtvduapqf
Region: Sydney (ap-southeast-2)
Plan: Free tier (500MB, no expiry unlike Render)

Connection Details:
```
Host:     aws-1-ap-southeast-2.pooler.supabase.com
Port:     6543  (Transaction Pooler — IPv4 compatible)
Database: postgres
User:     postgres.vhkiwztuyypdtvduapqf
Password: Drunken@1234#4321
SSL:      require
```

IMPORTANT: Use Transaction Pooler (port 6543), NOT Direct URL (port 5432).
Direct URL uses IPv6 which Render free tier does not support.

Tables (all migrated):

livevc app:
- livevc_userprofile       (role, is_premium, avatar_url, google_id)
- livevc_voicepanel        (UUID PK, title, topic, host, peer_id, is_active)
- livevc_panelmember       (panel, user, role, is_muted, is_hand_raised)
- livevc_handraiserequest  (legacy)

voice_rooms app:
- voice_rooms_voiceroomprofile   (college, current_course, interests, onboarded)
- voice_rooms_panelsession       (user, panel_id, joined_at, left_at, duration_minutes)
- voice_rooms_userpanelhistory   (user, panel_id — unique together)
- voice_rooms_panelcooccurrence  (panel_a_id, panel_b_id, co_join_count)
- voice_rooms_follow             (from_user, to_user)
- voice_rooms_upvote             (from_user, to_user, panel_id — unique together)
- voice_rooms_userrankscore      (total_score, time_minutes, upvotes_received, followers_count)

auth/users (Django default):
- auth_user
- auth_token (REST framework token auth)
- django_migrations
- django_session

---

## 10. INFRASTRUCTURE

### Render (Backend)
Service Name: django-react-ml-app
Service ID: srv-d6b4pv14tr6s73c7me4g
Region: Oregon
Runtime: Python 3.14.3
Plan: Free (spins down after 15min inactivity — 50s cold start)

Build Command:
```
backend/ $ pip install -r requirements.txt
```

Start Command:
```
daphne -b 0.0.0.0 -p 10000 --root-path /opt/render/project/src/backend backend.asgi:application
```

Auto-Deploy: On Commit to main branch

### Vercel (Frontend)
Project: django-react-ml-app
Framework: Vite
Root: frontend/
Build: npm run build
Output: dist/

### GitHub
Repo: https://github.com/SachinKumarRua2023/django-react-ml-app
Branch strategy: push directly to main (CI/CD runs on push)
CI/CD: .github/workflows/ci.yml
  - Job 1: Django system check
  - Job 2: React npm build

---

## 11. AUTHENTICATION SYSTEM

### Token Authentication
- Django REST Framework TokenAuthentication
- Token stored in DB table: authtoken_token
- Frontend stores as: localStorage.getItem('cosmos_token')
- All API requests: Authorization: Token <key>

### Email/Password Auth
- Custom registration with password strength validation
  (min 8 chars, uppercase, lowercase, digit)
- Login by email (not username) — backend looks up User by email
- Password stored as Django PBKDF2 hash

### Google OAuth
Flow:
1. Frontend loads Google GSI script
2. window.google.accounts.id.initialize() with VITE_GOOGLE_CLIENT_ID
3. User clicks button → Google popup → credential (JWT) returned
4. Frontend POSTs JWT to /api/auth/google/verify/
5. Backend: google_auth.py → verify_google_token() → get_or_create_google_user()
6. New users get role='learner' by default
7. Returns Django token → frontend stores same as email auth

google_auth.py verification:
- Primary: google.oauth2.id_token.verify_oauth2_token() with 60s clock skew
- Fallback: manual JWT base64 decode + audience validation
  (needed because Render free tier HTTP calls to Google may timeout)

### Role System
- trainer: can create panels (max 10 active), host voice rooms
- learner: can join panels, raise hand, get promoted to speaker
- Upgrade: POST /api/upgrade-to-trainer/ → changes role to trainer

### Admin
- Superuser: seekhowithrua@gmail.com
- Admin URL: https://api.seekhowithrua.com/admin/
- App check (master): user.email === 'master@gmail.com'

---

## 12. VOICE ROOMS SYSTEM (VCROOM)

### Panel Lifecycle

```
CREATE (trainer only):
  POST /api/panels/create/ { title, topic, max_members }
  → VoicePanel created with UUID
  → PanelMember created (host as co_host role)
  → WebSocket notification sent to all followers
  → Frontend: PeerJS peer opens → POST /api/panels/<id>/update-peer/

JOIN (any user):
  POST /api/panels/<id>/join/
  → PanelMember created (listener role)
  → PanelSession created (for time tracking)
  → UserPanelHistory recorded
  → PanelCoOccurrence.record_join() called
  → Returns { host_peer_id } → frontend PeerJS connects to host

LEAVE:
  POST /api/panels/<id>/leave/
  → PanelMember deleted
  → PanelSession.close_session() → calculates duration → recalculates rank
  → If host leaves → panel.is_active = False

END (host only):
  Frontend broadcasts { type: 'room_ended' } to all peers
  → POST /api/panels/<id>/leave/
  → panel.is_active = False
```

### Role Promotion Flow

```
Listener raises hand → POST /api/panels/<id>/raise-hand/
Host sees ✋ badge on listener chip
Host clicks ⬆ → POST /api/panels/<id>/promote/<user_id>/
                → sends { type: 'speak_approved' } via DataChannel
Listener receives → role becomes 'speaker' → mic starts → calls host
```

### Speaker Limits
- Max co-hosts: 2
- Max speakers: 3
- Max panels per trainer: 10

### P2P Data Channel Messages

```javascript
// Host → All (broadcast)
{ type: 'room_state', panel, participants }
{ type: 'participants_update', participants }

// Listener → Host
{ type: 'announce', from: { id, name }, backendId, peerId }
{ type: 'raise_hand', from }
{ type: 'lower_hand', from }

// Host → Specific Listener
{ type: 'speak_approved' }
{ type: 'assign_cohost' }
{ type: 'force_mute' }
{ type: 'kick' }

// All → All
{ type: 'chat', from, text, time }
{ type: 'room_ended' }
```

### Ranking Formula

```
SCORE = (time_in_panels_minutes × 1)
      + (upvotes_received × 3)
      + (followers_count × 2)

Recalculated on:
  - leave_panel (time contribution)
  - upvote received
  - follow received
```

### Leaderboard

```
GET /api/vcr/leaderboard/?type=overall
  → top 50 users by score globally

GET /api/vcr/leaderboard/?type=college&college=<name>
  → top 50 users from same college

Response: { leaderboard: [...], my_rank: { rank, score } }
```

---

## 13. AI/ML RECOMMENDATION ENGINE

File: voice_rooms/recommendation.py
Called by: livevc/views.py list_panels()

### 6 Scoring Signals

```python
Signal 1: Course Match (+50 points)
  user.vcr_profile.current_course matches panel topic
  TOPIC_TO_COURSE mapping: 'data-science-course' → 'data_science'

Signal 2: Interest Match (+30 points)
  user.vcr_profile.interests intersects with TOPIC_TO_INTEREST mapping

Signal 3: Co-Occurrence (+40 points max)
  PanelCoOccurrence.objects.filter(panel_a_id=panel.id)
  → panels that users who joined this panel also joined get boost

Signal 4: Panel Quality (+15 points)
  Based on average session duration of past members

Signal 5: Trending (+10 points)
  Based on current member_count

Signal 6: Freshness Decay (-0.5 points per hour)
  Older panels get progressively buried

Already-seen panels: -100 points (UserPanelHistory lookup)
```

### Response Format

```json
{
  "because_your_course": [...panels],
  "others_also_joined":  [...panels],
  "trending_now":        [...panels],
  "all_ranked":          [...panels],
  "labels": {
    "because_your_course": "Because you study Data Science",
    "others_also_joined":  "Others who joined this also joined",
    "trending_now":        "Trending now"
  }
}
```

Fallback: if recommendation engine throws exception, returns flat list
via all_ranked key.

---

## 14. WEBSOCKET / REAL-TIME SYSTEM

### Routing (livevc/routing.py)

```python
websocket_urlpatterns = [
    re_path(r'ws/voice/panel/(?P<panel_id>[^/]+)/?$',
            consumers.VoicePanelConsumer.as_asgi()),
    re_path(r'ws/notifications/(?P<user_id>\d+)/?$',
            NotificationConsumer.as_asgi()),
]
```

### VoicePanelConsumer
- Handles panel-level chat + signaling
- Group name: panel_{panel_id}

### NotificationConsumer (voice_rooms/consumers.py)
- Handles user-level notifications
- Group name: notifications_{user_id}
- Events sent to user:
  - panel_created: a host they follow created a panel
  - new_follower: someone followed them

### Who sends WebSocket messages

```python
# When host creates panel → notify all followers
channel_layer = get_channel_layer()
async_to_sync(channel_layer.group_send)(
    f'notifications_{follow.from_user.id}',
    { 'type': 'panel_created', 'data': { ... } }
)
```

### Frontend WebSocket hook

```javascript
function useVCRNotifications(userId, push, onPanelCreated) {
  // Connects to wss://api.seekhowithrua.com/ws/notifications/<userId>/
  // Sends ping every 30s to prevent Render free tier sleep
  // On panel_created → shows popup + refreshes panel list
  // On new_follower → shows gold popup
}
```

---

## 15. SECURITY CONFIGURATION

### settings.py security block

```python
SECURE_SSL_REDIRECT            = False  # Render proxy handles SSL
SECURE_PROXY_SSL_HEADER        = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE          = not DEBUG  # True when DEBUG=False
CSRF_COOKIE_SECURE             = not DEBUG
SESSION_COOKIE_HTTPONLY        = True
CSRF_COOKIE_HTTPONLY           = True
SESSION_COOKIE_SAMESITE        = 'Lax'
CSRF_COOKIE_SAMESITE           = 'Lax'
SECURE_HSTS_SECONDS            = 31536000   # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True
SECURE_BROWSER_XSS_FILTER      = True
SECURE_CONTENT_TYPE_NOSNIFF    = True
X_FRAME_OPTIONS                = 'DENY'
```

### Rate Limiting
- Anonymous: 30 requests/minute
- Authenticated: 200 requests/minute
- Applies to all DRF endpoints

### CORS
```python
CORS_ALLOW_ALL_ORIGINS = True  # TODO: restrict before public launch
CORS_ALLOWED_ORIGINS = [
    'https://app.seekhowithrua.com',
    'https://seekhowithrua.com',
    'http://localhost:5173',
]
```

### TODO Before Public Launch
1. Set DEBUG = False
2. Move SECRET_KEY to Render env var (generate new random key)
3. Remove '*' from ALLOWED_HOSTS
4. Set CORS_ALLOW_ALL_ORIGINS = False
5. Remove hardcoded DB password — use env vars only

---

## 16. ENVIRONMENT VARIABLES

### Render (Backend) Environment Variables

| Key                      | Value                                               |
|--------------------------|-----------------------------------------------------|
| DATABASE_URL             | postgresql://postgres.vhkiwztuyypdtvduapqf:...      |
| DB_HOST                  | aws-1-ap-southeast-2.pooler.supabase.com            |
| DB_NAME                  | postgres                                            |
| DB_PASSWORD              | Drunken@1234#4321                                   |
| DB_PORT                  | 6543                                                |
| DB_USER                  | postgres.vhkiwztuyypdtvduapqf                       |
| DJANGO_SETTINGS_MODULE   | backend.settings                                    |
| GOOGLE_CLIENT_ID         | <from Google Cloud Console>                         |
| GOOGLE_CLIENT_SECRET     | <from Google Cloud Console>                         |
| PYTHONPATH               | /opt/render/project/src/backend                     |
| RENDER                   | true                                                |
| SECRET_KEY               | django-insecure-9kw!4)...                           |

### Vercel (Frontend) Environment Variables

| Key                   | Value                                    |
|-----------------------|------------------------------------------|
| VITE_API_URL          | https://api.seekhowithrua.com            |
| VITE_GOOGLE_CLIENT_ID | <from Google Cloud Console>              |
| VITE_GROQ_API_KEY     | <Groq API key for AI features>           |

### GitHub Secrets (for CI/CD)

| Key                   | Value                              |
|-----------------------|------------------------------------|
| DB_PASSWORD           | Drunken@1234#4321                  |
| GOOGLE_CLIENT_ID      | <from Google Cloud Console>        |
| VITE_GOOGLE_CLIENT_ID | <from Google Cloud Console>        |

---

## 17. API ENDPOINTS (COMPLETE REFERENCE)

Base URL: https://api.seekhowithrua.com

### Auth Endpoints

| Method | Path                        | Auth     | Description                    |
|--------|-----------------------------|----------|--------------------------------|
| POST   | /api/register/              | None     | Email/password registration    |
| POST   | /api/login/                 | None     | Email/password login           |
| POST   | /api/logout/                | Token    | Logout, delete token           |
| GET    | /api/profile/               | Token    | Get current user profile       |
| PUT    | /api/profile/update/        | Token    | Update profile                 |
| POST   | /api/auth/google/           | None     | Legacy (returns error)         |
| POST   | /api/auth/google/verify/    | None     | Google OAuth token verify      |
| POST   | /api/upgrade-to-trainer/    | Token    | Upgrade learner to trainer     |

### Panel Endpoints

| Method      | Path                                        | Auth  | Description              |
|-------------|---------------------------------------------|-------|--------------------------|
| GET         | /api/panels/                                | Token | List panels (AI ranked)  |
| POST        | /api/panels/create/                         | Token | Create panel (trainer)   |
| POST        | /api/panels/<uuid>/join/                    | Token | Join panel               |
| POST        | /api/panels/<uuid>/leave/                   | Token | Leave panel              |
| GET         | /api/panels/<uuid>/members/                 | Token | Get panel members        |
| POST        | /api/panels/<uuid>/raise-hand/              | Token | Raise hand               |
| POST        | /api/panels/<uuid>/lower-hand/              | Token | Lower hand               |
| POST        | /api/panels/<uuid>/mute-all/                | Token | Host mutes all           |
| POST        | /api/panels/<uuid>/promote/<int:user_id>/   | Token | Promote to speaker       |
| POST        | /api/panels/<uuid>/kick/<int:user_id>/      | Token | Kick member              |
| POST        | /api/panels/<uuid>/update-peer/             | Token | Save PeerJS peer_id      |
| DELETE/POST | /api/panels/<uuid>/delete/                  | Token | Delete panel             |

### VCR (Voice Chat Rankings) Endpoints

| Method | Path                           | Auth  | Description                    |
|--------|--------------------------------|-------|--------------------------------|
| POST   | /api/vcr/follow/<int:user_id>/ | Token | Follow/unfollow user           |
| POST   | /api/vcr/upvote/               | Token | Upvote speaker in panel        |
| GET    | /api/vcr/leaderboard/          | Token | Overall/college leaderboard    |
| POST   | /api/vcr/onboarding/           | Token | Save course/interests/college  |
| GET    | /api/vcr/profile/              | Token | Get VCR profile + onboarded    |

### Register Request Body
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "confirm_password": "Password123",
  "first_name": "Sachin",
  "last_name": "Kumar",
  "role": "learner"
}
```

### Login Response
```json
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "first_name": "Sachin",
    "last_name": "Kumar",
    "profile": {
      "role": "learner",
      "is_premium": false,
      "avatar_url": null
    }
  }
}
```

### Join Panel Response
```json
{
  "panel_id": "uuid-here",
  "title": "AI and Consciousness",
  "host_peer_id": "COSMOS_uuid_userId",
  "host_name": "MasterRua"
}
```

---

## 18. DEPLOYMENT GUIDE

### Deploy Backend Changes

```bash
cd django-react-ml-app

# Make changes to backend/
git add .
git commit -m "your message"
git push origin main

# Render auto-deploys on push
# Watch: dashboard.render.com → django-react-ml-app → Logs
```

### Deploy Frontend Changes

```bash
cd django-react-ml-app

# Make changes to frontend/
git add .
git commit -m "your message"
git push origin main

# Vercel auto-deploys on push
# Watch: vercel.com → django-react-ml-app → Deployments
```

### Run Migrations (if new models added)

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
git add .
git commit -m "feat: add migration for <model>"
git push origin main
```

### Render Start Command

```
daphne -b 0.0.0.0 -p 10000 --root-path /opt/render/project/src/backend backend.asgi:application
```

### Render Build Command

```
backend/ $ pip install -r requirements.txt
```

---

## 19. CHALLENGES FACED + SOLUTIONS

### C1: Supabase wrong pooler region
Error: FATAL: Tenant or user not found
Root cause: HOST was aws-0-ap-southeast-2, correct is aws-1-ap-southeast-2
Fix: Changed HOST to aws-1-ap-southeast-2.pooler.supabase.com

### C2: Render free tier blocks IPv6
Error: Network is unreachable (2406:da1c:... IPv6 address)
Root cause: Supabase Direct URL (port 5432) uses IPv6
Fix: Switched to Transaction Pooler (port 6543) — uses IPv4

### C3: @ in password broke DATABASE_URL
Error: Still getting Tenant or user not found
Root cause: Drunken@1234#4321 — @ sign splits URL parser
Fix: Used individual DB_HOST, DB_NAME, DB_PASSWORD env vars

### C4: SECURE_SSL_REDIRECT crashed server
Error: No open ports detected → Exited status 1
Root cause: SSL redirect caused infinite loop on Render proxy
Fix: SECURE_SSL_REDIRECT=False, SESSION_COOKIE_SECURE=not DEBUG

### C5: migrate in Start Command failed silently
Error: No open ports detected (gunicorn never started)
Root cause: migrate failing before gunicorn could bind port
Fix: Removed migrate from Start Command entirely

### C6: gunicorn couldn't handle WebSocket
Error: WebSocket connections failing
Root cause: gunicorn is WSGI only, no WebSocket support
Fix: Switched to Daphne ASGI server

### C7: DJANGO_SETTINGS_MODULE not set for Daphne
Error: ImproperlyConfigured: settings are not configured
Root cause: Daphne doesn't inherit shell env vars
Fix: Added to Render env vars + os.environ.setdefault in asgi.py

### C8: No module named 'backend' after cd backend
Error: ModuleNotFoundError: No module named 'backend'
Root cause: cd backend changed working directory, Python path wrong
Fix: PYTHONPATH=/opt/render/project/src/backend in Render env vars
     --root-path flag in daphne command

### C9: Google OAuth 500 error on Render
Error: Internal Server Error on /api/auth/google/verify/
Root cause: google.oauth2 HTTP call to Google times out on free tier
Fix: Fallback JWT decode (base64 + audience validation) without HTTP call

### C10: livevc/urls.py had duplicate urlpatterns
Error: URL routing broken, some endpoints 404
Root cause: File had urlpatterns list defined twice by mistake
Fix: Cleaned to single urlpatterns list

### C11: Google login CORS error
Error: No 'Access-Control-Allow-Origin' header
Root cause: 500/502 errors don't include CORS headers in Django
Fix: Fixing the underlying 500/502 resolves CORS automatically

### C12: Logout URL 404
Error: POST /api/voice/logout/ → 404
Root cause: Frontend called /logout/ not /api/logout/
Fix: Changed to /api/logout/ in LoginSignupLogout.jsx

---

## 20. WHAT STILL NEEDS TO BE DONE

### CRITICAL (Do Before Public Launch)

1. Verify Google OAuth working after fallback JWT fix
2. Set DEBUG = False in settings.py
3. Generate new SECRET_KEY and move to Render env var
4. Remove '*' from ALLOWED_HOSTS
5. Set CORS_ALLOW_ALL_ORIGINS = False
6. Move DB password to env var only (remove from settings.py)

### HIGH PRIORITY

7. Razorpay Payment Gateway
   - Backend: pip install razorpay
   - POST /api/payments/create-order/
   - POST /api/payments/verify/
   - POST /api/payments/webhook/

8. CI/CD GitHub Actions
   - File: .github/workflows/ci.yml
   - Job 1: Django system check
   - Job 2: npm run build

### MEDIUM PRIORITY

9. VCR Bug Fixes
   - Audio keeps playing after leave (cleanup audio elements)
   - Host room stays open when tab closes (beforeunload event)
   - Stream not stopped before peer.destroy()

10. Course Enrollment → Panel Recommendation
    - Connect actual enrollments to VCR onboarding
    - When user buys course → POST /api/vcr/onboarding/ with course

11. Chapter Page Internal Links (170+ pages)
    - Add link to /animation-lab/[topic] on each chapter

12. 5 More Blog Posts
    - Target: 1/day, EdTech India keywords

### LOW PRIORITY

13. Gaming Lab HTML Files
    - memory-game.html (Phaser 3)
    - quiz-battle.html (WebSocket multiplayer)

14. Animation Lab HTML Files
    - data-science.html template (Three.js + GSAP)
    - 7 course clones

15. Mobile App (React Native)
    - Core screens: Home, Courses, Voice Rooms, Profile

16. Panel Ad Monetisation
    - AdSense in VCRoom sidebar
    - Gate: hosts with 1000+ followers only

---

## 21. NEXT SESSION ORDER

```
Session 1 (IMMEDIATE):
  → Verify Google OAuth working
  → Fix any remaining 500 errors

Session 2:
  → DEBUG=False + SECRET_KEY env var + ALLOWED_HOSTS cleanup

Session 3:
  → Razorpay payment gateway
  → /api/payments/ endpoints

Session 4:
  → CI/CD GitHub Actions pipeline
  → VCR bug fixes (audio cleanup, beforeunload)

Session 5:
  → Gaming Lab HTML files

Session 6:
  → Animation Lab HTML files (data-science.html template)

Ongoing:
  → 1 SEO blog post per day
  → Chapter page internal links (batch 10/day)
  → Monitor Google Search Console indexing
```

---

## QUICK REFERENCE — MOST USED COMMANDS

```bash
# Push to production
cd django-react-ml-app
git add .
git commit -m "your message"
git push origin main

# Local backend dev
cd backend
python manage.py runserver

# Local frontend dev
cd frontend
npm run dev

# Check what's deployed
curl https://api.seekhowithrua.com/api/panels/
# Should return 401 if working

# Django admin
https://api.seekhowithrua.com/admin/
# Login: seekhowithrua@gmail.com

# Debug URL routing
https://api.seekhowithrua.com/debug/

# Supabase dashboard
https://supabase.com/dashboard/project/vhkiwztuyypdtvduapqf/editor
```

---

END OF MASTER TECHNICAL DOCUMENTATION
SeekhoWithRua — Built by Master Rua 
March 22, 2026
