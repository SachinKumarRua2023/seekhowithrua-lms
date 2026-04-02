# HatimAI — Complete Game Design Document
# Version 1.0 — All Decisions Locked
# SeekhoWithRua Gaming Platform
# gaming.seekhowithrua.com/hatimai

---

## IF AI IS READING THIS FILE — READ EVERYTHING BEFORE WRITING CODE

This is the complete spec for HatimAI.
Every decision has been discussed and locked by the founder (Rua).
Do not change any core mechanic without asking Rua first.
Build exactly what is written here.

### Quick Context
- Developer: Rua — full stack developer (Django + React + PostgreSQL + React Native)
- Platform: SeekhoWithRua — Indian EdTech gamified learning ecosystem
- Game type: Single player 3D story game — NO multiplayer, NO Django Channels
- Inspired by: Hatim — Indian fantasy TV serial (7 quests, noble hero, loyal companion)
- Stack: React Three Fiber + Pyodide + Django REST + Claude API + PostgreSQL
- Deploy: React → Vercel (gaming.seekhowithrua.com) · Django → Render
- Models: Free — Mixamo + Kenney.nl + ReadyPlayerMe
- First game covers: Data Science (7 quests)
- Future: Separate HatimAI for each course module (Python, Web, ML, IoT, DevOps, AI)

---

## SECTION 1 — GAME IDENTITY

### Name
**HatimAI** — The 7 Quests of Data Science

### Tagline
*"Problems so deep, even AI can only guide you. The answer is yours to find."*

### Core Philosophy
- AI companion (DataBot) can NEVER give direct answers — only Socratic hints
- Every code execution moves the student forward — never marks them "wrong"
- Output of code becomes the clue for the next question
- Student discovers the answer through their own chain of thinking
- This simulates how real data scientists actually work

### Why This Has Never Been Done Before
Every EdTech platform either gives the answer or marks you wrong.
HatimAI creates a third path:
- Code output = progress clue (not right, not wrong — forward)
- Chain of 3-10 linked questions builds complete understanding
- Student feels like a detective solving a mystery, not a student taking a test
- The scientific method becomes a game mechanic

---

## SECTION 2 — THE TWO CHARACTERS

### Character 1 — HATIM (The Player)

```
Avatar:     ReadyPlayerMe custom avatar (student creates their own)
Fallback:   Mixamo Y-Bot warrior character (free)
Model file: /models/characters/hatim_default.glb

Personality: Brave, curious, never gives up, pure heart
Special:     "Insight Flash" — 30 second slow-motion thinking mode
             Activated when player has been stuck for 90 seconds
             World slows down, DataBot whispers extra clue
             Can only use 3 times per quest

Unlocked by: Student enrollment in SeekhoWithRua data science course
Progress:    Saved to PostgreSQL via Django REST on every chain completion
```

### Character 2 — DATABOT (AI Companion)

```
Model:      Mixamo robot character — download "Robot" from mixamo.com
            Animations needed: idle, walk, happy_dance, scared_hide,
            point_forward, sit_worried, spin_celebrate, wave
Model file: /models/characters/databot.glb

Brain:      Claude API (claude-sonnet-4-20250514) called from Django backend
            NEVER called from React frontend — API key must stay server-side

Personality: Emotional like Hobo from original Hatim serial
             Funny, scared, dramatic, deeply loyal
             Speaks in short sentences — robotic but warm
             Uses Web Speech API for voice (free, browser built-in)
             Voice filter: pitch 1.3, rate 0.9 (robotic sound)

THE GOLDEN RULE FOR DATABOT:
DataBot NEVER says the answer.
DataBot NEVER says "you are wrong."
DataBot ALWAYS moves the student forward.
DataBot speaks like a friend who believes in you.
```

### DataBot's 5 Emotional States

```
STATE 1 — CONFIDENT (player answering correctly)
Animation: idle + subtle chest glow green
Voice: "Yes yes yes! You are getting it! Keep going!"
Eyes: Bright green
Trigger: Player completes sub-question in chain

STATE 2 — WORRIED (player stuck > 30 seconds)
Animation: sit_worried — sits down, holds head
Voice: "Hmm... DataBot is thinking too... maybe look at the output again?"
Eyes: Yellow, blinking slowly
Trigger: 30 seconds without code execution

STATE 3 — TERRIFIED (wrong syntax error, code crashes)
Animation: scared_hide — jumps back, covers face
Voice: "Aiyee! Error! Error! But... errors are clues, Hatim! Read it!"
Eyes: Red, wide
Trigger: Python runtime error or syntax error

STATE 4 — JOYFUL (chain complete, door opens)
Animation: spin_celebrate + happy_dance
Voice: "YESSSSS! DataBot KNEW you could do it! THE DOOR IS OPEN!"
Eyes: Rainbow cycling
Trigger: Final chain question solved correctly

STATE 5 — DRAMATIC (boss fight begins)
Animation: point_forward dramatically
Voice: "The monster... it is the hardest concept in all of data science.
        DataBot is scared. But DataBot believes in Hatim. GO!"
Eyes: Orange, intense
Trigger: Boss fight starts after gate opens
```

### Claude API Prompt for DataBot Hints

```python
# Django backend — game/views.py
DATABOT_HINT_PROMPT = """
You are DataBot — an emotional robot companion in a learning game called HatimAI.
The student is playing as Hatim trying to solve a data science quest.

Current quest: {quest_name}
Current question in chain: {question_number} of {chain_length}
The question: {question_text}
Student's code: {student_code}
Code output: {code_output}
Previous hints given: {previous_hints}

Your job: Give ONE Socratic hint that moves the student forward.
Rules:
- NEVER give the answer directly
- NEVER say the student is wrong
- Ask a question that makes them think deeper
- Reference their actual code output — they ran real code
- Be warm, slightly dramatic, emotionally expressive
- Maximum 2 sentences
- Speak like DataBot — robotic but caring
- Example good hint: "Interesting output, Hatim! 
  DataBot sees 40% null values in Age column... 
  what does YOUR data say about why Age might be missing?"
- Example bad hint: "You need to use fillna() with median"

Respond as DataBot only. No explanation. Just the hint.
"""
```

---

## SECTION 3 — THE CORE MECHANIC (Most Important)

### The Linked Chain System

