# SeekhoWithRua Gaming — Complete Build Sequence
# All Three Games · Architecture · Sequence · Logic
# Decision locked by Rua — March 2026

---

## IF AI IS READING THIS:
Read 00_MASTER_INDEX.md first for full context.
This file covers the complete gaming build sequence.
Three games. One engine base. Different audiences.
Developer: Rua — Django + React + PostgreSQL + React Native

---

## THE THREE GAMES — CONFIRMED SEQUENCE

```
GAME 1 — HatimAI (one per course)
  Build first · Single player · Story driven
  One HatimAI game per SeekhoWithRua course module
  Same engine, different quests per course
  Audience: Enrolled students on that specific course

GAME 2 — Battle Zone (Free Fire style)
  Build second · Multiplayer · Truly random
  For everyone — freshers, professionals, school students
  Random questions from ANY topic — even unstudied ones
  Survival of the Learned — breadth of knowledge wins

GAME 3 — School Games
  Build third · Three age modes in same game
  Chhotu (6-10) + Hero (10-14) + Warrior (14-17)
  Designed to compete with Free Fire, PUBG, Clash Royale
  School license revenue model
```

---

## GAME 1 — HATIMAI (ONE PER COURSE)

### The Engine Is Built Once — Content Swapped Per Course

```
SAME ENGINE:
- Three.js world renderer
- Terminal + Pyodide code execution
- DataBot emotional companion
- Chain mechanic (answer → becomes next problem)
- Humanoid quiz before each quest
- Trust score system
- Master debug account
- Boss fight system
- Certificate fragment system

DIFFERENT PER COURSE:
- 7 quest worlds (different themes)
- 7 humanoid dilemmas (different ethics)
- Chain questions (different subject matter)
- Dataset (loaded into Pyodide per course)
- Monster names and designs
- World environments from Kenney/Mixamo
- Certificate design
```

### All HatimAI Versions — Build Order

```
HatimAI: Data Science     ← BUILD FIRST (most complex, proves engine)
  7 quests: Missing Data, Patterns, Predictions, Neural Palace,
            Language Ocean, Cloud Fortress, Temple of Intelligence

HatimAI: Python           ← BUILD SECOND (simpler, reuse engine)
  7 quests: Variables Jungle, Functions Mountain, OOP City,
            File System Palace, Error Ocean, Library Fortress,
            Algorithm Temple

HatimAI: Web Development  ← BUILD THIRD
  7 quests: HTML Forest, CSS Mountain, JavaScript City,
            React Palace, API Ocean, Database Fortress,
            Deployment Temple

HatimAI: Machine Learning ← BUILD FOURTH
  7 quests: same engine, ML-specific problems

HatimAI: IoT              ← BUILD FIFTH
HatimAI: DevOps           ← BUILD SIXTH
HatimAI: AI Ethics        ← BUILD SEVENTH (most philosophical)
```

### How New HatimAI Course Is Added

```python
# game/models.py — add new course HatimAI in Django admin

class HatimAICourse(models.Model):
    course_name = models.CharField(max_length=100)    # "Data Science"
    slug = models.SlugField(unique=True)               # "data-science"
    is_active = models.BooleanField(default=False)     # flip to launch
    description = models.TextField()
    world_theme = models.CharField(max_length=100)     # "mystical forest"
    primary_language = models.CharField(max_length=20) # "python" or "js"

# 7 quests per course — same Quest model, linked to course
class Quest(models.Model):
    course = models.ForeignKey(HatimAICourse, on_delete=models.CASCADE)
    number = models.IntegerField()     # 1-7
    name = models.CharField(max_length=200)
    world_environment = models.CharField(max_length=100)
    concept = models.CharField(max_length(200)
    chain_length = models.IntegerField()
    dataset_name = models.CharField(max_length=100)  # loaded into Pyodide
    humanoid_question = models.ForeignKey('HumanoidQuestion',
                                           on_delete=models.SET_NULL, null=True)
```

### React — Load Correct HatimAI Per Course

