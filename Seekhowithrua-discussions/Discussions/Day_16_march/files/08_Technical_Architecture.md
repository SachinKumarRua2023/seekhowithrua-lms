# Technical Architecture
*Django + React + PostgreSQL + React Native Expo*

---

## Your Stack (Already Confirmed)

| Layer | Technology | Deploy |
|---|---|---|
| Frontend | React.js (Vite or CRA) | Vercel |
| Backend | Django + DRF | Render |
| Real-time | Django Channels + Redis | Render |
| Database | PostgreSQL | Render Postgres |
| Voice rooms | WebRTC (already built) | 100ms.live |
| Mobile | React Native Expo | App Store + Play Store |

---

## Domain Structure

```
seekhowithrua.com          → Main platform (React → Vercel)
gaming.seekhowithrua.com   → Gaming subdomain (React → Vercel, separate project)
api.seekhowithrua.com      → Main Django backend (Render)
gaming-api.seekhowithrua.com → Gaming Django backend (Render)
```

---

## DNS Records to Add

Go to your domain registrar (GoDaddy / Namecheap / Hostinger):

```
Type    Name          Value
CNAME   gaming        cname.vercel-dns.com
CNAME   api           your-main-app.onrender.com
CNAME   gaming-api    your-gaming-app.onrender.com
```

---

## Local Development Ports

```
Main React frontend      → localhost:3000  (already running)
Gaming React frontend    → localhost:3001  (new project)
Main Django backend      → localhost:8000  (already running)
Gaming Django backend    → localhost:8001  (new project)
Redis (local)            → localhost:6379
PostgreSQL (local)       → localhost:5432
```

---

## Gaming Project Setup

### Folder Structure

```
seekhowithrua-gaming/
├── frontend/                     ← React → Vercel → gaming.seekhowithrua.com
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Lobby.jsx         ← Matchmaking + topic select
│   │   │   ├── Battle.jsx        ← Live battle room
│   │   │   └── Leaderboard.jsx   ← Rankings
│   │   ├── components/
│   │   │   ├── BattleArena.jsx   ← Three.js 3D canvas
│   │   │   ├── QuizPanel.jsx     ← Question + 10s timer
│   │   │   ├── HPBar.jsx         ← Animated health bars
│   │   │   └── SkillTree.jsx     ← React Flow skill map
│   │   ├── hooks/
│   │   │   └── useBattle.js      ← WebSocket connection hook
│   │   └── lib/
│   │       └── websocket.js      ← WS client singleton
│   └── .env.local
│       REACT_APP_API_URL=http://localhost:8001
│       REACT_APP_WS_URL=ws://localhost:8001
│
└── backend/                      ← Django → Render → gaming-api.seekhowithrua.com
    ├── seekhowithrua_gaming/
    │   ├── settings.py
    │   └── asgi.py
    ├── game/
    │   ├── models.py
    │   ├── consumers.py          ← WebSocket battle engine
    │   ├── routing.py
    │   └── views.py              ← REST API (leaderboard, questions)
    ├── requirements.txt
    └── render.yaml
```

---

## Django Backend Setup

### Install

```bash
pip install django djangorestframework django-cors-headers
pip install channels channels-redis daphne
pip install psycopg2-binary python-decouple
```

### settings.py (key additions)

```python
INSTALLED_APPS = [
    'daphne',          # MUST be first
    'channels',
    'django.contrib.auth',
    'rest_framework',
    'corsheaders',
    'game',
]

ASGI_APPLICATION = 'seekhowithrua_gaming.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            # local
            'hosts': [('127.0.0.1', 6379)],
            # production: os.environ.get('REDIS_URL')
        },
    },
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3001',
    'https://gaming.seekhowithrua.com',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'seekho_gaming',
        'USER': 'postgres',
        'PASSWORD': 'yourpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### asgi.py

```python
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from game.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'seekhowithrua_gaming.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
```

---

## Django Models (PostgreSQL via ORM)

```python
# game/models.py
from django.db import models
import uuid

class GameUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.UUIDField(unique=True)
    username = models.CharField(max_length=100)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    last_played = models.DateTimeField(null=True)

    class Meta:
        ordering = ['-xp']