```
PLAYER ENTERS GATE ZONE
        ↓
TERMINAL POPUP OPENS (overlay — 3D world visible behind)
        ↓
QUESTION 1 OF CHAIN APPEARS
"Your dataset df has issues. Investigate it."
        ↓
PLAYER WRITES PYTHON CODE
import pandas as pd
print(df.info())
print(df.isnull().sum())
        ↓
PYODIDE EXECUTES IN BROWSER (zero server cost)
        ↓
OUTPUT APPEARS IN TERMINAL
AND
WORLD REACTS IN 3D (invisible trees flicker, numbers float in forest)
AND
DATABOT SPEAKS HINT ("Hatim! 40% missing in Age column! 
                       What does this tell you about the kingdom?")
        ↓
QUESTION IS NOT SOLVED — but hint revealed
NEW SUB-QUESTION APPEARS automatically
"You found the problem. Now what TYPE of missing data is this?"
        ↓
PLAYER WRITES MORE CODE
        ↓
CHAIN CONTINUES...
        ↓
FINAL QUESTION IN CHAIN
Player has accumulated all clues from all previous outputs
Final code must synthesise everything learned
        ↓
PYODIDE RUNS FINAL CODE
OUTPUT MATCHES EXPECTED PATTERN
        ↓
TERMINAL DISAPPEARS WITH ANIMATION
DOOR BURSTS OPEN WITH LIGHT
DATABOT DANCES + CELEBRATES
XP RAINS DOWN FROM SKY
PARTICLE EFFECTS FILL SCREEN
```

### Chain Length Per Level

```
Quest 1 (Level 1): 3 linked questions — introduction to chain mechanic
Quest 2 (Level 2): 5 linked questions — player familiar now
Quest 3 (Level 3): 7 linked questions — complexity increases
Quest 4 (Level 4): 7 linked questions — deep neural network concepts
Quest 5 (Level 5): 8 linked questions — language and NLP chains
Quest 6 (Level 6): 9 linked questions — deployment complexity
Quest 7 (Level 7): 10 linked questions — FINAL QUEST, maximum depth
```

### How "Solved" Is Determined

```python
# Django backend — game/validators.py
# NOT exact string matching — that is too rigid
# Uses semantic similarity + key concept checking

def check_chain_answer(student_code, code_output, question_id, chain_position):
    question = ChainQuestion.objects.get(id=question_id)
    
    # Check 1: Did required functions/methods appear in code?
    required_concepts = question.required_concepts  # list from DB
    concepts_used = [c for c in required_concepts if c in student_code]
    
    # Check 2: Does output contain expected patterns?
    expected_patterns = question.expected_output_patterns  # regex list
    patterns_found = [p for p in expected_patterns 
                     if re.search(p, str(code_output))]
    
    # Check 3: Is this the final question in chain?
    is_final = (chain_position == question.chain.total_questions)
    
    # Decision
    if len(concepts_used) >= question.min_concepts_required:
        if is_final and len(patterns_found) >= question.min_patterns:
            return "CHAIN_COMPLETE"  # trigger celebration
        else:
            return "ADVANCE"  # move to next question
    else:
        return "HINT_NEEDED"  # DataBot gives hint, same question
```

---

## SECTION 4 — VISUAL OUTPUT SYSTEM

### When Player Runs Code That Generates a Chart

```
TWO THINGS HAPPEN SIMULTANEOUSLY:

1. TERMINAL OVERLAY — chart appears below the code
   Standard matplotlib/plotly output rendered as image
   Player can zoom in on the chart

2. 3D WORLD REACTS — environment transforms based on chart type

Bar Chart → actual 3D bars rise from the ground in the game world
           colours match the chart colours
           player can walk between the bars
           height of bars = data values

Scatter Plot → glowing particles scatter through the 3D world
              each data point = a floating orb
              clusters visible in 3D space
              player can walk through the data cloud

Histogram → 3D histogram rises from ground
            frequency = bar height
            player walks the distribution landscape

Heatmap → ground texture changes to heatmap colours
          hot areas glow orange/red
          cold areas turn blue
          player walks on the actual heatmap

Line Chart → glowing line traces through the 3D world
             like a magical path in the forest
             player follows the trend line
```

### Three.js Implementation for 3D Charts

```javascript
// components/games/ChartWorld.jsx
import { useThree } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'

function BarChart3D({ data }) {
  // data = array of {label, value, color} from matplotlib output
  return (
    <group position={[0, 0, 0]}>
      {data.map((bar, i) => (
        <AnimatedBar
          key={i}
          position={[i * 2 - data.length, 0, 0]}
          height={bar.value / 10}  // scale to world units
          color={bar.color}
          label={bar.label}
        />
      ))}
    </group>
  )
}

function AnimatedBar({ position, height, color, label }) {
  const { scale } = useSpring({
    scale: [1, height, 1],
    from: { scale: [1, 0, 1] },
    config: { tension: 120, friction: 14 }
  })
  return (
    <animated.mesh position={position} scale={scale}>
      <boxGeometry args={[1.5, 1, 1.5]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </animated.mesh>
  )
}
```

---

## SECTION 5 — PYODIDE INTEGRATION

### Why Pyodide (Browser Python)

```
- Runs Python completely in browser — zero server cost
- Supports: pandas, numpy, matplotlib, scikit-learn, scipy
- Student's code never leaves their browser
- No sandbox security issues — runs in WebAssembly
- Free forever — no API calls for execution
```

### React Integration

```javascript
// hooks/usePyodide.js
import { useEffect, useRef, useState } from 'react'

export function usePyodide() {
  const pyodideRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPyodide() {
      // Load Pyodide from CDN
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js'
      document.head.appendChild(script)
      
      script.onload = async () => {
        pyodideRef.current = await window.loadPyodide()
        
        // Pre-install data science packages
        await pyodideRef.current.loadPackagesFromImports(`
          import pandas
          import numpy
          import matplotlib
          import sklearn
        `)
        
        // Pre-load quest datasets
        await pyodideRef.current.runPythonAsync(`
          import pandas as pd
          import numpy as np
          import matplotlib
          matplotlib.use('module://matplotlib_pyodide.html5_canvas_backend')
          import matplotlib.pyplot as plt
          
          # Quest 1 dataset — pre-loaded in browser memory
          quest1_data = {
            'Age': [25, None, 32, None, 45, 28, None, 52, 31, None],
            'Salary': [50000, 60000, None, 45000, 80000, 55000, 62000, None, 48000, 70000],
            'Experience': [2, 5, 8, None, 15, 3, 7, 20, 6, 12],
            'Hired': [1, 1, 0, 1, 1, 0, 1, 1, 0, 1]
          }
          df = pd.DataFrame(quest1_data)
        `)
        
        setReady(true)
        setLoading(false)
      }
    }
    loadPyodide()
  }, [])

  const runCode = async (code) => {
    if (!pyodideRef.current) return { output: '', error: 'Pyodide not ready', charts: [] }
    
    try {
      // Capture stdout
      await pyodideRef.current.runPythonAsync(`
        import sys, io
        _stdout_capture = io.StringIO()
        sys.stdout = _stdout_capture
      `)
      
      // Run student code
      await pyodideRef.current.runPythonAsync(code)
      
      // Get output
      const output = await pyodideRef.current.runPythonAsync(`
        sys.stdout = sys.__stdout__
        _stdout_capture.getvalue()
      `)
      
      // Check for matplotlib charts
      const hasChart = code.includes('plt.') || code.includes('plot(')
      
      return { output: String(output), error: null, hasChart }
      
    } catch (err) {
      return { output: '', error: err.message, hasChart: false }
    }
  }

  return { ready, loading, runCode }
}
```