```javascript
// pages/HatimAI.jsx
// URL: gaming.seekhowithrua.com/hatimai/data-science
// URL: gaming.seekhowithrua.com/hatimai/python
// URL: gaming.seekhowithrua.com/hatimai/web-development

import { useParams } from 'react-router-dom'
import { Quest1Forest } from '../components/worlds/data-science/Quest1Forest'
import { Quest1VariablesJungle } from '../components/worlds/python/Quest1Jungle'

const WORLD_COMPONENTS = {
  'data-science': {
    1: Quest1Forest,
    2: Quest2Mountain,
    // ...
  },
  'python': {
    1: Quest1VariablesJungle,
    // ...
  }
}

export function HatimAI() {
  const { courseSlug, questNumber } = useParams()
  const WorldComponent = WORLD_COMPONENTS[courseSlug]?.[questNumber]

  if (!WorldComponent) return <div>Quest not found</div>
  return <WorldComponent courseSlug={courseSlug} />
}
```

---

## GAME 2 — BATTLE ZONE (PERSONALISED FREE FIRE)

### Core Concept — FINAL LOCKED DESIGN

```
AUDIENCE:    Everyone — enrolled students, free users, school students
ENTRY:       Anyone with SeekhoWithRua account can enter
QUESTIONS:   FULLY PRIVATE PER PLAYER — your screen shows YOUR questions only
             Nobody else sees what you are answering
QUESTION SOURCE:
  Enrolled student  → full course syllabus (even ahead of progress)
  Free user         → general knowledge questions only
DOMAIN:      Each course has its own isolated question bank
             Data Science student gets DS questions
             Grade 11 student gets Grade 11 syllabus questions
             Python student gets Python questions
             All competing on SAME leaderboard simultaneously
FAIRNESS:    You are only judged on YOUR knowledge of YOUR syllabus
             DS student and Grade 11 student can battle — each on their own domain
RANDOMNESS:  Full syllabus random — even topics not yet studied appear
             This is the exam surprise mechanic
             Unknown topic = motivation to go study it
```

### How Personalised Questions Work — The Key Mechanic

```
50 players in same room
Each player's screen is completely private
Player A (Data Science enrolled):
  Screen shows: "What is the bias-variance tradeoff?"
  Timer: 10 seconds

Player B (Grade 11 CBSE):
  Screen shows: "What is Newton's Second Law of Motion?"
  Same timer: 10 seconds

Player C (Free user):
  Screen shows: "What is the capital of India?"
  Same timer: 10 seconds

All three answer simultaneously — nobody sees each other's questions
Damage is calculated from YOUR answer to YOUR question
All damage goes to the leaderboard affecting everyone's HP
The arena is shared — the questions are private
```

### Player Type Detection — Django Backend

```python
# game/battle_zone.py

import requests
from django.conf import settings

MAIN_PLATFORM_URL = settings.MAIN_PLATFORM_API  # django-react-ml-app.onrender.com

QUESTION_DOMAINS = {
    'data-science':     {'topics': ['data_science', 'ml', 'statistics', 'python'],
                         'label': 'Data Science'},
    'python':           {'topics': ['python', 'programming', 'algorithms'],
                         'label': 'Python'},
    'web-development':  {'topics': ['web', 'html', 'css', 'javascript', 'react'],
                         'label': 'Web Development'},
    'machine-learning': {'topics': ['ml', 'deep_learning', 'ai'],
                         'label': 'Machine Learning'},
    'iot':              {'topics': ['iot', 'hardware', 'sensors', 'arduino'],
                         'label': 'IoT'},
    'devops':           {'topics': ['devops', 'docker', 'cloud', 'git'],
                         'label': 'DevOps'},
    'grade-11-science': {'topics': ['physics_11', 'chemistry_11', 'maths_11', 'biology_11'],
                         'label': 'Grade 11 Science'},
    'grade-11-commerce':{'topics': ['accounts_11', 'economics_11', 'business_11'],
                         'label': 'Grade 11 Commerce'},
    'grade-12-science': {'topics': ['physics_12', 'chemistry_12', 'maths_12', 'biology_12'],
                         'label': 'Grade 12 Science'},
    'free-user':        {'topics': ['general_knowledge', 'current_affairs',
                                    'basic_math', 'english_basic'],
                         'label': 'General Knowledge'},
}

def get_player_domain(user_id: str, token: str) -> dict:
    """
    Calls main platform to check what course student is enrolled in.
    Returns their question domain.
    """
    try:
        response = requests.get(
            f'{MAIN_PLATFORM_URL}/user/{user_id}/enrollment/',
            headers={'Authorization': f'Bearer {token}'},
            timeout=3
        )
        if response.status_code == 200:
            data = response.json()
            course_slug = data.get('enrolled_course_slug', 'free-user')
            return QUESTION_DOMAINS.get(course_slug,
                                         QUESTION_DOMAINS['free-user'])
    except requests.RequestException:
        pass

    # Default to general knowledge if enrollment check fails
    return QUESTION_DOMAINS['free-user']


def get_personalised_question(user_id: str, domain: dict,
                               asked_ids: list) -> dict:
    """
    Get a random question from player's domain.
    Excludes already asked questions.
    Full syllabus random — even topics ahead of progress.
    """
    from .models import Question

    question = Question.objects.filter(
        topic__in=domain['topics'],
        game__in=['battlezone', 'all']
    ).exclude(
        id__in=asked_ids
    ).order_by('?').first()

    if not question:
        # Reset if all questions asked (unlikely but safe)
        question = Question.objects.filter(
            topic__in=domain['topics'],
            game__in=['battlezone', 'all']
        ).order_by('?').first()

    return {
        'id': str(question.id),
        'text': question.question_text,
        'options': {
            'a': question.option_a,
            'b': question.option_b,
            'c': question.option_c,
            'd': question.option_d,
        },
        'topic': question.topic,         # shown AFTER answer, not before
        'difficulty': question.difficulty,
        'domain_label': domain['label'], # shown to player: "Data Science Question"
        'course_slug': question.course_slug,
    }
```