class Question(models.Model):
    TOPICS = [
        ('python', 'Python'), ('ml', 'Machine Learning'),
        ('web', 'Web Dev'), ('devops', 'DevOps'), ('iot', 'IoT'),
    ]
    topic = models.CharField(max_length=50, choices=TOPICS)
    question = models.TextField()
    option_a = models.CharField(max_length=300)
    option_b = models.CharField(max_length=300)
    option_c = models.CharField(max_length=300)
    option_d = models.CharField(max_length=300)
    correct = models.CharField(max_length=1)  # 'a' 'b' 'c' 'd'
    difficulty = models.IntegerField(default=1)

class Battle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    player1 = models.ForeignKey(GameUser, related_name='battles_p1',
                                 on_delete=models.SET_NULL, null=True)
    player2 = models.ForeignKey(GameUser, related_name='battles_p2',
                                 on_delete=models.SET_NULL, null=True)
    topic = models.CharField(max_length=50)
    winner = models.ForeignKey(GameUser, related_name='battle_wins',
                                on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## Django Channels Consumer (Battle Engine)

```python
# game/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Question, GameUser

waiting_players = {}  # in-memory matchmaking queue

class BattleConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user_id = self.scope['query_string'].decode().split('user_id=')[1]
        self.room_name = None
        await self.accept()
        await self.find_match()

    async def find_match(self):
        topic = 'python'
        key = topic
        if key in waiting_players and waiting_players[key]:
            opp_id, opp_channel = waiting_players[key].pop(0)
            self.room_name = f"battle_{min(self.user_id, opp_id)}_{max(self.user_id, opp_id)}"
            await self.channel_layer.group_add(self.room_name, self.channel_name)
            await self.channel_layer.group_add(self.room_name, opp_channel)
            await self.start_battle(topic)
        else:
            waiting_players.setdefault(key, []).append((self.user_id, self.channel_name))
            await self.send(json.dumps({'type': 'waiting'}))

    async def start_battle(self, topic):
        self.questions = await self.get_questions(topic)
        self.current_q = 0
        await self.channel_layer.group_send(self.room_name, {
            'type': 'battle_start',
            'question': self.questions[0],
            'total': len(self.questions)
        })

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'answer':
            q = self.questions[self.current_q]
            correct = data['answer'] == q['correct']
            await self.channel_layer.group_send(self.room_name, {
                'type': 'answer_result',
                'player': self.user_id,
                'correct': correct,
                'damage': 20 if correct else 0,
                'self_damage': 10 if not correct else 0,
            })
            self.current_q += 1
            if self.current_q < len(self.questions):
                await self.channel_layer.group_send(self.room_name, {
                    'type': 'next_question',
                    'question': self.questions[self.current_q],
                    'number': self.current_q + 1
                })

    async def battle_start(self, event): await self.send(json.dumps(event))
    async def answer_result(self, event): await self.send(json.dumps(event))
    async def next_question(self, event): await self.send(json.dumps(event))

    async def disconnect(self, code):
        if self.room_name:
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    @database_sync_to_async
    def get_questions(self, topic):
        qs = list(Question.objects.filter(topic=topic).order_by('?')[:10])
        return [{'id': str(q.id), 'question': q.question,
                 'options': {'a': q.option_a, 'b': q.option_b,
                             'c': q.option_c, 'd': q.option_d},
                 'correct': q.correct} for q in qs]
```

---

## React WebSocket Hook

```javascript
// hooks/useBattle.js
import { useEffect, useRef, useState } from 'react'

export function useBattle(userId) {
  const ws = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [question, setQuestion] = useState(null)
  const [hp, setHp] = useState({ me: 100, opponent: 100 })

  useEffect(() => {
    const url = `${process.env.REACT_APP_WS_URL}/ws/battle/?user_id=${userId}`
    ws.current = new WebSocket(url)

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'waiting') setStatus('waiting')
      if (data.type === 'battle_start') { setStatus('playing'); setQuestion(data.question) }
      if (data.type === 'answer_result') {
        if (data.player === userId) {
          setHp(h => ({ ...h, opponent: Math.max(0, h.opponent - data.damage) }))
          setHp(h => ({ ...h, me: Math.max(0, h.me - data.self_damage) }))
        } else {
          setHp(h => ({ ...h, me: Math.max(0, h.me - data.damage) }))
        }
      }
      if (data.type === 'next_question') setQuestion(data.question)
    }

    return () => ws.current?.close()
  }, [userId])

  const sendAnswer = (answer) =>
    ws.current?.send(JSON.stringify({ type: 'answer', answer }))

  return { status, question, hp, sendAnswer }
}
```

---

## Render Deployment

### render.yaml

```yaml
services:
  - type: web
    name: seekhowithrua-gaming-api
    env: python
    buildCommand: pip install -r requirements.txt && python manage.py migrate
    startCommand: daphne -b 0.0.0.0 -p $PORT seekhowithrua_gaming.asgi:application
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: seekhowithrua-gaming-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: seekhowithrua-gaming-redis
          property: connectionString

databases:
  - name: seekhowithrua-gaming-db
    plan: free

services:
  - type: redis
    name: seekhowithrua-gaming-redis
    plan: free
```

**Start command must use `daphne` not `gunicorn` — Channels needs ASGI.**

---

## Cookie Sharing Across Subdomains

Set cookie domain with dot prefix so user stays logged in across all subdomains:

```python
# Django settings
SESSION_COOKIE_DOMAIN = '.seekhowithrua.com'
CSRF_COOKIE_DOMAIN = '.seekhowithrua.com'
```

```javascript
// When setting JWT cookie
res.cookie('token', jwt, {
  domain: '.seekhowithrua.com',  // dot prefix = all subdomains
  httpOnly: true,
  secure: true,
  sameSite: 'lax'
})
```

---

## React Native Expo Migration

### What Transfers Directly (80% of code)
- All API calls — identical
- All business logic — identical
- Django backend — zero changes
- Auth flow — identical
- State management (Redux/Context) — identical

### What Needs Rewriting (20%)
- `div` → `View`
- `p`, `h1`, `span` → `Text`
- CSS → `StyleSheet.create({})`
- `onClick` → `onPress`
- Browser WebRTC → `react-native-webrtc`
- Three.js → `react-three-fiber` with Expo GL

### Mobile-Only Features to Add
- Push notifications (Expo Push Notifications SDK)
- Offline course download
- Camera for project submission
- Haptic feedback in battles
- QR code scanner for attendance

### Build Mobile LIVE in Class
You teach React Native. Build the mobile app in Saturday sessions with students watching.
Students learn from real production codebase. You get the app built while teaching.
Record sessions → YouTube → 10,000+ developer followers → all become SeekhoWithRua users.

---

## Complete Free Stack — Rs 0 Until 10,000 Users

| Service | Purpose | Free limit | Cost |
|---|---|---|---|
| Vercel | React hosting | Unlimited personal | Rs 0 |
| Render | Django backend | Free tier | Rs 0 |
| Render Redis | Channel layer | 25MB free | Rs 0 |
| Render Postgres | Database | 256MB free | Rs 0 |
| Cloudinary | Video + images | 25GB/month | Rs 0 |
| 100ms.live | WebRTC voice rooms | 10,000 min/month | Rs 0 |
| Upstash Redis | Leaderboard | 10,000 cmd/day | Rs 0 |
| Razorpay | Payments | 2% per transaction | Rs 120/sale |
| Domain | seekhowithrua.com | Annual | Rs 800/year |

**Total: Rs 800/year + 2% payment fee. That is your entire infrastructure cost.**

---

## Quick Start Commands

```bash
# Gaming backend
django-admin startproject seekhowithrua_gaming
cd seekhowithrua_gaming
python manage.py startapp game
pip install channels channels-redis daphne psycopg2-binary
python manage.py makemigrations game
python manage.py migrate
python manage.py runserver 8001

# Gaming frontend
npx create-react-app seekhowithrua-gaming-frontend
cd seekhowithrua-gaming-frontend
npm install three @react-three/fiber @react-three/drei reactflow
npm start -- --port 3001
```

---

*Same Django patterns you already know. Django Channels = Socket.io for Python. That is all.*