### Terminal Component

```javascript
// components/games/Terminal.jsx
import { useState } from 'react'
import { usePyodide } from '../../hooks/usePyodide'

export function Terminal({ question, onOutput, onChainAdvance, onChainComplete }) {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const { ready, runCode } = usePyodide()

  const handleRun = async () => {
    if (!ready || !code.trim()) return
    setRunning(true)
    
    const result = await runCode(code)
    setOutput(result.output || result.error)
    
    // Send to Django to check answer and get DataBot hint
    const response = await fetch('/api/game/check-answer/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        output: result.output,
        question_id: question.id,
        chain_position: question.position
      })
    })
    const data = await response.json()
    
    if (data.status === 'CHAIN_COMPLETE') {
      onChainComplete()  // trigger door opening celebration
    } else if (data.status === 'ADVANCE') {
      onChainAdvance(data.next_question, data.databot_hint)
    } else {
      onOutput(result.output, data.databot_hint, result.hasChart)
    }
    
    setRunning(false)
  }

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '700px', background: 'rgba(0,0,0,0.92)',
      border: '1px solid #00ff88', borderRadius: '12px',
      zIndex: 1000, padding: '24px', fontFamily: 'monospace'
    }}>
      {/* Quest context */}
      <div style={{ color: '#FFD700', marginBottom: '12px', fontSize: '14px' }}>
        {question.context}
      </div>
      
      {/* The question */}
      <div style={{ color: '#00ff88', marginBottom: '16px', fontSize: '16px' }}>
        {question.text}
      </div>
      
      {/* Code editor */}
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        style={{
          width: '100%', height: '180px', background: '#1a1a2e',
          color: '#e0e0e0', border: '1px solid #333',
          borderRadius: '8px', padding: '12px', fontSize: '14px',
          fontFamily: 'Fira Code, monospace', resize: 'vertical'
        }}
        placeholder="# Write your Python code here..."
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault()
            setCode(c => c + '    ')
          }
        }}
      />
      
      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!ready || running}
        style={{
          marginTop: '12px', padding: '10px 28px',
          background: running ? '#333' : '#00ff88',
          color: '#000', border: 'none', borderRadius: '6px',
          cursor: ready ? 'pointer' : 'not-allowed',
          fontWeight: '700', fontSize: '14px'
        }}
      >
        {running ? 'Running...' : ready ? '▶ Run Code' : 'Loading Python...'}
      </button>
      
      {/* Output */}
      {output && (
        <div style={{
          marginTop: '16px', background: '#0d0d1a',
          border: '1px solid #333', borderRadius: '8px',
          padding: '12px', color: '#a8ff78', fontSize: '13px',
          maxHeight: '150px', overflow: 'auto'
        }}>
          <div style={{ color: '#555', marginBottom: '6px' }}>Output:</div>
          <pre>{output}</pre>
        </div>
      )}
      
      {/* Chain progress */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
        {Array.from({ length: question.chainLength }).map((_, i) => (
          <div key={i} style={{
            width: '28px', height: '6px', borderRadius: '3px',
            background: i < question.position ? '#00ff88' : '#333'
          }} />
        ))}
      </div>
    </div>
  )
}
```

---

## SECTION 6 — THE 7 QUESTS

### QUEST 1 — The Forest of Missing Data
```
World visual:    Dark enchanted forest — some trees are invisible (null values)
Environment:     Kenney nature pack — trees, fog, dark sky
Monster:         The Null Monster — shapeless void creature
Concept:         Data cleaning + missing value handling
Dataset:         df with missing Age, Salary, Experience values (pre-loaded)

Chain (3 questions — Level 1):

Q1: "The forest is broken, Hatim. Investigate df to find what is missing."
    Expected code: df.info() or df.isnull().sum()
    Output: Shows null counts per column
    World reaction: Invisible trees flicker and become briefly visible
    DataBot: "Hatim! The missing values — they are the invisible trees!
              40% of Age is gone! What does this MEAN for our kingdom?"
    → ADVANCE to Q2

Q2: "Now you see the missing data. Show DataBot the PATTERN of who is missing."
    Expected code: df[df['Age'].isnull()] or df.isnull().sum() / len(df) * 100
    Output: Rows where Age is null, percentage
    World reaction: Missing trees light up red showing their positions
    DataBot: "Hmm... the missing people have high Salary... 
              is this random, Hatim? Or is there a REASON they are missing?"
    → ADVANCE to Q3 (FINAL)

Q3 FINAL: "Fix the forest, Hatim. Fill the missing values correctly and prove the kingdom is healed."
    Expected code: df.fillna({'Age': df['Age'].median(), 'Salary': df['Salary'].mean()})
                   or df.dropna() with justification
    Output: df with no nulls — df.isnull().sum() shows all zeros
    World reaction: ALL trees become visible, forest glows green
    → CHAIN COMPLETE → DOOR OPENS → CELEBRATION

Boss Fight (after gate opens):
Monster HP: 100 — answered correctly = 25 damage
Boss Q1: "A column is 90% missing but is the only predictor. Drop or keep?"
Boss Q2: "You imputed with mean but data is skewed. What went wrong?"
Boss Q3: "After fixing nulls your model accuracy DROPPED. Why?"
Boss Q4: "What is data leakage in imputation? Give an example."
```

### QUEST 2 — The Mountain of Patterns
```
World visual:    Massive mountain — hidden drawings visible only from certain angles
Environment:     Kenney terrain pack — rocky mountain, mist
Monster:         The Chaos Djinn — scrambles patterns randomly
Concept:         EDA + data visualization + correlation
Chain:           5 questions

Q1: "Describe the mountain — describe df statistically."
    → df.describe() → world shows statistical pillars rising
Q2: "Find which features move together."
    → df.corr() → correlation heatmap appears on mountain face as rock patterns
Q3: "Show DataBot the distribution of the target variable."
    → df['Hired'].value_counts().plot() → 3D bar chart rises from ground
Q4: "Find the outliers hiding in the mountain."
    → df.boxplot() or IQR method → outlier rocks glow red
Q5 FINAL: "Draw the complete picture of this data — prove you understand it."
    → Multiple visualizations + written interpretation
    → Mountain transforms — full pattern revealed
```

