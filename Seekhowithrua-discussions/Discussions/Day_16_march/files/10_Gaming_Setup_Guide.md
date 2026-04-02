# SeekhoWithRua Gaming — Complete Setup Guide
# THIS FILE IS FOR BOTH HUMAN AND AI TO READ
# If AI is reading this: follow every instruction exactly in order
# Stack: Django + React + PostgreSQL + Three.js + Django Channels
# Domain: gaming.seekhowithrua.com
# Local: localhost:3001 (frontend) + localhost:8001 (backend)

---

## SECTION 1 — FOLDER STRUCTURE (Create this exactly)

```
projects/
├── django-react-ml-app/          ← YOUR EXISTING PROJECT (do not touch)
│   ├── backend/
│   ├── frontend/
│   ├── mobile/
│   ├── seekhowithrua-seo/
│   └── venv/
│
└── seekhowithrua-gaming/         ← NEW PROJECT (create this folder)
    ├── backend/                  ← Django + Channels (port 8001)
    │   ├── seekhowithrua_gaming/ ← Django project settings
    │   │   ├── __init__.py
    │   │   ├── settings.py
    │   │   ├── asgi.py           ← ASGI not WSGI (required for Channels)
    │   │   └── urls.py
    │   ├── game/                 ← Main Django app
    │   │   ├── models.py         ← GameUser, Question, Battle
    │   │   ├── consumers.py      ← WebSocket battle engine
    │   │   ├── routing.py        ← WebSocket URL routing
    │   │   ├── views.py          ← REST API endpoints
    │   │   ├── serializers.py
    │   │   └── admin.py
    │   ├── venv/                 ← Separate venv for gaming
    │   ├── manage.py
    │   ├── requirements.txt
    │   ├── render.yaml           ← Render deployment config
    │   └── .env                  ← Environment variables
    │
    ├── frontend/                 ← React + Three.js (port 3001)
    │   ├── public/
    │   ├── src/
    │   │   ├── pages/
    │   │   │   ├── Lobby.jsx
    │   │   │   ├── Battle.jsx
    │   │   │   ├── GTAWorld.jsx  ← GTA5-style open world
    │   │   │   ├── FreeFire.jsx  ← Battle royale quiz game
    │   │   │   └── Leaderboard.jsx
    │   │   ├── components/
    │   │   │   ├── games/
    │   │   │   │   ├── GTAScene.jsx      ← Three.js GTA world
    │   │   │   │   ├── FreeFireArena.jsx ← Three.js battle arena
    │   │   │   │   ├── RobotClone.jsx    ← AI avatar/robot system
    │   │   │   │   ├── QuizPanel.jsx     ← Quiz overlay on game
    │   │   │   │   └── HPBar.jsx         ← Health bars
    │   │   │   ├── ui/
    │   │   │   │   ├── SkillTree.jsx
    │   │   │   │   └── Leaderboard.jsx
    │   │   │   └── avatar/
    │   │   │       ├── AvatarCreator.jsx ← Free avatar builder
    │   │   │       └── RobotBuilder.jsx  ← Virtual robot clone
    │   │   ├── hooks/
    │   │   │   ├── useBattle.js          ← WebSocket hook
    │   │   │   └── useGameState.js
    │   │   ├── lib/
    │   │   │   └── websocket.js
    │   │   └── assets/
    │   │       └── models/               ← 3D model files go here
    │   ├── .env.local
    │   └── package.json
    │
    └── models/                   ← ALL 3D MODELS STORED HERE
        ├── characters/           ← Player avatars
        │   ├── free_fire_soldier.glb
        │   ├── robot_fighter.glb
        │   ├── ninja_warrior.glb
        │   └── README.md         ← where each model came from
        ├── environments/         ← Game worlds
        │   ├── city_map.glb      ← GTA-style city
        │   ├── battle_arena.glb  ← Free Fire arena
        │   └── quiz_room.glb
        ├── vehicles/             ← GTA cars etc
        │   └── sports_car.glb
        └── props/                ← Weapons, items etc
            └── quiz_orb.glb
```

---

## SECTION 2 — FREE 3D MODEL SOURCES (Download from these)