### Django Channels Consumer — Personalised Battle Zone

```python
# game/consumers.py — BattleZoneConsumer (FINAL VERSION)

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import BattleSession, PlayerBattleState
from .battle_zone import get_player_domain, get_personalised_question

class BattleZoneConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.user_id = self.scope['query_string'].decode().split('user_id=')[1]
        self.token = self.scope['query_string'].decode().split('token=')[1].split('&')[0]
        self.room_group = f'battle_{self.room_id}'
        self.asked_question_ids = []

        # Get this player's question domain from main platform
        self.domain = await database_sync_to_async(get_player_domain)(
            self.user_id, self.token
        )

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        await self.add_player_to_session()

        # Tell player their domain — shown in lobby
        await self.send(json.dumps({
            'type': 'domain_assigned',
            'domain': self.domain['label'],
            'message': f"You will answer {self.domain['label']} questions"
        }))

        # Broadcast to room someone joined
        await self.channel_layer.group_send(self.room_group, {
            'type': 'player_joined',
            'player_id': self.user_id,
            'domain': self.domain['label'],
            'player_count': await self.get_player_count()
        })

        # Start battle when 50 players or after 30 second lobby timeout
        player_count = await self.get_player_count()
        if player_count >= 50:
            await self.channel_layer.group_send(self.room_group,
                                                 {'type': 'battle_begin'})

    async def battle_begin(self, event):
        """Called when battle starts — send each player THEIR own first question"""
        await self.send_next_question(question_number=1)

    async def send_next_question(self, question_number: int):
        """
        CRITICAL: Each player gets their OWN question
        This is sent directly to THIS player only — not group_send
        """
        question = await database_sync_to_async(get_personalised_question)(
            self.user_id,
            self.domain,
            self.asked_question_ids
        )
        self.asked_question_ids.append(question['id'])
        self.current_question = question

        # Send ONLY to this player — direct send not group_send
        await self.send(json.dumps({
            'type': 'your_question',        # private to this player
            'question': question,
            'question_number': question_number,
            'timer': 10,
            'domain': self.domain['label'],
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data['type'] == 'answer':
            result = await self.process_answer(
                data['answer'],
                data['response_time']
            )

            # Tell this player their result privately
            await self.send(json.dumps({
                'type': 'answer_result',
                'correct': result['correct'],
                'correct_answer': self.current_question['options'][
                    self.current_question.get('correct', 'a')
                ],
                'explanation': result.get('explanation', ''),
                'damage_dealt': result['damage'],
                'topic': self.current_question['topic'],
            }))

            # Broadcast damage/HP update to ALL players (anonymous)
            # Other players see "Player X dealt 25 damage" not the question
            await self.channel_layer.group_send(self.room_group, {
                'type': 'hp_update',
                'attacker_id': self.user_id,
                'damage': result['damage'],
                'self_damage': result['self_damage'],
            })

            # Send this player their next question immediately
            await self.send_next_question(data['question_number'] + 1)

    async def process_answer(self, answer: str, response_time: float) -> dict:
        from .models import Question
        question = await database_sync_to_async(
            Question.objects.get)(id=self.current_question['id'])

        correct = answer == question.correct_answer

        if correct:
            if response_time <= 4:   damage = 25
            elif response_time <= 8: damage = 10
            else:                    damage = 5
            return {
                'correct': True,
                'damage': damage,
                'self_damage': 0,
                'explanation': question.explanation
            }
        else:
            return {
                'correct': False,
                'damage': 0,
                'self_damage': 10,
                'explanation': question.explanation
            }

    # Broadcast handlers — these go to ALL players
    async def hp_update(self, event):
        await self.send(json.dumps(event))

    async def player_joined(self, event):
        await self.send(json.dumps(event))

    async def player_eliminated(self, event):
        await self.send(json.dumps(event))

    async def battle_begin(self, event):
        await self.send_next_question(question_number=1)

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)
```