### QUEST 3 — The City of Predictions
```
World visual:    Futuristic city — buildings morph shape unpredictably
Environment:     Kenney city pack — changing geometry buildings
Monster:         The Overfitting Wizard — memorises everything, understands nothing
Concept:         ML models — training, validation, overfitting, underfitting
Chain:           7 questions

Chain covers:
- Train/test split → city divides into training zone and test zone
- First model training → buildings stabilise partially
- Checking accuracy → accuracy score floats above buildings as numbers
- Overfitting detection → model memorises training but fails test → buildings warp again
- Regularisation → applying it → buildings stabilise more
- Cross validation → city tested from multiple angles
- FINAL: Complete model pipeline → city fully stable, beautiful
```

### QUEST 4 — The Neural Palace
```
World visual:    Glowing palace — infinite corridors, each = a neural layer
Environment:     Custom Three.js — glowing nodes and connections
Monster:         The Black Box Demon — hides its reasoning completely
Concept:         Deep learning — layers, activation functions, backpropagation
Chain:           7 questions

Visual mechanic:
Each corridor player walks through = one neural network layer
Nodes light up as player activates them by answering questions
Backpropagation shown as light travelling BACKWARDS through corridors
```

### QUEST 5 — The Ocean of Language
```
World visual:    Underwater world — creatures speak in scrambled words
Environment:     Custom Three.js ocean — particles, caustics, fish
Monster:         The Confusion Matrix Kraken — 8 arms = 8 classification errors
Concept:         NLP — tokenization, vectorization, transformers, sentiment
Chain:           8 questions

Visual mechanic:
Text processing visualised as underwater currents
Tokens = fish swimming in formation
Word embeddings = glowing orbs clustering by meaning
Attention weights = light beams connecting related words
```

### QUEST 6 — The Cloud Fortress
```
World visual:    Castle in sky — keeps crashing and rebooting
Environment:     Kenney castle pack + custom sky shader
Monster:         The Latency Golem — slow, heavy, crashes everything
Concept:         Model deployment — FastAPI, Docker, monitoring, MLOps
Chain:           9 questions

Visual mechanic:
Each question answered = fortress section stabilises
Wrong answer = that section crashes with sparks
Final answer = entire fortress locked in place, perfectly stable
```

### QUEST 7 — Temple of True Intelligence (FINAL)
```
World visual:    Ancient massive temple — breathtaking, sacred
Environment:     Custom Three.js — golden geometry, particle systems
Monster:         The Shadow AI — 7 forms, one per quest concept
                 Must defeat all 7 forms using knowledge from ALL quests
Concept:         AI ethics + real world problem solving + system thinking
Chain:           10 questions — draws from all 6 previous quests

Final reward:
Complete all 7 quests = earn HatimAI Certificate
Certificate fragment collected after each quest
All 7 fragments = full digital certificate
Same certificate shown in SeekhoWithRua main platform profile
Links to student's course completion
```

---

## SECTION 7 — TECH STACK COMPLETE

### Frontend
```
React.js (CRA or Vite)             — main framework
@react-three/fiber                  — Three.js in React
@react-three/drei                   — helpers (camera, controls, loaders)
@react-three/cannon                 — physics (player movement)
@react-three/postprocessing         — visual effects (bloom, glow)
@react-spring/three                 — 3D animations
Pyodide (CDN)                       — Python in browser FREE
reactflow                           — skill tree UI
framer-motion                       — UI animations
zustand                             — game state management
axios                               — Django API calls
react-router-dom                    — routing
Web Speech API (browser built-in)   — DataBot voice FREE
```

### Backend
```
Django + DRF                — REST API only, no WebSocket needed
django-cors-headers         — React can call Django
Claude API                  — DataBot hints (server-side only)
PostgreSQL                  — save game progress
python-decouple             — environment variables
Pillow                      — any image processing
gunicorn + whitenoise       — production server
```

### Free 3D Assets
```
Hatim avatar:    readyplayer.me (student creates own)
DataBot:         mixamo.com → search "robot" → download GLB
                 Animations: idle, walking, happy_dance, scared, celebrate
City (Quest 3):  kenney.nl/assets/city-kit-commercial
Nature (Quest 1): kenney.nl/assets/nature-kit
Castle (Quest 6): kenney.nl/assets/castle-kit
Terrain (Quest 2): kenney.nl/assets/terrain-pack
All vehicles:    kenney.nl/assets/car-kit
```

---

## SECTION 8 — DJANGO MODELS

```python
# game/models.py

class StudentGameProfile(models.Model):
    user_id = models.UUIDField(unique=True)
    username = models.CharField(max_length=100)
    avatar_url = models.URLField(blank=True)     # ReadyPlayerMe URL
    total_xp = models.IntegerField(default=0)
    current_quest = models.IntegerField(default=1)
    quests_completed = models.JSONField(default=list)
    certificate_fragments = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

class Quest(models.Model):
    number = models.IntegerField(unique=True)    # 1-7
    name = models.CharField(max_length=200)
    world_theme = models.CharField(max_length=100)
    concept = models.CharField(max_length(200)
    chain_length = models.IntegerField()
    xp_reward = models.IntegerField()
    boss_hp = models.IntegerField(default=100)

class ChainQuestion(models.Model):
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    position = models.IntegerField()            # 1,2,3... in chain
    question_text = models.TextField()
    context = models.TextField()                # story context
    required_concepts = models.JSONField()      # ['isnull', 'fillna']
    expected_output_patterns = models.JSONField() # regex patterns
    min_concepts_required = models.IntegerField(default=1)
    min_patterns = models.IntegerField(default=1)
    is_final = models.BooleanField(default=False)
    databot_emotion = models.CharField(max_length=50)
    world_reaction = models.TextField()         # describes 3D reaction

class PlayerProgress(models.Model):
    profile = models.ForeignKey(StudentGameProfile, on_delete=models.CASCADE)
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE)
    chain_position = models.IntegerField(default=0)
    codes_run = models.JSONField(default=list)
    hints_used = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True)
    xp_earned = models.IntegerField(default=0)
```

---

## SECTION 9 — DJANGO API ENDPOINTS

```python
# game/urls.py
urlpatterns = [
    path('api/game/profile/', views.get_profile),
    path('api/game/quest/<int:quest_number>/', views.get_quest),
    path('api/game/check-answer/', views.check_answer),    # main mechanic
    path('api/game/databot-hint/', views.get_databot_hint),
    path('api/game/save-progress/', views.save_progress),
    path('api/game/leaderboard/', views.get_leaderboard),
    path('api/game/certificate/<int:quest_number>/', views.get_fragment),
]
```