### Characters and Avatars
- **Mixamo** — mixamo.com — FREE, requires Adobe account (also free)
  - Best characters: Y Bot, X Bot, Soldier, Ninja, Robot
  - Download as: GLB format, 30fps, without skin
  - Has 100+ animations: idle, run, attack, death, victory

- **Sketchfab** — sketchfab.com/search?q=character&license=cc
  - Filter by: CC0 or CC-BY license (fully free commercial use)
  - Search: "low poly character", "game character free"

- **ReadyPlayerMe** — readyplayer.me
  - Free avatar creator — students can create their OWN avatar
  - Downloads as GLB — perfect for React Three Fiber
  - This is your FREE AVATAR system for students

### Environments and Worlds
- **Kenney Assets** — kenney.nl/assets — ALL FREE, no attribution
  - City kit, nature kit, space kit — perfect for GTA-style world
  - Search: "city", "buildings", "roads"

- **Quaternius** — quaternius.com — ALL FREE
  - Low poly city pack, car pack, character pack
  - Perfect for GTA5-style low poly game

- **OpenGameArt** — opengameart.org
  - Filter by license: CC0 (public domain)

### Vehicles (GTA style)
- Kenney.nl vehicle pack — free
- Sketchfab CC0 vehicles

### Weapons and Props
- Kenney.nl — weapon pack, space shooter pack — all free

---

## SECTION 3 — GAME DESIGNS

### Game 1 — GTA World (Open City Learning)
```
Concept:
- Player drives through a 3D city (Kenney.nl city pack)
- Buildings are "subject zones" — Python Building, ML Tower, Web Dev Street
- Enter a building = trigger a quiz
- Answer correctly = unlock new area of city + earn XP
- Wrong answer = bounty on your head, other players can "arrest" you
- Multiplayer: Socket.io — see other students driving in same city
- Robot clone: Each student has an AI bot that roams city when offline
  Bot answers easy questions automatically, earns small XP for student

Stack:
- Three.js for city rendering
- Kenney.nl city pack (free GLB files)
- Mixamo character (free)
- Django Channels for multiplayer
- Physics: @react-three/cannon (free)
```

### Game 2 — Free Fire Learning Arena
```
Concept:
- Battle royale style — 10–50 players drop into arena
- Safe zone shrinks every 2 minutes (forces engagement)
- To survive = answer quizzes correctly
- Correct answer = you can shoot/attack
- Wrong answer = you are frozen for 10 seconds (vulnerable)
- Breaking layers: Topic "shields" protect you
  Solve Python quiz = break opponent's Python shield
  Solve ML quiz = break ML shield
  All shields broken = player eliminated
- Team mode: Create robot/clan, fight together

Stack:
- Three.js battle royale arena
- Mixamo soldier/fighter (free)
- Django Channels for 50-player real-time
- Redis for fast game state
```

### Game 3 — Robot Virtual Clone
```
Concept:
- Every student builds their OWN robot using ReadyPlayerMe + customisation
- Robot learns as student learns — robot's "power" = student's XP
- When student is offline, robot fights automated battles
- Win = student earns XP while sleeping
- Build robot parts by completing modules:
  Complete Python module = unlock "Code Arm" for robot
  Complete ML module = unlock "Neural Core" for robot
  Complete DevOps = unlock "Cloud Shield" for robot
- Clan battles: Groups of robots fight, winners get bonus XP

Stack:
- ReadyPlayerMe for avatar (free API)
- Three.js for robot customisation UI
- Django backend for robot state + battle logic
```

---

## SECTION 4 — PREREQUISITES TO INSTALL RIGHT NOW (1Gbps — install everything)

### Backend Prerequisites

```bash
# Navigate to gaming backend folder
cd projects/seekhowithrua-gaming/backend

# Create virtual environment (separate from existing project)
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install ALL backend dependencies at once
pip install django
pip install djangorestframework
pip install django-cors-headers
pip install channels
pip install channels-redis
pip install daphne
pip install psycopg2-binary
pip install python-decouple
pip install redis
pip install celery
pip install Pillow
pip install django-storages
pip install boto3
pip install gunicorn
pip install whitenoise
pip install django-extensions
pip install ipython

# Save requirements
pip freeze > requirements.txt
```