### Battle Zone Game Flow — Complete

```
LOBBY (30 seconds or until 50 players)
Each player sees: "You will answer [Domain] questions"
DS student sees: "You will answer Data Science questions"
Grade 11 student sees: "You will answer Grade 11 Science questions"
Free user sees: "You will answer General Knowledge questions"
All see each other joining — different domains visible

BATTLE STARTS
Each player immediately gets THEIR FIRST QUESTION (private screen)
DS student: "What is the bias-variance tradeoff?" — 10 seconds
Grade 11:   "State Newton's Second Law." — 10 seconds
Free user:  "What is the capital of France?" — 10 seconds
Nobody sees each other's questions — fully private

ANSWERING (continuous — no wait between questions)
Correct + Fast (1-4 sec)  → 25 damage to random player
Correct + Slow (5-8 sec)  → 10 damage
Correct + Very slow       → 5 damage
Wrong answer              → 10 self damage + see correct answer + explanation
No answer (timer runs out)→ 5 self damage + next question appears

After each answer → next question appears immediately (no gap)
Faster knowledge = more attacks = survive longer

SHARED ARENA (what everyone sees)
Global leaderboard updating live — HP bars for all 50 players
"Player_Arjun dealt 25 damage" — no question shown, just damage
You can see who is leading but not WHY they are leading
This creates mystery and competition

ELIMINATION
HP reaches 0 → eliminated
Private elimination screen shows:
  - The question that destroyed you
  - The correct answer
  - "Study [topic] on SeekhoWithRua" direct link
  - Your battle stats: X correct, Y wrong, strongest topic, weakest topic

WINNER
Last player standing = CHAMPION of this battle
Post-game shows all players' domain and performance
"Arjun (Data Science) answered 18/22 correctly — Rank 1"
"Priya (Grade 11) answered 15/19 correctly — Rank 2"
```

### The Motivation Loop — Exam Surprise Mechanic

```
Free user gets destroyed by hard general knowledge questions
  → "Enroll in a course for better questions and ranking advantage"
  → CONVERTS free user to enrolled student

DS student gets destroyed by a Module 6 question they never studied
  → "You lost because you don't know model deployment"
  → Goes to SeekhoWithRua, studies Module 6
  → Returns, answers Module 6 questions correctly
  → Survives longer, climbs leaderboard

Grade 11 student weak in Chemistry
  → Gets destroyed by Chemistry questions repeatedly
  → "You lost 3 battles to Chemistry questions"
  → Studies Chemistry chapters
  → Returns stronger

The game generates its own curriculum pull.
Loss is the teacher. Unknown question IS the motivation.
No notification, no reminder, no teacher needed —
the desire to WIN creates the desire to LEARN.
```

### Django Models — Updated for Personalised Battle Zone