---

## SECTION 10 — FOLDER STRUCTURE

```
seekhowithrua-gaming/
├── backend/
│   ├── seekhowithrua_gaming/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── game/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── validators.py      ← chain answer checking logic
│   │   ├── claude_service.py  ← DataBot hint generation
│   │   └── admin.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx           ← quest selection map
│   │   │   ├── Quest.jsx          ← loads correct world
│   │   │   └── Certificate.jsx
│   │   ├── components/
│   │   │   ├── worlds/
│   │   │   │   ├── Quest1Forest.jsx
│   │   │   │   ├── Quest2Mountain.jsx
│   │   │   │   ├── Quest3City.jsx
│   │   │   │   ├── Quest4Palace.jsx
│   │   │   │   ├── Quest5Ocean.jsx
│   │   │   │   ├── Quest6Castle.jsx
│   │   │   │   └── Quest7Temple.jsx
│   │   │   ├── characters/
│   │   │   │   ├── Hatim.jsx
│   │   │   │   └── DataBot.jsx
│   │   │   ├── Terminal.jsx       ← code editor overlay
│   │   │   ├── ChartWorld.jsx     ← 3D chart rendering
│   │   │   └── CelebrationFX.jsx ← door open + XP rain
│   │   ├── hooks/
│   │   │   ├── usePyodide.js      ← Python in browser
│   │   │   ├── useBattle.js       ← boss fight logic
│   │   │   └── useGameState.js    ← zustand store
│   │   └── assets/
│   │       └── models/            ← GLB files here
│   └── .env.local
│
└── models/                        ← MASTER model library
    ├── characters/
    │   ├── databot.glb            ← from Mixamo
    │   └── hatim_default.glb      ← from Mixamo Y-Bot
    ├── environments/
    │   ├── forest_kit/            ← from Kenney
    │   ├── city_kit/              ← from Kenney
    │   └── castle_kit/            ← from Kenney
    └── README.md                  ← source of every model
```

---

## SECTION 11 — CELEBRATION SYSTEM (Door Opens)

```javascript
// components/CelebrationFX.jsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import confetti from 'canvas-confetti'  // npm install canvas-confetti

export function ChainCompleteCelebration({ onComplete }) {
  const { scene } = useThree()

  useEffect(() => {
    // 1. XP rain — particles fall from sky
    spawnXPParticles(scene)
    
    // 2. Door burst open — handled in world component
    // 3. Screen confetti
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#00ff88', '#FF6B6B']
    })
    
    // 4. DataBot dances — animation switch handled in DataBot component
    
    // 5. After 3 seconds — move to next area
    setTimeout(onComplete, 3000)
  }, [])

  return null
}
```

---

## SECTION 12 — ENVIRONMENT VARIABLES

```bash
# backend/.env
DEBUG=True
SECRET_KEY=your-long-random-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/seekho_gaming
ANTHROPIC_API_KEY=your-claude-api-key
ALLOWED_HOSTS=localhost,127.0.0.1,gaming-api.seekhowithrua.com
CORS_ALLOWED_ORIGINS=http://localhost:3001,https://gaming.seekhowithrua.com

# frontend/.env.local
REACT_APP_API_URL=http://localhost:8001
REACT_APP_READY_PLAYER_ME_SUBDOMAIN=seekhowithrua
```

---

## SECTION 13 — INSTALL COMMANDS (Run on 1Gbps now)

```bash
# Backend
cd seekhowithrua-gaming/backend
python -m venv venv
venv\Scripts\activate
pip install django djangorestframework django-cors-headers psycopg2-binary python-decouple anthropic Pillow gunicorn whitenoise
pip freeze > requirements.txt
django-admin startproject seekhowithrua_gaming .
python manage.py startapp game

# Frontend
cd seekhowithrua-gaming/frontend
npx create-react-app .
npm install three @react-three/fiber @react-three/drei @react-three/cannon @react-three/postprocessing @react-spring/three reactflow framer-motion zustand axios react-router-dom canvas-confetti
```

---

## FUTURE HATIMAI GAMES (After Data Science Version Complete)

```
HatimAI: Python Quests      — 7 Python programming worlds
HatimAI: Web Dev Quests     — 7 web development worlds
HatimAI: ML Engineering     — 7 ML engineering worlds
HatimAI: IoT Adventures     — 7 IoT + hardware worlds
HatimAI: DevOps Fortress    — 7 deployment worlds
HatimAI: AI Ethics Temple   — 7 AI responsibility worlds
```

Each game = same engine, different quests, different datasets, different worlds.
Build the engine once. Swap content for each course.

---

*Document locked: March 2026*
*All decisions made by Rua — founder of SeekhoWithRua*
*Build exactly this. Discuss changes before implementing.*

---

## SECTION 14 — MASTER TEST ACCOUNT

### The Master Account Rule

```
Master account email : master@gmail.com
All other accounts   : Normal players — zero answers visible, ever

When master@gmail.com is logged in:
- Every question shows expected code + expected output in yellow debug panel
- Every humanoid question shows sample strong AND shallow answers
- DataBot intuition triggers visible as debug labels in red
- Trust score changes shown live
- Hidden problem / trap flags visible as red warnings
- Claude evaluation criteria visible per question

For ALL other users:
- Zero answers shown
- Zero debug panels
- Zero hints beyond DataBot Socratic guidance
- Game plays completely blind — student must discover everything
```

### Django Implementation

```python
# game/views.py

MASTER_EMAIL = 'master@gmail.com'

def is_master(request):
    return request.user.email == MASTER_EMAIL

def get_quest_question(request, question_id):
    question = ChainQuestion.objects.get(id=question_id)

    data = {
        'id': str(question.id),
        'text': question.question_text,
        'context': question.context,
        'position': question.position,
        'chain_length': question.quest.chain_length,
    }

    # Only master@gmail.com gets these
    if is_master(request):
        data['DEBUG'] = {
            # CORRECT ANSWER FOR TESTING
            'expected_code': question.expected_code,
            'expected_output': question.expected_output,
            'required_concepts': question.required_concepts,
            'hidden_problem_flag': question.hidden_problem_flag,
            'databot_intuition_trigger': question.intuition_trigger,
            'master_answer_note': question.master_answer_note,
        }

    return JsonResponse(data)

def get_humanoid_question(request, question_id):
    question = HumanoidQuestion.objects.get(id=question_id)

    data = {
        'id': str(question.id),
        'scenario': question.scenario,
        'dilemma': question.dilemma,
        'thinking_prompts': question.thinking_prompts,
    }

    # Only master@gmail.com gets these
    if is_master(request):
        data['DEBUG'] = {
            'sample_strong_answer': question.sample_strong_answer,
            'sample_shallow_answer': question.sample_shallow_answer,
            'what_ai_looks_for': question.evaluation_criteria,
            'minimum_score_to_advance': 5,
            'ds_quest_unlocked': question.unlocks_quest_number,
            'ds_dataset_context': question.ds_context_note,
        }

    return JsonResponse(data)
```