### Frontend Prerequisites

```bash
# Navigate to gaming frontend folder
cd projects/seekhowithrua-gaming/frontend

# Create React app
npx create-react-app . --template cra-template

# Install ALL frontend dependencies at once (1Gbps — do all together)
npm install three
npm install @react-three/fiber
npm install @react-three/drei
npm install @react-three/cannon
npm install @react-three/postprocessing
npm install reactflow
npm install framer-motion
npm install socket.io-client
npm install axios
npm install react-router-dom
npm install zustand
npm install @readyplayerme/visage
npm install gsap
npm install leva
npm install stats.js
npm install @types/three
npm install tailwindcss
npm install autoprefixer
npm install postcss

# Install dev tools
npm install -D vite
npm install -D @vitejs/plugin-react
```

### Redis (Required for Django Channels)

```bash
# Windows — download from:
# https://github.com/microsoftarchive/redis/releases
# Download: Redis-x64-3.0.504.msi

# OR use WSL (Windows Subsystem for Linux):
wsl --install
# Then in WSL:
sudo apt-get install redis-server
sudo service redis-server start

# Verify Redis is running:
redis-cli ping
# Should return: PONG
```

### PostgreSQL (You already have this — create new database)

```sql
-- In psql or pgAdmin, create gaming database
CREATE DATABASE seekho_gaming;
CREATE USER seekho_gaming_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE seekho_gaming TO seekho_gaming_user;
```

---

## SECTION 5 — DJANGO PROJECT CREATION

```bash
cd projects/seekhowithrua-gaming/backend

# Create Django project
django-admin startproject seekhowithrua_gaming .

# Create game app
python manage.py startapp game

# Create models and migrate
python manage.py makemigrations game
python manage.py migrate

# Create superuser (to add questions via admin)
python manage.py createsuperuser

# Run on port 8001 (not 8000 — that is your existing project)
python manage.py runserver 8001
```

---

## SECTION 6 — ENVIRONMENT FILES

### backend/.env
```
DEBUG=True
SECRET_KEY=your-secret-key-here-make-it-long-random
DATABASE_URL=postgresql://seekho_gaming_user:yourpassword@localhost:5432/seekho_gaming
REDIS_URL=redis://localhost:6379
ALLOWED_HOSTS=localhost,127.0.0.1,gaming-api.seekhowithrua.com
CORS_ALLOWED_ORIGINS=http://localhost:3001,https://gaming.seekhowithrua.com
FRONTEND_URL=http://localhost:3001
```

### frontend/.env.local
```
REACT_APP_API_URL=http://localhost:8001
REACT_APP_WS_URL=ws://localhost:8001
REACT_APP_READY_PLAYER_ME_SUBDOMAIN=seekhowithrua
```

### frontend/.env.production
```
REACT_APP_API_URL=https://gaming-api.seekhowithrua.com
REACT_APP_WS_URL=wss://gaming-api.seekhowithrua.com
REACT_APP_READY_PLAYER_ME_SUBDOMAIN=seekhowithrua
```

---

## SECTION 7 — DNS RECORDS TO ADD

In your domain registrar (GoDaddy/Namecheap/Hostinger):

```
Type    Name          Value                              TTL
CNAME   gaming        cname.vercel-dns.com               Auto
CNAME   gaming-api    your-app.onrender.com              Auto
```

After adding:
- gaming.seekhowithrua.com → React frontend (Vercel)
- gaming-api.seekhowithrua.com → Django backend (Render)

---

## SECTION 8 — WHERE TO KEEP MODELS

```
seekhowithrua-gaming/
└── models/           ← Master model library (source of truth)
    ├── characters/   ← All character GLB files
    ├── environments/ ← All world/map GLB files
    ├── vehicles/     ← Cars, bikes, etc
    └── props/        ← Weapons, items, collectibles

Copy to frontend when needed:
seekhowithrua-gaming/frontend/src/assets/models/
└── (copy only what current game needs — not all models)
```

**Do NOT put models inside the Django backend folder.**
**Do NOT put models inside node_modules.**
**Keep master copies in /models/ folder, copy to frontend/src/assets/models/ as needed.**