```python
# game/models.py

class BattleSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    room_id = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20,
        choices=[('waiting','Waiting'),('active','Active'),('complete','Complete')],
        default='waiting')
    max_players = models.IntegerField(default=50)
    started_at = models.DateTimeField(null=True)
    ended_at = models.DateTimeField(null=True)
    winner = models.ForeignKey('GameUser', null=True, on_delete=models.SET_NULL)
    domains_present = models.JSONField(default=list)  # tracks which domains played


class PlayerBattleState(models.Model):
    session = models.ForeignKey(BattleSession, on_delete=models.CASCADE)
    player = models.ForeignKey('GameUser', on_delete=models.CASCADE)
    domain = models.CharField(max_length=100)          # 'Data Science' / 'Grade 11'
    question_domain_slug = models.CharField(max_length=50)  # 'data-science'
    hp = models.IntegerField(default=100)
    xp_earned = models.IntegerField(default=0)
    questions_correct = models.IntegerField(default=0)
    questions_wrong = models.IntegerField(default=0)
    topics_correct = models.JSONField(default=dict)
    topics_wrong = models.JSONField(default=dict)
    eliminated_by_question = models.ForeignKey('Question', null=True,
                                                on_delete=models.SET_NULL)
    rank = models.IntegerField(null=True)


class Question(models.Model):
    TOPICS = [
        # SeekhoWithRua course topics
        ('python', 'Python'),
        ('ml', 'Machine Learning'),
        ('web', 'Web Development'),
        ('data_science', 'Data Science'),
        ('devops', 'DevOps'),
        ('iot', 'IoT'),
        ('ai_ethics', 'AI Ethics'),
        # School syllabus topics (CBSE)
        ('physics_11', 'Physics Grade 11'),
        ('chemistry_11', 'Chemistry Grade 11'),
        ('maths_11', 'Maths Grade 11'),
        ('biology_11', 'Biology Grade 11'),
        ('physics_12', 'Physics Grade 12'),
        ('chemistry_12', 'Chemistry Grade 12'),
        ('maths_12', 'Maths Grade 12'),
        ('accounts_11', 'Accounts Grade 11'),
        ('economics_11', 'Economics Grade 11'),
        # Free user topics
        ('general_knowledge', 'General Knowledge'),
        ('current_affairs', 'Current Affairs'),
        ('english_basic', 'Basic English'),
        ('basic_math', 'Basic Maths'),
    ]
    GAMES = [
        ('hatimai', 'HatimAI'),
        ('battlezone', 'Battle Zone'),
        ('school_chhotu', 'School Chhotu'),
        ('school_hero', 'School Hero'),
        ('school_warrior', 'School Warrior'),
        ('all', 'All Games'),
    ]
    topic = models.CharField(max_length=50, choices=TOPICS)
    game = models.CharField(max_length=30, choices=GAMES, default='all')
    question_text = models.TextField()
    option_a = models.CharField(max_length=400)
    option_b = models.CharField(max_length=400)
    option_c = models.CharField(max_length=400)
    option_d = models.CharField(max_length=400)
    correct_answer = models.CharField(max_length=1)
    difficulty = models.IntegerField(default=1)
    explanation = models.TextField(blank=True)
    course_slug = models.CharField(max_length=100)
    created_by = models.CharField(max_length=100, default='admin')
    master_answer_note = models.TextField(blank=True)  # master@gmail.com only

    class Meta:
        ordering = ['?']


class PlayerDomainCache(models.Model):
    """Cache enrollment lookup to avoid calling main platform every battle"""
    user_id = models.UUIDField(unique=True)
    domain_slug = models.CharField(max_length=50)
    domain_label = models.CharField(max_length=100)
    cached_at = models.DateTimeField(auto_now=True)
    # Cache expires after 1 hour — re-check main platform
    # If student enrolls in new course during battle, next battle picks it up
```

### Elimination Screen — The Learning Moment