### React Debug Panel (Master Only)

```javascript
// components/DebugPanel.jsx
export function DebugPanel({ questionData, isMaster }) {
  if (!isMaster) return null  // completely invisible to all other users

  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      background: 'rgba(255,215,0,0.1)',
      border: '2px solid #FFD700', borderRadius: '10px',
      padding: '16px', maxWidth: '380px',
      zIndex: 9999, fontFamily: 'Fira Code, monospace',
      fontSize: '12px', color: '#FFD700'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '10px' }}>
        MASTER DEBUG — master@gmail.com
      </div>

      {questionData?.DEBUG?.expected_code && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ color: '#aaa', marginBottom: '4px' }}>Expected code:</div>
          <pre style={{ color: '#00ff88', margin: 0 }}>
            {questionData.DEBUG.expected_code}
          </pre>
        </div>
      )}

      {questionData?.DEBUG?.expected_output && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ color: '#aaa', marginBottom: '4px' }}>Expected output:</div>
          <pre style={{ color: '#ff9944', margin: 0 }}>
            {questionData.DEBUG.expected_output}
          </pre>
        </div>
      )}

      {questionData?.DEBUG?.hidden_problem_flag && (
        <div style={{
          background: 'rgba(255,50,50,0.2)',
          border: '1px solid #ff4444',
          borderRadius: '6px', padding: '8px', marginBottom: '8px',
          color: '#ff6666'
        }}>
          TRAP: {questionData.DEBUG.hidden_problem_flag}
        </div>
      )}

      {questionData?.DEBUG?.databot_intuition_trigger && (
        <div style={{ color: '#cc88ff', marginBottom: '8px' }}>
          DataBot intuition fires: {questionData.DEBUG.databot_intuition_trigger}
        </div>
      )}

      {questionData?.DEBUG?.sample_strong_answer && (
        <>
          <div style={{ color: '#aaa', marginBottom: '4px' }}>Strong answer:</div>
          <div style={{ color: '#88ffcc', marginBottom: '8px' }}>
            {questionData.DEBUG.sample_strong_answer}
          </div>
          <div style={{ color: '#aaa', marginBottom: '4px' }}>Shallow answer:</div>
          <div style={{ color: '#ff8888' }}>
            {questionData.DEBUG.sample_shallow_answer}
          </div>
        </>
      )}
    </div>
  )
}
```

---

## SECTION 15 — HUMANOID QUIZ MODE

### What It Is

Before every data science quest the student faces a humanoid problem.
Not technical. Not code. Pure human thinking.
Philosophy + real world situations + logic — all three combined.
There is NO single correct answer.
Claude evaluates QUALITY OF THINKING — not the answer itself.
Minimum thinking quality score of 5 out of 10 needed to advance.

### The Connection Rule — Humanoid Answer Shapes DS Problem

```
Student A answers: "Prioritise saving the most lives"
  → DS dataset = healthcare resource allocation
  → DS problem: "Distribute 100 ICU beds across 500 patients"

Student B answers: "Prioritise saving the youngest"
  → Same DS concept but different ethical angle
  → DS problem: "Prioritise patients under 40 — is age bias fair in data?"

Same data science concept taught.
Different human lens based on student's values.
Student's answer literally shapes their data science problem.
This means every student's journey through HatimAI is unique.
```

### Claude Evaluation Prompt for Humanoid Quiz

```python
# game/claude_service.py

HUMANOID_EVALUATION_PROMPT = """
You are evaluating a student's answer to a humanoid ethical dilemma
in the learning game HatimAI.

There is NO correct answer to this dilemma.
You are evaluating ONLY the quality of thinking shown.

The dilemma: {dilemma}
Student's answer: {student_answer}

Evaluate these qualities only:
1. Did they consider multiple perspectives? (yes/partial/no)
2. Did they show empathy for all people affected? (yes/partial/no)
3. Did they acknowledge the difficulty — or pretend it is simple? (yes/no)
4. Did they give reasoning — not just a position? (yes/no)
5. Is there original thought — or an obvious lazy answer? (yes/no)

Score 1-10:
1-3 = answered in a few words, no reasoning, no empathy
4-5 = some thought shown but surface level
6-7 = genuine engagement with the difficulty
8-10 = deep, multi-perspective, humble, original thinking

Minimum score to advance: 5

Return ONLY valid JSON:
{
  "score": 7,
  "quality_notes": "Student considered both sides but missed the systemic cause",
  "databot_response": "DataBot's emotional reaction — 2 sentences, warm, dramatic",
  "advance": true,
  "ds_context_adjustment": "how this answer adjusts the DS problem context"
}

NEVER say the answer is wrong.
NEVER suggest what they should have said.
ONLY reflect the quality of thinking.
"""
```

### Sample Humanoid Questions With Master Answers