---

## SECTION 9 — MODEL LOADING IN REACT

```javascript
// How to load a GLB model in React Three Fiber
import { useGLTF } from '@react-three/drei'
import { useAnimations } from '@react-three/drei'

function SoldierCharacter() {
  const { scene, animations } = useGLTF('/models/characters/soldier.glb')
  const { actions } = useAnimations(animations, scene)

  useEffect(() => {
    actions['idle']?.play()  // play idle animation on load
  }, [actions])

  return <primitive object={scene} scale={1.5} position={[0, 0, 0]} />
}

// Preload model for zero latency
useGLTF.preload('/models/characters/soldier.glb')
```

---

## SECTION 10 — NO LATENCY STRATEGY

To achieve near-zero latency in multiplayer:

```
1. Client-side prediction
   - Don't wait for server to confirm movement
   - Move player immediately on keypress
   - Reconcile with server state every 100ms

2. Delta compression
   - Only send what CHANGED (not full game state)
   - Instead of: { x:100, y:0, z:50, hp:80, score:200 }
   - Send: { x:100, z:50 }  (only what moved)

3. Redis for game state (not PostgreSQL)
   - Game state lives in Redis (in-memory, microsecond reads)
   - PostgreSQL only for permanent storage (scores, achievements)

4. WebSocket over HTTPS with compression
   - perMessageDeflate: true in Django Channels

5. Render location
   - Deploy backend on Render Mumbai region
   - Closest to your Noida students = lowest ping
```

---

## SECTION 11 — WHAT TO DO WITH EXISTING PROJECT

Your existing `django-react-ml-app`:
- DO NOT touch backend/ frontend/ mobile/ — keep as is
- DO NOT delete `seekhowithrua-seo` — keep it
- DO NOT delete `we added delete pannel correctly` — rename it to something meaningful or archive
- The gaming project is COMPLETELY SEPARATE

```
projects/
├── django-react-ml-app/     ← Main SeekhoWithRua platform (KEEP)
└── seekhowithrua-gaming/    ← New gaming subdomain (CREATE)
```

Both projects share the same PostgreSQL server but use DIFFERENT databases.
Both projects deploy to different Render services.
Both projects are separate GitHub repositories.

---

## SECTION 12 — GITHUB REPOS TO CREATE

```
github.com/yourusername/seekhowithrua-gaming-frontend  → Vercel
github.com/yourusername/seekhowithrua-gaming-backend   → Render
```

Separate repos = separate deployments = clean architecture.

---

## SECTION 13 — QUICK START (Run today)

```bash
# Terminal 1 — Redis
redis-server

# Terminal 2 — Django gaming backend
cd seekhowithrua-gaming/backend
venv\Scripts\activate
python manage.py runserver 8001

# Terminal 3 — React gaming frontend
cd seekhowithrua-gaming/frontend
npm start -- --port 3001

# Terminal 4 — Existing main platform backend
cd django-react-ml-app/backend
venv\Scripts\activate
python manage.py runserver 8000

# Terminal 5 — Existing main platform frontend
cd django-react-ml-app/frontend
npm start
```

---

## IF AI IS READING THIS FILE:

You now have complete context. The student is:
- Rua (founder of SeekhoWithRua)
- Full stack developer — Django + React + PostgreSQL + React Native
- Building gaming.seekhowithrua.com as subdomain
- Wants GTA5-style open world + Free Fire battle royale + Robot clone games
- All games are quiz-based — correct answers = game power
- Free 3D models from Mixamo + Kenney + ReadyPlayerMe
- Django Channels for real-time multiplayer (NOT Socket.io)
- Separate project from main seekhowithrua platform
- Target: zero latency, 50 concurrent players per room
- Current status: Installing prerequisites on 1Gbps connection

When helping with code: use Django + React Three Fiber + Django Channels.
When suggesting models: use Mixamo, Kenney.nl, ReadyPlayerMe (all free).
When discussing deployment: Vercel (frontend) + Render (backend) + Render PostgreSQL + Render Redis.

---

*File created: March 2026 | seekhowithrua-gaming setup guide*