```javascript
// components/battlezone/EliminationScreen.jsx

export function EliminationScreen({ eliminatedBy, playerStats, domain }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, color: 'white', padding: '24px'
    }}>
      <div style={{ fontSize: '28px', color: '#ff4444', marginBottom: '6px' }}>
        Eliminated
      </div>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
        {domain} question defeated you
      </div>

      {/* The question that killed them */}
      <div style={{
        background: '#0d0d1a', border: '1px solid #2a2a3e',
        borderRadius: '12px', padding: '20px',
        maxWidth: '520px', width: '100%', marginBottom: '20px'
      }}>
        <div style={{ color: '#FFD700', fontSize: '11px',
                      marginBottom: '8px', letterSpacing: '1px' }}>
          {eliminatedBy.topic.replace('_', ' ').toUpperCase()}
        </div>
        <div style={{ fontSize: '17px', marginBottom: '14px', lineHeight: 1.5 }}>
          {eliminatedBy.question}
        </div>
        <div style={{ background: 'rgba(0,255,136,0.1)',
                      borderRadius: '8px', padding: '10px' }}>
          <div style={{ color: '#00ff88', fontSize: '13px' }}>
            Correct answer: {eliminatedBy.correct_answer_text}
          </div>
          {eliminatedBy.explanation && (
            <div style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
              {eliminatedBy.explanation}
            </div>
          )}
        </div>
      </div>

      {/* Study CTA — most important element */}
      <a
        href={`https://seekhowithrua.com/course/${eliminatedBy.course_slug}`}
        style={{
          background: '#00ff88', color: '#000',
          padding: '14px 36px', borderRadius: '8px',
          textDecoration: 'none', fontWeight: '700',
          fontSize: '16px', marginBottom: '20px',
          display: 'block', textAlign: 'center', maxWidth: '320px', width: '100%'
        }}
      >
        Study {eliminatedBy.topic_label} on SeekhoWithRua →
      </a>

      {/* Battle stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px', maxWidth: '320px', width: '100%',
        fontSize: '13px', color: '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#00ff88', fontSize: '22px', fontWeight: 700 }}>
            {playerStats.correct}
          </div>
          Correct answers
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ff4444', fontSize: '22px', fontWeight: 700 }}>
            {playerStats.wrong}
          </div>
          Wrong answers
        </div>
        <div style={{ textAlign: 'center', gridColumn: '1/-1' }}>
          <div style={{ color: '#FFD700', fontSize: '15px' }}>
            Weak area: {playerStats.worst_topic}
          </div>
          <div style={{ color: '#555', marginTop: '4px', fontSize: '12px' }}>
            Study this and survive longer next battle
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## GAME 3 — SCHOOL GAMES

### Covered in: 12_School_Games_Backend_Architecture.md

```
Three modes in same game:
- Chhotu Mode (age 6-10): cartoon jungle, tap answers
- Hero Mode (age 10-14): anime heroes, class vs class
- Warrior Mode (age 14-17): Free Fire mechanics

School questions use same Question model
topic field includes: math, science, history, english, general
game field: school_chhotu / school_hero / school_warrior

Django Channels required (100 player classroom battles)
See file 12 for complete architecture
```

---

## COMPLETE GAMING URL STRUCTURE

```
gaming.seekhowithrua.com/                    → Game lobby / selection
gaming.seekhowithrua.com/hatimai/            → HatimAI course selector
gaming.seekhowithrua.com/hatimai/data-science/quest/1  → Quest 1
gaming.seekhowithrua.com/hatimai/python/quest/1        → Python Quest 1
gaming.seekhowithrua.com/battlezone/         → Battle Zone lobby
gaming.seekhowithrua.com/battlezone/room/:id → Live battle
gaming.seekhowithrua.com/school/             → School game selector
gaming.seekhowithrua.com/school/chhotu/      → Age 6-10
gaming.seekhowithrua.com/school/hero/        → Age 10-14
gaming.seekhowithrua.com/school/warrior/     → Age 14-17
gaming.seekhowithrua.com/leaderboard/        → Global rankings
```

---

## DJANGO URLS FOR ALL GAMES

```python
# game/urls.py

urlpatterns = [
    # HatimAI — one per course
    path('api/hatimai/courses/', views.list_courses),
    path('api/hatimai/<slug:course_slug>/quests/', views.list_quests),
    path('api/hatimai/<slug:course_slug>/quest/<int:n>/', views.get_quest),
    path('api/hatimai/check-answer/', views.check_chain_answer),
    path('api/hatimai/humanoid/', views.get_humanoid_question),
    path('api/hatimai/humanoid/evaluate/', views.evaluate_humanoid),
    path('api/hatimai/databot-hint/', views.get_databot_hint),
    path('api/hatimai/save-progress/', views.save_progress),
    path('api/hatimai/certificate/<slug:course_slug>/', views.get_certificate),

    # Battle Zone
    path('api/battlezone/rooms/', views.list_open_rooms),
    path('api/battlezone/create/', views.create_room),
    path('api/battlezone/join/<str:room_id>/', views.join_room),
    path('api/battlezone/leaderboard/', views.battle_leaderboard),
    path('api/battlezone/my-stats/', views.player_battle_stats),

    # School
    path('api/school/session/create/', views.create_school_session),
    path('api/school/session/join/<str:code>/', views.join_school_session),
    path('api/school/teacher/dashboard/', views.teacher_dashboard),
    path('api/school/parent/report/', views.parent_report),

    # Shared
    path('api/game/profile/', views.get_game_profile),
    path('api/game/leaderboard/', views.global_leaderboard),
    path('api/game/questions/add/', views.add_question),  # admin only
]
```

---

*Document created: March 2026*
*Build sequence: HatimAI (per course) → Battle Zone → School Games*
*All in same gaming project: seekhowithrua-gaming*
*master@gmail.com sees all answers in debug panel across all three games*