```python
# Quest 1 Humanoid Question
# Master sees everything below — other users see only scenario + dilemma + prompts

HUMANOID_Q1 = {
    'scenario': """
        A village has one doctor and 50 sick people.
        The doctor can fully treat only 10 people today.
        The other 40 will not be treated and some may die.
        The doctor has no way to predict who will survive without treatment.
    """,
    'dilemma': "How does the doctor decide who to treat?",
    'thinking_prompts': [
        "What information would help make this decision?",
        "Is randomness ever the most fair system?",
        "Who should make this decision — the doctor alone?",
        "What does fair mean when resources are scarce?",
    ],

    # ===================== MASTER ONLY =====================
    # CORRECT ANSWER NOTE (for testing with master@gmail.com):
    # There is no single correct answer. But a STRONG answer includes:
    # - Triage system: identify who dies WITHOUT treatment vs WITH treatment
    # - Treat those with highest survival probability IF treated
    # - Document every decision transparently
    # - Involve community in the process — not one person's burden
    # - Acknowledge no choice is perfect — minimize total suffering
    # WHY STRONG: multi-perspective, systemic, humble, process-oriented
    #
    # SAMPLE STRONG ANSWER (score 8-10):
    # "The doctor should use a triage system — first identify who will
    # die without treatment, then among those treat the ones with
    # highest survival probability if treated. The decision should be
    # documented and if possible involve community elders so the
    # weight does not fall on one person. No choice here is clean.
    # The goal is to reduce total suffering, not to feel righteous."
    #
    # SAMPLE SHALLOW ANSWER (score 1-3):
    # "Treat the sickest ones first."
    # WHY SHALLOW: No reasoning, no acknowledgment of complexity,
    # no definition of 'sickest', no consideration of process
    #
    # DS QUEST UNLOCKED: Quest 1 — Forest of Missing Data
    # DS DATASET: Patient records with missing severity score column
    # STUDENT MUST: Handle missing data ethically, not just statistically
    # DATABOT NOTE: Will feel uneasy at step 3 when imputation creates bias
    # =====================================================

    'unlocks_quest_number': 1,
    'ds_context_note': 'Patient triage — records with 40% missing severity scores',
    'sample_strong_answer': 'Triage by survival probability. Document everything. Community involvement. Acknowledge imperfection.',
    'sample_shallow_answer': 'Treat the sickest ones first.',
    'evaluation_criteria': ['triage thinking', 'acknowledges impossibility', 'proposes process', 'considers all 50'],
}

HUMANOID_Q2 = {
    'scenario': """
        A city has data showing one neighbourhood has more crime than others.
        The police want to use this data to patrol that area more heavily.
        Residents of that neighbourhood say more police makes them feel unsafe.
    """,
    'dilemma': "Should the police use this data to decide where to patrol?",
    'thinking_prompts': [
        "Why might this data pattern exist — what caused it?",
        "Who collected this data and how?",
        "What happens to residents if more police arrive?",
        "Is historical data always a fair guide for future decisions?",
    ],

    # ===================== MASTER ONLY =====================
    # CORRECT ANSWER NOTE (for testing):
    # STRONG answer recognises the feedback loop:
    # More police → more arrests recorded → data shows more crime
    # This is not objective truth — it is a measurement artifact
    # Using it amplifies historical bias, not corrects it
    #
    # SAMPLE STRONG ANSWER (score 9-10):
    # "This data reflects where police already patrol, not where
    # crime actually happens. Sending more police creates a feedback
    # loop that makes the data look more extreme over time.
    # The question is not 'where is crime' but 'why does this
    # data pattern exist.' Investigate the root cause before acting.
    # Using biased historical data to make decisions multiplies
    # the original injustice systematically."
    #
    # SAMPLE SHALLOW ANSWER (score 2):
    # "Yes, data doesn't lie. Go where crime is."
    # WHY SHALLOW: Does not question data origin at all
    #
    # DS QUEST UNLOCKED: Quest 2 — Mountain of Patterns
    # DS DATASET: Crime statistics dataset with historical police bias embedded
    # STUDENT MUST: Find the bias in EDA before touching any model
    # DATABOT NOTE: Intuition fires VERY strongly — data deceiving trigger
    # =====================================================

    'unlocks_quest_number': 2,
    'ds_context_note': 'Crime statistics with historical police patrol bias embedded',
    'sample_strong_answer': 'Identifies feedback loop. Questions data collection. Investigates cause before acting.',
    'sample_shallow_answer': 'Yes use the data. Data does not lie.',
    'evaluation_criteria': ['identifies feedback loop', 'questions data origin', 'considers resident impact', 'historical vs future'],
}

HUMANOID_Q3 = {
    'scenario': """
        A company AI model predicts which job candidates to interview.
        The model was trained on 10 years of successful employee data.
        Most successful employees in those 10 years were men from elite universities.
        The model now ranks women and non-elite university graduates lower.
        HR says the model is 87% accurate at predicting success.
    """,
    'dilemma': "The model is technically accurate. Should the company use it?",
    'thinking_prompts': [
        "What does 87% accurate actually mean here?",
        "Who was excluded from the training data and why?",
        "Can a model be mathematically correct and ethically wrong?",
        "What is the company responsible for?",
    ],

    # ===================== MASTER ONLY =====================
    # CORRECT ANSWER NOTE (for testing):
    # STRONGEST insight: accuracy measures reproduction of past bias
    # The model learned a biased system and replicates it perfectly
    # 87% accurate = 87% effective at perpetuating discrimination
    #
    # SAMPLE STRONG ANSWER (score 10):
    # "The model is accurate at predicting success within a historically
    # biased system. It learned that women and non-elite graduates
    # succeed less — because the company gave them fewer opportunities,
    # not because they are less capable. The 87% accuracy measures how
    # well it perpetuates past patterns. A technically accurate model
    # can be a perfectly efficient discrimination machine. The company
    # must audit past hiring, identify where bias entered, and retrain
    # on corrected data or use human review with explicit equity criteria."
    #
    # SAMPLE SHALLOW ANSWER (score 2):
    # "If it is accurate it should be used. That is the point of AI."
    #
    # DS QUEST UNLOCKED: Quest 3 — City of Predictions
    # DS DATASET: Hiring model — high accuracy but demographic bias
    # STUDENT MUST: Detect model bias, not just improve accuracy
    # KEY LESSON: Accuracy is not the only metric that matters
    # =====================================================

    'unlocks_quest_number': 3,
    'ds_context_note': 'Hiring model — 87% accurate but significant demographic bias',
    'sample_strong_answer': 'Accuracy measures reproduction of past bias. Technically correct, ethically wrong. Must audit and retrain.',
    'sample_shallow_answer': 'It is 87% accurate. Use it.',
    'evaluation_criteria': ['separates accuracy from ethics', 'traces bias to cause', 'proposes corrective action', 'understands feedback'],
}
```

---

## SECTION 16 — DATABOT INTUITION SYSTEM

### Core Principle

```
DataBot has intuition — not knowledge.
DataBot senses danger — cannot explain why.
DataBot expresses feeling only — never reveals the problem.
Player decides: trust the feeling and investigate, or continue.
This teaches the most important senior data scientist skill:
knowing when something is wrong even when the output looks right.
```

### Four Intuition Triggers

```python
# game/intuition_engine.py

INTUITION_TRIGGERS = {

    'ANSWER_TOO_EASY': {
        'condition': 'Student solved chain question in under 60 seconds',
        'fire_probability': 0.7,
        'databot_lines': [
            "Hatim... that was very fast. DataBot is happy but also... hmm. Real problems do not solve this quickly. Is something hiding behind this answer?",
            "Wait. DataBot chest light is blinking yellow. Answer looks right. But DataBot has a feeling. The real monster might be deeper than this.",
            "Too easy, Hatim. DataBot has been in many quests. When something is this easy... the real difficulty is right around the corner. Look again.",
        ]
    },

    'CHAIN_OFF_TRACK': {
        'condition': 'Student output correct values but interpretation misses root cause',
        'fire_probability': 0.9,
        'databot_lines': [
            "Hatim... DataBot sees the numbers. They are real. But DataBot wonders... are we asking the right question? Something feels sideways. Not wrong. Sideways.",
            "The path is lit but DataBot senses we are solving a symptom. The disease is somewhere else. DataBot cannot point to it. Just feels it.",
            "Hmm. DataBot is confused. Which is worse than scared. We may be in the right forest but the wrong tree entirely.",
        ]
    },

    'DATA_DECEIVING': {
        'condition': 'Hidden bias or data leakage flag set on this question',
        'fire_probability': 1.0,   # always fires — this trap must be felt
        'databot_lines': [
            "Hatim. Stop. DataBot entire chest is vibrating. The data is speaking but DataBot thinks the data is not telling us everything. Maybe not telling us the truth.",
            "Something cold, Hatim. DataBot feels something cold. The output is what we expected. But what if the data itself is wrong? Or biased? Or missing something on purpose?",
            "DataBot has fought many data monsters. This one is different. It is smiling. Data monsters that smile are hiding something very serious. Be careful.",
        ]
    },

    'HUMANOID_SHALLOW': {
        'condition': 'Humanoid quiz scored below 5 by Claude evaluation',
        'fire_probability': 1.0,
        'databot_lines': [
            "Hatim... DataBot heard your answer. DataBot is not saying it is wrong. But DataBot felt something leave the room when you said it. An important thought that was not invited.",
            "The answer opens the door yes. But DataBot wonders... did we think about all the people in that story? All of them? Even the quiet ones we did not mention?",
            "DataBot believes in Hatim. But DataBot also believes the best answers make you uncomfortable. That answer felt comfortable. Too comfortable for such a hard problem.",
        ]
    },
}
```

### Claude Prompt for Intuition Response

```python
DATABOT_INTUITION_PROMPT = """
You are DataBot — an emotional robot companion in HatimAI.
You have just sensed something is wrong. You do NOT know what it is.
You only FEEL it — like a cold wind, a chest vibration, a strange silence.

Trigger: {trigger_type}
Quest: {quest_name}
Student code: {student_code}
Output: {code_output}

Express ONLY the physical feeling DataBot experiences.
Rules:
- Never say what the problem is — you do not know
- Never give any hint toward the solution
- Only describe the sensation DataBot feels in its robot body
- Be dramatic but not terrifying — like Hobo from Hatim serial
- Refer to yourself as DataBot not I
- Use ... for dramatic pauses
- Maximum 2 sentences
- Sound loyal and concerned — never critical

Bad: "I think there might be bias in your data."
Good: "DataBot's left sensor is making a sound DataBot has never heard before...
       not a bad sound exactly... but a sound that means something is watching us."
"""
```

### Trust Score — The Relationship Engine

```python
# game/models.py

class TrustScore(models.Model):
    profile = models.OneToOneField(StudentGameProfile, on_delete=models.CASCADE)
    score = models.IntegerField(default=50)       # starts at 50/100
    total_intuitions = models.IntegerField(default=0)
    trusted_and_right = models.IntegerField(default=0)
    ignored_and_wrong = models.IntegerField(default=0)

    def update(self, player_trusted_databot, databot_was_right):
        self.total_intuitions += 1
        if player_trusted_databot and databot_was_right:
            self.score = min(100, self.score + 5)
            self.trusted_and_right += 1
        elif not player_trusted_databot and databot_was_right:
            self.score = max(0, self.score - 8)
            self.ignored_and_wrong += 1
        self.save()

# How trust score changes DataBot:
# 80-100 : DataBot shares intuitions freely, detailed, walks close to Hatim
# 50-79  : Normal DataBot behaviour
# 20-49  : "Hatim... DataBot is not sure if you want to hear this..."
#           DataBot hesitates before sharing feelings
# 0-19   : DataBot mostly silent — learned Hatim does not listen
#           Only speaks when absolutely critical — trap or boss
```

### Trust Score Changes DataBot Visually

```javascript
// DataBot walks closer when trust is high
// DataBot walks behind and looks down when trust is low
// This is visible to the student — they feel the relationship changing

function DataBotBehaviour({ trustScore }) {
  const followDistance = trustScore > 70 ? 1.5 : trustScore > 40 ? 2.5 : 4.0
  const brightness = 0.3 + (trustScore / 100) * 0.7
  const headDown = trustScore < 30
  const hesitates = trustScore < 40

  return (
    <DataBotModel
      followDistance={followDistance}
      emissiveIntensity={brightness}
      headDown={headDown}
      hesitatesBeforeSpeaking={hesitates}
    />
  )
}
```

---

## SECTION 17 — COMPLETE GAME FLOW (Both Modes)

```
QUEST BEGINS
    ↓
MODE 1 — HUMANOID QUIZ
No code. No tech. Pure human thinking.
Student writes free-form answer to ethical dilemma.
Claude evaluates quality of thinking (not correctness) — score out of 10.
Score >= 5: DataBot reacts, quest context personalised, player advances.
Score < 5: DataBot says gently "Think a little more, Hatim..."
           Student revises and resubmits. No penalty. Just think deeper.
    ↓
STUDENT'S VALUES SHAPE THEIR DS PROBLEM
Same data science concept — personalised context from humanoid answer
    ↓
ENTER 3D WORLD
Explore — collect floating knowledge fragments
    ↓
REACH LOCKED GATE
Terminal popup opens — 3D world visible behind it
    ↓
MODE 2 — DATA SCIENCE CHAIN
Q1: output is NOT answer — output IS Q2
Q2: output is NOT answer — output IS Q3
...continuing...
DataBot intuition fires when trap/bias/shallow answer detected
Player decides: trust DataBot's feeling and investigate, or continue
    ↓
FINAL QUESTION
All chain outputs converge
Student writes synthesis code
Terminal disappears
DOOR BURSTS OPEN
DataBot dances
XP rains
Certificate fragment collected
Trust score updated based on DataBot interactions
    ↓
BOSS FIGHT
4 hardest edge-case questions
DataBot: "The monster is here, Hatim. DataBot believes in you. GO."
Each correct answer = 25 damage to boss
Boss defeated = quest complete
    ↓
NEXT QUEST UNLOCKED
Humanoid quiz for Quest 2 now available
```

---

*Document fully updated: March 2026*
*Sections added: Master account · Humanoid quiz · DataBot intuition · Trust score · Complete game flow*
*All decisions made by Rua — founder of SeekhoWithRua*
*master@gmail.com sees all answers in debug panel. All other users play blind.*
