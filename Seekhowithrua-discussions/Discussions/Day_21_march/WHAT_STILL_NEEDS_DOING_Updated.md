# SeekhoWithRua — Complete Build Guide
# Last Updated: 21 March 2026
# Every pending task. Core logic written. Copy-paste ready.
# Do top to bottom. Do not skip.

---

## TODAY — Push the 5 blog posts (already written, just push)

  git add .
  git commit -m "feat: add 5 SEO blog posts targeting gaming-lab animation-lab services voice-rooms"
  git push origin main

After Vercel deploys, go to Search Console → URL Inspection → request indexing:
  https://seekhowithrua.com/blog/memory-enhancement-game-online-india-2026
  https://seekhowithrua.com/blog/free-fire-style-study-game-india-2026
  https://seekhowithrua.com/blog/3d-animation-data-science-course-india-2026
  https://seekhowithrua.com/blog/hire-game-developer-india-2026
  https://seekhowithrua.com/blog/live-voice-chat-room-it-students-india-2026

---

## TOMORROW — 9 remaining SEO pages (Google limit resets daily)

  https://seekhowithrua.com/services/web-app-development
  https://seekhowithrua.com/services/mobile-app-development
  https://seekhowithrua.com/gaming-lab/hatim-quest
  https://seekhowithrua.com/animation-lab/full-stack-development
  https://seekhowithrua.com/animation-lab/game-development
  https://seekhowithrua.com/animation-lab/python-programming-course
  https://seekhowithrua.com/animation-lab/iot-robotics
  https://seekhowithrua.com/animation-lab/mobile-app-development
  https://seekhowithrua.com/animation-lab/web-development-course

---

## PRIORITY 1 — VCR Bug Fix
# File: django-react-ml-app/frontend/src/components/VCRoom.jsx
# 4 bugs. ~15 lines total. Nothing else touched.

### EXACT cleanup() function — replace your current one with this:

```javascript
function cleanup() {
  // BUG FIX 2: stop tracks and null stream BEFORE destroying peer
  myStream.current?.getTracks().forEach(t => t.stop());
  myStream.current = null;

  // Close all call connections
  Object.values(callConns.current).forEach(c => c.close?.());
  // Close all data connections
  Object.values(dataConns.current).forEach(c => c.close?.());
  // Now safe to destroy peer
  myPeer.current?.destroy();

  // BUG FIX 1: remove all injected <audio> elements from DOM
  // Without this, audio keeps playing after leave because the element
  // holds its own MediaStream reference independent of PeerJS
  document.querySelectorAll('audio[id^="audio_"]').forEach(el => {
    el.srcObject = null;
    el.remove();
  });

  // Close audio analyser contexts
  Object.values(analyserRefs.current).forEach(({ ctx }) => ctx?.close?.());

  // Reset all refs
  myPeer.current = null;
  dataConns.current = {};
  callConns.current = {};
  analyserRefs.current = {};

  // BUG FIX 4: clear the ?room= URL param
  setRoomInURL(null);

  // Reset all state
  setPanelInfo(null);
  setParticipants([]);
  setMessages([]);
  setMyRole("listener");
  setConnected(false);
  setMuted(false);
  setHandRaised(false);
  setSpeakingIds(new Set());
}
```

### BUG FIX 3: Add this useEffect inside VCRoom component (near other useEffects at top):

```javascript
useEffect(() => {
  const handleUnload = () => {
    if (myRoleRef.current === 'host' && panelRef.current?.id) {
      navigator.sendBeacon(
        `${API_BASE}/api/panels/${panelRef.current.id}/leave/`,
        new Blob(
          [JSON.stringify({ token: getToken() })],
          { type: 'application/json' }
        )
      );
    }
  };
  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, []);
```

---

## PRIORITY 2 — Django: voice_rooms app
# Repo: django-react-ml-app/backend/
# Run once: python manage.py startapp voice_rooms
# Add 'voice_rooms' to INSTALLED_APPS in settings.py

### File: voice_rooms/models.py (complete — copy this entire file)

```python
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    """
    Extension of Django User for SeekhoWithRua fields.
    If you already have a UserProfile model, ADD these fields to it.
    Do not create a second UserProfile.
    """
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='rua_profile')
    current_course = models.CharField(max_length=60, blank=True)
    # e.g. "data-science-course", "ai-course" — matches URL slug
    interests      = models.JSONField(default=list)
    # e.g. ["it_tech", "spiritual", "debate", "school_college", "virtual_friends"]
    skill_tags     = models.JSONField(default=list)
    # e.g. ["Python", "React", "ML", "Unity"]
    rua_title      = models.CharField(max_length=20, default='learner_rua')
    # choices: learner_rua / mr_rua / master_rua
    college        = models.CharField(max_length=200, blank=True)
    onboarded      = models.BooleanField(default=False)
    # False until user completes onboarding interest-selection screen


class PanelMeta(models.Model):
    """
    Extends your existing Panel model with recommendation fields.
    Avoids touching your existing Panel model at all.
    """
    panel_id         = models.IntegerField(unique=True)
    panel_title      = models.CharField(max_length=200)
    category         = models.CharField(max_length=30, blank=True)
    # it_tech / spiritual / debate / school_college / virtual_friends / hiring
    course_tags      = models.JSONField(default=list)
    # e.g. ["data-science-course", "ai-course"]
    view_count       = models.IntegerField(default=0)
    total_join_count = models.IntegerField(default=0)
    total_minutes    = models.FloatField(default=0)
    quality_score    = models.FloatField(default=0)

    def update_quality(self):
        from django.db.models import Avg
        sessions = PanelSession.objects.filter(panel_id=self.panel_id, duration_minutes__gt=0)
        if sessions.exists():
            avg = sessions.aggregate(Avg('duration_minutes'))['duration_minutes__avg']
            self.quality_score = round(avg, 2)
            self.save()


class PanelSession(models.Model):
    """
    Records every user's time in every panel.
    Primary input for user ranking (time x 1 in formula).
    Also used to calculate panel quality score.
    """
    user             = models.ForeignKey(User, on_delete=models.CASCADE, related_name='panel_sessions')
    panel_id         = models.IntegerField()
    panel_title      = models.CharField(max_length=200)
    role             = models.CharField(max_length=20)  # host / speaker / listener
    joined_at        = models.DateTimeField(auto_now_add=True)
    left_at          = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.FloatField(default=0)

    def close_session(self):
        self.left_at          = timezone.now()
        self.duration_minutes = (self.left_at - self.joined_at).total_seconds() / 60
        self.save()
        score_obj, _ = UserRankScore.objects.get_or_create(user=self.user)
        score_obj.recalculate()
        meta, _ = PanelMeta.objects.get_or_create(panel_id=self.panel_id)
        meta.total_minutes += self.duration_minutes
        meta.save()
        meta.update_quality()


class UserPanelHistory(models.Model):
    """
    Which panels each user has ever joined.
    Used for co-occurrence calculation.
    """
    user      = models.ForeignKey(User, on_delete=models.CASCADE, related_name='panel_history')
    panel_id  = models.IntegerField()
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'panel_id')


class PanelCoOccurrence(models.Model):
    """
    THE YOUTUBE SIGNAL.
    User joins Panel A then Panel B -> co_join_count(A,B) += 1.
    When User X joins Panel A, recommend panels with high co_join_count(A, ?).
    Label: "others who joined this also joined..."
    """
    panel_a_id    = models.IntegerField()
    panel_b_id    = models.IntegerField()
    co_join_count = models.IntegerField(default=1)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('panel_a_id', 'panel_b_id')

    @classmethod
    def record_join(cls, user, new_panel_id):
        previous = UserPanelHistory.objects.filter(user=user).exclude(panel_id=new_panel_id)
        for ph in previous:
            a, b = sorted([ph.panel_id, new_panel_id])
            obj, created = cls.objects.get_or_create(panel_a_id=a, panel_b_id=b)
            if not created:
                obj.co_join_count += 1
                obj.save()


class Follow(models.Model):
    from_user  = models.ForeignKey(User, related_name='following', on_delete=models.CASCADE)
    to_user    = models.ForeignKey(User, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')


class Upvote(models.Model):
    from_user  = models.ForeignKey(User, related_name='upvotes_given', on_delete=models.CASCADE)
    to_user    = models.ForeignKey(User, related_name='upvotes_received', on_delete=models.CASCADE)
    panel_id   = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user', 'panel_id')


class UserRankScore(models.Model):
    """
    Formula: (total_time x 1) + (upvotes x 3) + (followers x 2)
    Recalculated every time user leaves a panel.
    """
    user           = models.OneToOneField(User, on_delete=models.CASCADE)
    total_time     = models.FloatField(default=0)
    upvote_count   = models.IntegerField(default=0)
    follower_count = models.IntegerField(default=0)
    score          = models.FloatField(default=0)
    last_updated   = models.DateTimeField(auto_now=True)

    def recalculate(self):
        self.total_time     = sum(s.duration_minutes for s in self.user.panel_sessions.all())
        self.upvote_count   = self.user.upvotes_received.count()
        self.follower_count = self.user.followers.count()
        self.score = (self.total_time * 1) + (self.upvote_count * 3) + (self.follower_count * 2)
        self.save()
```

---

### File: voice_rooms/recommendation.py (YouTube-style panel scorer)

```python
"""
Panel recommendation engine.
Called from GET /api/panels/ to rank panels for each user.
Returns panels in 3 labelled rows.
"""
from django.db.models import Q
from .models import UserProfile, PanelMeta, UserPanelHistory, PanelCoOccurrence


def score_panel_for_user(panel_dict, user):
    score    = 0
    panel_id = panel_dict['id']

    try:    profile = user.rua_profile
    except: profile = None

    try:    meta = PanelMeta.objects.get(panel_id=panel_id)
    except: meta = None

    # Signal 1: Course match (+50)
    if profile and meta and profile.current_course:
        if profile.current_course in (meta.course_tags or []):
            score += 50

    # Signal 2: Interest match (+30)
    if profile and meta and profile.interests:
        if meta.category in profile.interests:
            score += 30

    # Signal 3: Co-occurrence — YouTube signal (+up to 40)
    if user.is_authenticated:
        joined_ids = list(
            UserPanelHistory.objects.filter(user=user).values_list('panel_id', flat=True)
        )
        if panel_id in joined_ids:
            score -= 100  # bury already-seen panels
        elif joined_ids:
            co = PanelCoOccurrence.objects.filter(
                Q(panel_a_id__in=joined_ids, panel_b_id=panel_id) |
                Q(panel_b_id__in=joined_ids, panel_a_id=panel_id)
            )
            co_total = sum(c.co_join_count for c in co)
            score += min(co_total * 2, 40)

    # Signal 4: Panel quality (+up to 15)
    if meta:
        quality = min(meta.quality_score / 30.0, 1.0)
        score += quality * 15

    # Signal 5: Trending (+up to 10)
    if meta:
        score += min(meta.view_count / 10.0, 1.0) * 10

    # Signal 6: Freshness decay (-0.5/hour)
    created_at = panel_dict.get('created_at')
    if created_at:
        try:
            import datetime
            now = datetime.datetime.now(datetime.timezone.utc)
            age_hours = (now - created_at).total_seconds() / 3600
            score -= age_hours * 0.5
        except Exception:
            pass

    return round(score, 2)


def get_recommended_panels(panels_qs, user, PanelSerializer):
    panels_list = []
    for panel in panels_qs.filter(is_active=True):
        data = PanelSerializer(panel).data
        data['_score'] = score_panel_for_user(data, user)
        panels_list.append(data)

    panels_list.sort(key=lambda p: p['_score'], reverse=True)

    try:    current_course = user.rua_profile.current_course
    except: current_course = ''

    joined_ids = set()
    if user.is_authenticated:
        joined_ids = set(
            UserPanelHistory.objects.filter(user=user).values_list('panel_id', flat=True)
        )

    course_row   = []
    co_occur_row = []
    trending_row = []

    for p in panels_list:
        pid = p['id']
        try:    meta = PanelMeta.objects.get(panel_id=pid)
        except: meta = None

        if current_course and meta and current_course in (meta.course_tags or []):
            if len(course_row) < 5:
                course_row.append(p)
        elif pid not in joined_ids and meta:
            co = PanelCoOccurrence.objects.filter(
                Q(panel_a_id__in=joined_ids, panel_b_id=pid) |
                Q(panel_b_id__in=joined_ids, panel_a_id=pid)
            ).exists()
            if co and len(co_occur_row) < 5:
                co_occur_row.append(p)
        elif meta and meta.quality_score > 5 and len(trending_row) < 5:
            trending_row.append(p)

    course_label = f'Because you study {current_course.replace("-", " ")}' if current_course else 'Recommended for you'

    return {
        'because_your_course': course_row,
        'others_also_joined':  co_occur_row,
        'trending_now':        trending_row,
        'all_ranked':          panels_list,
        'labels': {
            'because_your_course': course_label,
            'others_also_joined':  'Others who joined your panels also joined',
            'trending_now':        'Trending right now',
        }
    }
```

---

### Hooks into existing panels/views.py

In your JOIN view — add after existing join logic:
```python
from voice_rooms.models import PanelSession, UserPanelHistory, PanelCoOccurrence, PanelMeta

session = PanelSession.objects.create(
    user=request.user, panel_id=panel.id,
    panel_title=panel.title, role=member_role,
)
request.session[f'vcr_session_{panel.id}'] = session.id
UserPanelHistory.objects.get_or_create(user=request.user, panel_id=panel.id)
PanelCoOccurrence.record_join(user=request.user, new_panel_id=panel.id)
meta, _ = PanelMeta.objects.get_or_create(panel_id=panel.id, defaults={'panel_title': panel.title})
meta.view_count += 1
meta.total_join_count += 1
meta.save()
```

In your LEAVE view — add after existing leave logic:
```python
session_id = request.session.get(f'vcr_session_{panel.id}')
if session_id:
    try: PanelSession.objects.get(id=session_id).close_session()
    except: pass
```

In your PANELS LIST view — replace current return:
```python
from voice_rooms.recommendation import get_recommended_panels
from .serializers import PanelSerializer

if request.user.is_authenticated:
    result = get_recommended_panels(Panel.objects.all(), request.user, PanelSerializer)
    return Response(result)
else:
    panels = Panel.objects.filter(is_active=True).order_by('-created_at')
    return Response(PanelSerializer(panels, many=True).data)
```

### Migrate and deploy:
```bash
python manage.py makemigrations voice_rooms
python manage.py migrate
git add . && git commit -m "feat: voice_rooms app — recommendation engine, ranking, co-occurrence" && git push
```

---

## PRIORITY 3 — New API endpoints (voice_rooms/views.py)

```python
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Follow, Upvote, UserRankScore, UserProfile


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    target = User.objects.get(id=user_id)
    if request.method == 'POST':
        Follow.objects.get_or_create(from_user=request.user, to_user=target)
        score, _ = UserRankScore.objects.get_or_create(user=target)
        score.recalculate()
        return Response({'status': 'following', 'followers': target.followers.count()})
    else:
        Follow.objects.filter(from_user=request.user, to_user=target).delete()
        score, _ = UserRankScore.objects.get_or_create(user=target)
        score.recalculate()
        return Response({'status': 'unfollowed', 'followers': target.followers.count()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upvote_speaker(request):
    to_user_id = request.data.get('to_user_id')
    panel_id   = request.data.get('panel_id')
    if not to_user_id or not panel_id:
        return Response({'error': 'to_user_id and panel_id required'}, status=400)
    target = User.objects.get(id=to_user_id)
    _, created = Upvote.objects.get_or_create(
        from_user=request.user, to_user=target, panel_id=panel_id
    )
    if created:
        score, _ = UserRankScore.objects.get_or_create(user=target)
        score.recalculate()
        return Response({'status': 'upvoted'})
    return Response({'status': 'already_upvoted'})


@api_view(['GET'])
def leaderboard(request):
    leaderboard_type = request.GET.get('type', 'overall')
    college          = request.GET.get('college', '')
    qs = UserRankScore.objects.select_related('user').order_by('-score')
    if leaderboard_type == 'college' and college:
        qs = qs.filter(user__rua_profile__college=college)
    data = []
    for i, row in enumerate(qs[:50]):
        try:    college_name = row.user.rua_profile.college
        except: college_name = ''
        data.append({
            'rank':      i + 1,
            'user_id':   row.user.id,
            'username':  row.user.username or row.user.email.split('@')[0],
            'score':     round(row.score, 1),
            'total_time': round(row.total_time, 1),
            'upvotes':   row.upvote_count,
            'followers': row.follower_count,
            'college':   college_name,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_onboarding(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    profile.current_course = request.data.get('current_course', '')
    profile.interests      = request.data.get('interests', [])
    profile.skill_tags     = request.data.get('skill_tags', [])
    profile.college        = request.data.get('college', '')
    profile.onboarded      = True
    profile.save()
    return Response({'status': 'saved'})
```

voice_rooms/urls.py:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('follow/<int:user_id>/', views.follow_user),
    path('upvote/',               views.upvote_speaker),
    path('leaderboard/',          views.leaderboard),
    path('onboarding/',           views.save_onboarding),
]
```

main urls.py — add:
```python
path('api/vcr/', include('voice_rooms.urls')),
```

---

## PRIORITY 4 — VCR: Follow + Upvote + Onboarding in UI
# File: VCRoom.jsx — add only, do not rewrite

### Follow button — add inside People tab participant-item:
```jsx
{!isMe && (
  <button className="btn btn-cyan btn-sm" onClick={async () => {
    await apiFetch(`/api/vcr/follow/${p.backendId}/`, { method: 'POST' });
    push(`Following ${p.name}`, 'cyan');
  }}>
    + Follow
  </button>
)}
```

### Upvote button — add inside AvatarOrb controls:
```jsx
{canControl && participant.role === 'speaker' && (
  <button className="btn btn-gold btn-icon btn-sm"
    title="Upvote this speaker"
    onClick={async () => {
      await apiFetch('/api/vcr/upvote/', {
        method: 'POST',
        body: JSON.stringify({ to_user_id: participant.backendId, panel_id: panelRef.current?.id }),
      });
      push(`Upvoted ${participant.name}`, 'gold');
    }}>
    ⭐
  </button>
)}
```

### Onboarding screen — add to render logic before rooms screen:
```jsx
// Add to auth-checked render section:
if (user && !user.onboarded && screen !== 'panel') {
  return <OnboardingScreen onComplete={async (data) => {
    await apiFetch('/api/vcr/onboarding/', { method: 'POST', body: JSON.stringify(data) });
    // Reload user profile so onboarded=true
    const prof = await apiFetch('/api/profile/');
    if (prof.ok) setUser({ ...user, onboarded: true });
  }} />;
}

// OnboardingScreen component — add near end of file:
function OnboardingScreen({ onComplete }) {
  const COURSES = ['data-science-course','ai-course','full-stack-development','python-programming-course','web-development-course','game-development','iot-robotics','mobile-app-development'];
  const INTERESTS = ['it_tech','spiritual','debate','school_college','virtual_friends','hiring'];
  const [course, setCourse]       = useState('');
  const [selected, setSelected]   = useState([]);
  const [college, setCollege]     = useState('');
  const toggle = (v) => setSelected(p => p.includes(v) ? p.filter(x=>x!==v) : [...p, v]);

  return (
    <div className="cosmos-root">
      <div className="entry-screen">
        <div className="entry-card">
          <h2>PERSONALISE YOUR EXPERIENCE</h2>
          <p style={{ color:'var(--muted)', fontSize:'0.8rem', marginBottom:16, textAlign:'center' }}>
            Takes 30 seconds. Panels will be recommended based on your answers.
          </p>
          <div className="stage-section-label" style={{ marginBottom:8 }}>Which course are you studying?</div>
          <select className="cosmos-input" value={course} onChange={e=>setCourse(e.target.value)}>
            <option value="">Select your course</option>
            {COURSES.map(c => <option key={c} value={c}>{c.replace(/-/g,' ')}</option>)}
          </select>
          <div className="stage-section-label" style={{ marginBottom:8, marginTop:8 }}>What are you interested in? (pick all that apply)</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {INTERESTS.map(i => (
              <button key={i} onClick={()=>toggle(i)} className={`role-btn ${selected.includes(i)?'active':''}`}
                style={{ flex:'unset', padding:'8px 14px' }}>
                {i.replace(/_/g,' ')}
              </button>
            ))}
          </div>
          <input className="cosmos-input" placeholder="College name (optional)" value={college} onChange={e=>setCollege(e.target.value)} />
          <button className="btn btn-primary" onClick={() => onComplete({ current_course:course, interests:selected, college })}>
            ◈ ENTER THE COSMOS
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## PRIORITY 5 — Leaderboard component
# File: frontend/src/components/VCRLeaderboard.jsx (new file)

```jsx
import { useState, useEffect } from 'react';

const API = (import.meta.env?.VITE_API_URL || 'https://django-react-ml-app.onrender.com').replace(/\/$/, '');
const tok = () => localStorage.getItem('cosmos_token') || '';

export default function VCRLeaderboard() {
  const [tab, setTab]     = useState('overall');
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);

  const user    = (() => { try { return JSON.parse(localStorage.getItem('cosmos_user')||'{}'); } catch { return {}; } })();
  const college = user?.profile?.college || user?.rua_profile?.college || '';

  useEffect(() => {
    setLoading(true);
    const url = tab === 'college' && college
      ? `${API}/api/vcr/leaderboard/?type=college&college=${encodeURIComponent(college)}`
      : `${API}/api/vcr/leaderboard/?type=overall`;
    fetch(url, { headers: { Authorization: `Token ${tok()}` } })
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); });
  }, [tab]);

  const rc = r => r===1?'#f59e0b':r===2?'#9ca3af':r===3?'#cd7c2f':null;

  return (
    <div style={{ background:'#0f0f1a', borderRadius:16, padding:24, color:'#e2e8f0' }}>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['overall','college'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
            background:tab===t?'#7c3aed':'rgba(255,255,255,0.06)', color:'#fff', fontWeight:600, fontSize:13
          }}>{t==='overall'?'🌍 Overall':'🎓 My College'}</button>
        ))}
      </div>
      {tab==='college'&&!college&&(
        <div style={{ color:'rgba(255,255,255,0.4)',fontSize:13,padding:'12px 0' }}>
          Set your college in profile settings to see your college leaderboard.
        </div>
      )}
      {loading ? (
        <div style={{ textAlign:'center',padding:40,color:'rgba(255,255,255,0.4)' }}>Loading...</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {data.map(row=>(
            <div key={row.rank} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 14px', borderRadius:10,
              background:row.rank<=3?'rgba(124,58,237,0.12)':'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{
                width:28, height:28, borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:700,
                background:rc(row.rank)||'rgba(255,255,255,0.1)',
                color:rc(row.rank)?'#000':'rgba(255,255,255,0.6)',
              }}>{row.rank}</span>
              <div style={{ flex:1 }}>
                <div style={{ color:'#fff', fontSize:14, fontWeight:600 }}>{row.username}</div>
                {row.college&&<div style={{ color:'rgba(255,255,255,0.35)',fontSize:11,marginTop:2 }}>{row.college}</div>}
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:'#7c3aed', fontSize:15, fontWeight:700 }}>{row.score}</div>
                <div style={{ color:'rgba(255,255,255,0.3)',fontSize:10,marginTop:2 }}>
                  {row.followers} followers · {row.upvotes} upvotes
                </div>
              </div>
            </div>
          ))}
          {data.length===0&&(
            <div style={{ color:'rgba(255,255,255,0.4)',textAlign:'center',padding:40 }}>
              No rankings yet. Join panels to earn your score.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## PRIORITY 6 — Deploy gaming + animation + services to Vercel
# DNS already set in Hostinger. Just connect repos to Vercel.

For each repo (seekhowithrua-gaming, seekhowithrua-animation, seekhowithrua-services):
  1. vercel.com → New Project → Import repo
  2. Framework: Other
  3. Build command: (leave empty)
  4. Output directory: . (dot)
  5. Deploy
  6. Project Settings → Domains → add:
     gaming.seekhowithrua.com
     animationlab.seekhowithrua.com
     services.seekhowithrua.com
  7. Vercel verifies DNS automatically (CNAME already set)

---

## PRIORITY 7 — Gaming Lab HTML files
# Repo: seekhowithrua-gaming/
# One HTML file per game. No framework. No npm. No build.

### File structure:
  index.html          → existing 3D HatimAI quest (DO NOT TOUCH)
  memory-game.html    → Memory Champion Arena (BUILD THIS FIRST)
  quiz-battle.html    → Free Fire Quiz Battle (BUILD SECOND)

### memory-game.html — full skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memory Champion Arena — SeekhoWithRua</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #04040f; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; }
    #game-container { display: flex; justify-content: center; padding: 20px; }
    .challenge-selector { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; max-width: 600px; margin: 0 auto 24px; padding: 0 20px; }
    .challenge-card { padding: 20px; border-radius: 12px; border: 1px solid rgba(124,58,237,0.3); background: rgba(124,58,237,0.08); cursor: pointer; text-align: center; transition: all 0.2s; }
    .challenge-card:hover { border-color: #7c3aed; transform: translateY(-2px); }
    .challenge-card h3 { font-size: 15px; margin-bottom: 4px; }
    .challenge-card p  { font-size: 12px; color: rgba(255,255,255,0.5); }
    .back-link { display: block; padding: 16px 20px; color: rgba(255,255,255,0.5); font-size: 13px; text-decoration: none; }
    .back-link:hover { color: #fff; }
  </style>
</head>
<body>
  <a href="https://seekhowithrua.com/gaming-lab" class="back-link">← Back to Gaming Lab</a>

  <div class="challenge-selector" id="selector">
    <div class="challenge-card" onclick="startGame('number_sprint')">
      <h3>Number Sprint</h3>
      <p>20 digits · 60 seconds</p>
    </div>
    <div class="challenge-card" onclick="startGame('word_avalanche')">
      <h3>Word Avalanche</h3>
      <p>100 words · 5 minutes</p>
    </div>
    <div class="challenge-card" onclick="startGame('challenge_400')">
      <h3>400 Number Challenge</h3>
      <p>21-day progressive training</p>
    </div>
    <div class="challenge-card" onclick="startGame('binary_sequence')">
      <h3>Binary Sequence</h3>
      <p>0s and 1s · Expert mode</p>
    </div>
  </div>

  <div id="game-container"></div>

  <script>
    const API = 'https://api.seekhowithrua.com';
    const token = localStorage.getItem('cosmos_token');

    // Challenge configs
    const CONFIGS = {
      number_sprint:  { length: 20,  time: 60,   type: 'numbers', label: 'Number Sprint' },
      word_avalanche: { length: 100, time: 300,  type: 'words',   label: 'Word Avalanche' },
      challenge_400:  { length: 400, time: 1800, type: 'numbers', label: '400 Number Challenge' },
      binary_sequence:{ length: 30,  time: 60,   type: 'binary',  label: 'Binary Sequence' },
    };

    // Generators
    function generateNumbers(len) { return Array.from({length:len}, ()=>Math.floor(Math.random()*10)).join(' '); }
    function generateWords(len)   { const w=['apple','tree','moon','fire','code','data','mind','soul','light','speed']; return Array.from({length:len},()=>w[Math.floor(Math.random()*w.length)]).join(' '); }
    function generateBinary(len)  { return Array.from({length:len},()=>Math.round(Math.random())).join(' '); }

    function generateSequence(config) {
      if (config.type === 'numbers') return generateNumbers(config.length);
      if (config.type === 'words')   return generateWords(config.length);
      if (config.type === 'binary')  return generateBinary(config.length);
    }

    let currentGame = null;
    let currentSequence = '';
    let phase = 'selector'; // selector → memorise → recall → result

    function startGame(challengeType) {
      const config = CONFIGS[challengeType];
      currentSequence = generateSequence(config);
      phase = 'memorise';

      document.getElementById('selector').style.display = 'none';

      // Phaser scene
      const scene = {
        key: 'MemoryScene',
        create() {
          // Background
          this.cameras.main.setBackgroundColor('#04040f');
          const W = this.scale.width, H = this.scale.height;

          // Title
          this.add.text(W/2, 40, config.label, {
            fontSize: '22px', fontFamily: 'Segoe UI', fill: '#7c3aed', fontStyle: 'bold'
          }).setOrigin(0.5);

          // Phase label
          const phaseLabel = this.add.text(W/2, 80, 'MEMORISE', {
            fontSize: '13px', fontFamily: 'Segoe UI', fill: '#00d4ff', letterSpacing: 4
          }).setOrigin(0.5);

          // Sequence display
          const seqText = this.add.text(W/2, H/2, currentSequence, {
            fontSize: config.length <= 30 ? '36px' : '18px',
            fontFamily: 'JetBrains Mono, monospace',
            fill: '#00d4ff',
            wordWrap: { width: W - 80 },
            align: 'center',
          }).setOrigin(0.5);

          // Timer bar
          const timerBg  = this.add.rectangle(W/2, H - 60, W - 60, 12, 0x1a1a3e).setOrigin(0.5);
          const timerBar = this.add.rectangle(40, H - 60, W - 60, 12, 0x7c3aed).setOrigin(0, 0.5);
          const timeLabel = this.add.text(W/2, H - 36, `${config.time}s`, {
            fontSize: '13px', fontFamily: 'Segoe UI', fill: 'rgba(255,255,255,0.4)'
          }).setOrigin(0.5);

          let elapsed = 0;
          const timer = this.time.addEvent({
            delay: 1000, repeat: config.time - 1,
            callback: () => {
              elapsed++;
              const remaining = config.time - elapsed;
              timeLabel.setText(`${remaining}s`);
              timerBar.setScale((config.time - elapsed) / config.time, 1);
              if (elapsed >= config.time) showRecall.call(this, W, H, seqText, phaseLabel);
            }
          });
        }
      };

      if (currentGame) { currentGame.destroy(true); }
      currentGame = new Phaser.Game({
        type: Phaser.AUTO,
        width: Math.min(window.innerWidth - 40, 800),
        height: 480,
        parent: 'game-container',
        backgroundColor: '#04040f',
        scene: scene,
      });
    }

    function showRecall(W, H, seqText, phaseLabel) {
      seqText.setText('');
      phaseLabel.setText('RECALL — Type what you remember');

      // Add HTML input overlay
      const input = document.createElement('textarea');
      input.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:600px;max-width:90vw;height:120px;background:#0a0a1a;border:1px solid #7c3aed;color:#fff;font-family:JetBrains Mono,monospace;font-size:16px;padding:12px;border-radius:8px;resize:none;outline:none;z-index:100;';
      document.body.appendChild(input);

      const btn = document.createElement('button');
      btn.textContent = 'Submit Answer';
      btn.style.cssText = 'position:fixed;left:50%;top:calc(50% + 80px);transform:translateX(-50%);padding:12px 32px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;z-index:100;';
      document.body.appendChild(btn);
      btn.onclick = () => { calculateScore(input.value.trim()); input.remove(); btn.remove(); };
    }

    function calculateScore(userAnswer) {
      const original = currentSequence.replace(/\s/g, '');
      const attempt  = userAnswer.replace(/\s/g, '');
      let correct = 0;
      for (let i = 0; i < Math.min(original.length, attempt.length); i++) {
        if (original[i] === attempt[i]) correct++;
      }
      const score = Math.round((correct / original.length) * 100);
      showResult(score, correct, original.length);
    }

    function showResult(score, correct, total) {
      if (currentGame) { currentGame.destroy(true); currentGame = null; }
      document.getElementById('game-container').innerHTML = `
        <div style="text-align:center;padding:40px;max-width:500px;margin:0 auto">
          <div style="font-size:64px;font-weight:800;color:${score>=80?'#00d4ff':score>=50?'#f59e0b':'#e24b4a'}">${score}%</div>
          <div style="color:rgba(255,255,255,0.6);margin:12px 0">${correct} / ${total} correct</div>
          <div style="margin-top:24px;display:flex;gap:12px;justify-content:center">
            <button onclick="location.reload()" style="padding:12px 24px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:#fff;cursor:pointer;font-size:14px">Try Again</button>
          </div>
        </div>`;

      // Post score to Django
      if (token) {
        fetch(`${API}/api/games/memory-score/`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization:`Token ${token}` },
          body: JSON.stringify({ score, challenge_type: 'number_sprint', time_seconds: 60 })
        }).catch(() => {});
      }
    }
  </script>
</body>
</html>
```

### quiz-battle.html — skeleton (Django Channels required):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quiz Battle — SeekhoWithRua</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js"></script>
</head>
<body>
  <script>
    const API   = 'https://api.seekhowithrua.com';
    const token = localStorage.getItem('cosmos_token');
    let ws, armor = 100, gamePhase = 'lobby';

    // Connect to Django Channels
    function joinBattle(roomId) {
      ws = new WebSocket(`wss://api.seekhowithrua.com/ws/quiz-battle/${roomId}/`);
      ws.onopen    = () => ws.send(JSON.stringify({ type:'join', token }));
      ws.onmessage = (e) => handleMessage(JSON.parse(e.data));
      ws.onclose   = () => console.log('disconnected');
    }

    function handleMessage(data) {
      switch (data.type) {
        case 'question':        showQuestion(data);              break;
        case 'score_update':    updateArmor(data.scores);        break;
        case 'player_joined':   addPlayerToLobby(data.user);     break;
        case 'player_eliminated': eliminatePlayer(data.user_id); break;
        case 'game_over':       showResults(data);               break;
      }
    }

    function answerQuestion(optionIndex) {
      ws.send(JSON.stringify({ type:'answer', answer:optionIndex }));
    }

    // Fetch starting armor from quiz score
    async function getUserArmor() {
      if (!token) return 100;
      const res  = await fetch(`${API}/api/profile/`, { headers:{ Authorization:`Token ${token}` } });
      const data = await res.json();
      const quiz = data?.profile?.quiz_score || 0;
      return Math.min(50 + quiz, 200);
    }

    // Phaser renders armor bars, player orbs, question text
    // Full implementation in next session
  </script>
</body>
</html>
```

Django consumer needed (routing.py):
```python
# Add to your existing routing.py websocket_urlpatterns:
re_path(r'ws/quiz-battle/(?P<room_id>[^/]+)/$', QuizBattleConsumer.as_asgi()),
```

```python
# consumers/quiz_battle.py
import json, random
from channels.generic.websocket import AsyncWebsocketConsumer

QUESTION_BANK = [
  { 'q':'What does AI stand for?', 'options':['Artificial Intelligence','Auto Input','Advanced Interface','All Inclusive'], 'correct':0 },
  { 'q':'Which language is used for ML?', 'options':['Java','Python','C++','PHP'], 'correct':1 },
  # Add 100+ questions
]

class QuizBattleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room   = self.scope['url_route']['kwargs']['room_id']
        self.group  = f'quiz_{self.room}'
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()
        await self.channel_layer.group_send(self.group, {'type':'player_joined','user':self.scope['user'].username if self.scope['user'].is_authenticated else 'Guest'})

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'answer':
            q = QUESTION_BANK[data.get('question_idx', 0)]
            correct = data['answer'] == q['correct']
            damage  = 20 if correct else 10
            await self.channel_layer.group_send(self.group, {
                'type':   'score_update',
                'user_id': self.scope['user'].id if self.scope['user'].is_authenticated else 0,
                'damage':  damage,
                'correct': correct,
            })

    async def score_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps(event))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group, self.channel_name)
```

---

## PRIORITY 8 — Animation Lab HTML files
# Repo: seekhowithrua-animation/
# One HTML file per course. No framework. No npm.

### File structure:
  index.html          → course selector (update to link to each course file)
  data-science.html   → BUILD FIRST (template for all others)
  ai-course.html      → copy data-science.html, swap animations
  full-stack.html     → copy data-science.html, swap animations
  python.html         → copy data-science.html, swap animations
  web-dev.html        → copy data-science.html, swap animations
  game-dev.html       → copy data-science.html, swap animations
  mobile.html         → copy data-science.html, swap animations
  iot.html            → copy data-science.html, swap animations

### data-science.html — skeleton + two complete animations:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Science Animations — SeekhoWithRua Animation Lab</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #04040f; color: #e2e8f0; font-family: 'Segoe UI', sans-serif; }
    .nav { display: flex; gap: 8px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; }
    .nav-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(124,58,237,0.3); background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 13px; transition: all 0.2s; }
    .nav-btn.active { background: rgba(124,58,237,0.2); color: #fff; border-color: #7c3aed; }
    .anim-section { display: none; padding: 24px 20px; }
    .anim-section.active { display: block; }
    canvas { display: block; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
    .controls { display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap; }
    .controls label { font-size: 13px; color: rgba(255,255,255,0.6); }
    .controls input[type=range] { width: 160px; }
    .controls button { padding: 8px 18px; border-radius: 8px; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.4); color: #fff; cursor: pointer; font-size: 13px; }
    .explanation { margin-top: 16px; padding: 14px; background: rgba(255,255,255,0.04); border-radius: 8px; font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.7; max-width: 700px; }
    .back-link { display: block; padding: 14px 20px; color: rgba(255,255,255,0.4); font-size: 13px; text-decoration: none; }
  </style>
</head>
<body>
  <a href="https://seekhowithrua.com/animation-lab/data-science" class="back-link">← Back to Animation Lab</a>

  <nav class="nav">
    <button class="nav-btn active" onclick="show('neural-net')">Neural Network</button>
    <button class="nav-btn" onclick="show('gradient')">Gradient Descent</button>
    <button class="nav-btn" onclick="show('kmeans')">K-Means</button>
    <button class="nav-btn" onclick="show('pca')">PCA</button>
    <button class="nav-btn" onclick="show('dtree')">Decision Tree</button>
  </nav>

  <!-- Animation 1: Neural Network -->
  <div class="anim-section active" id="anim-neural-net">
    <canvas id="canvas-nn" width="800" height="420"></canvas>
    <div class="controls">
      <button onclick="animateForwardPass()">▶ Run Forward Pass</button>
      <button onclick="resetNN()">↺ Reset</button>
    </div>
    <div class="explanation">
      <strong>Neural network forward pass.</strong> Watch data flow from left (input layer) to right (output layer).
      Each node activates based on the weighted sum of its inputs. Bright blue = highly activated.
      Click "Run Forward Pass" to watch the signal propagate layer by layer.
    </div>
  </div>

  <!-- Animation 2: Gradient Descent -->
  <div class="anim-section" id="anim-gradient">
    <canvas id="canvas-gd" width="800" height="420"></canvas>
    <div class="controls">
      <label>Learning rate: <input type="range" id="lr-slider" min="1" max="20" value="5" oninput="updateLR(this.value)"></label>
      <span id="lr-val" style="color:#00d4ff;min-width:30px">0.5</span>
      <button onclick="startGD()">▶ Start</button>
      <button onclick="resetGD()">↺ Reset</button>
    </div>
    <div class="explanation">
      <strong>Gradient descent on a 3D loss surface.</strong> The ball rolls downhill toward the minimum.
      Drag the learning rate slider: too small = slow convergence, too large = overshooting.
      This is exactly how neural networks learn — minimising the loss function step by step.
    </div>
  </div>

  <!-- Placeholders for other animations -->
  <div class="anim-section" id="anim-kmeans">
    <div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4)">K-Means animation — coming soon</div>
  </div>
  <div class="anim-section" id="anim-pca">
    <div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4)">PCA animation — coming soon</div>
  </div>
  <div class="anim-section" id="anim-dtree">
    <div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4)">Decision Tree animation — coming soon</div>
  </div>

  <script>
    // ── Navigation ──────────────────────────────────────────────────────────
    function show(id) {
      document.querySelectorAll('.anim-section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`anim-${id}`).classList.add('active');
      event.target.classList.add('active');
    }

    // ── Animation 1: Neural Network ─────────────────────────────────────────
    const nnCanvas  = document.getElementById('canvas-nn');
    const nnCtx     = nnCanvas.getContext('2d');
    const LAYERS    = [3, 5, 5, 3, 2];
    const NODE_R    = 18;
    const W = nnCanvas.width, H = nnCanvas.height;
    let nnNodes     = [];

    function drawNN(activeLayer = -1) {
      nnCtx.clearRect(0, 0, W, H);
      nnNodes = [];

      const layerX = LAYERS.map((_, i) => 80 + (i * (W - 160) / (LAYERS.length - 1)));

      // Draw weights first (behind nodes)
      for (let l = 0; l < LAYERS.length - 1; l++) {
        const fromY = nodeYPositions(LAYERS[l], H);
        const toY   = nodeYPositions(LAYERS[l + 1], H);
        fromY.forEach(fy => {
          toY.forEach(ty => {
            nnCtx.beginPath();
            nnCtx.moveTo(layerX[l], fy);
            nnCtx.lineTo(layerX[l + 1], ty);
            nnCtx.strokeStyle = l < activeLayer ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.05)';
            nnCtx.lineWidth   = 0.8;
            nnCtx.stroke();
          });
        });
      }

      // Draw nodes
      LAYERS.forEach((count, li) => {
        const ys = nodeYPositions(count, H);
        ys.forEach((y, ni) => {
          const active = li <= activeLayer;
          nnCtx.beginPath();
          nnCtx.arc(layerX[li], y, NODE_R, 0, Math.PI * 2);
          nnCtx.fillStyle   = active ? '#00d4ff' : '#1a1a3e';
          nnCtx.strokeStyle = active ? '#7c3aed' : 'rgba(124,58,237,0.4)';
          nnCtx.lineWidth   = active ? 2 : 1;
          nnCtx.fill();
          nnCtx.stroke();
          nnNodes.push({ x: layerX[li], y, layer: li });
        });
      });

      // Layer labels
      ['Input', 'Hidden 1', 'Hidden 2', 'Hidden 3', 'Output'].forEach((label, i) => {
        nnCtx.fillStyle = 'rgba(255,255,255,0.3)';
        nnCtx.font      = '11px Segoe UI';
        nnCtx.textAlign = 'center';
        nnCtx.fillText(label, layerX[i], H - 16);
      });
    }

    function nodeYPositions(count, H) {
      const gap = (H - 80) / (count + 1);
      return Array.from({ length: count }, (_, i) => 40 + gap * (i + 1));
    }

    function animateForwardPass() {
      let layer = 0;
      const interval = setInterval(() => {
        drawNN(layer);
        layer++;
        if (layer > LAYERS.length) clearInterval(interval);
      }, 500);
    }

    function resetNN() { drawNN(-1); }
    drawNN(-1);

    // ── Animation 2: Gradient Descent ───────────────────────────────────────
    const gdCanvas = document.getElementById('canvas-gd');
    const GW = gdCanvas.width, GH = gdCanvas.height;
    let gdScene, gdCamera, gdRenderer, gdBall, gdTrail = [];
    let gdX = 3, gdZ = 3, gdLR = 0.05, gdRunning = false;

    function initGD() {
      gdScene    = new THREE.Scene();
      gdCamera   = new THREE.PerspectiveCamera(50, GW / GH, 0.1, 100);
      gdCamera.position.set(8, 10, 12);
      gdCamera.lookAt(0, 0, 0);
      gdRenderer = new THREE.WebGLRenderer({ canvas: gdCanvas, antialias: true });
      gdRenderer.setSize(GW, GH);
      gdRenderer.setClearColor(0x04040f);

      // Loss surface
      const geo = new THREE.PlaneGeometry(12, 12, 60, 60);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        pos.setY(i, 0.3 * (x*x + z*z) + 0.8 * Math.sin(x*2) * Math.cos(z*2));
      }
      geo.computeVertexNormals();
      gdScene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x1a1a3e, wireframe: true, opacity: 0.5, transparent: true })));

      // Ball
      const bg = new THREE.SphereGeometry(0.25, 16, 16);
      const bm = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      gdBall   = new THREE.Mesh(bg, bm);
      gdScene.add(gdBall);

      // Animate loop
      function loop() {
        requestAnimationFrame(loop);
        if (gdRunning) stepGD();
        gdRenderer.render(gdScene, gdCamera);
      }
      loop();
    }

    function lossY(x, z) { return 0.3*(x*x+z*z) + 0.8*Math.sin(x*2)*Math.cos(z*2); }

    function stepGD() {
      const dx = 0.6*gdX + 1.6*Math.cos(2*gdX)*Math.sin(2*gdZ);
      const dz = 0.6*gdZ + 1.6*Math.sin(2*gdX)*Math.cos(2*gdZ);
      gdX -= gdLR * dx;
      gdZ -= gdLR * dz;
      const y = lossY(gdX, gdZ);
      gdBall.position.set(gdX, y + 0.3, gdZ);
      // Trail dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.07),
        new THREE.MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.5 })
      );
      dot.position.copy(gdBall.position);
      gdScene.add(dot);
      gdTrail.push(dot);
      if (Math.abs(dx) < 0.01 && Math.abs(dz) < 0.01) gdRunning = false;
    }

    function startGD()  { gdRunning = true; }
    function resetGD()  { gdRunning = false; gdX = 3; gdZ = 3; gdTrail.forEach(d => gdScene.remove(d)); gdTrail = []; }
    function updateLR(v){ gdLR = v / 100; document.getElementById('lr-val').textContent = gdLR.toFixed(2); }

    initGD();
  </script>
</body>
</html>
```

### Copying template for other courses — what to change:

For each new course HTML file, change only:
  1. <title> tag
  2. .back-link href (e.g. /animation-lab/ai-course)
  3. nav buttons (replace "Neural Network, Gradient Descent..." with course-specific topics)
  4. anim-section IDs and content
  5. Three.js / Canvas animation code for each section

ai-course.html topics:     Transformer Attention, Backpropagation, LLM Token Flow, RAG Pipeline, Embedding Space
full-stack.html topics:    HTTP Lifecycle, React Component Tree, Django API Flow, JWT Auth, PostgreSQL Query Plan
python.html topics:        Memory Model, Call Stack, List Internals, Dictionary Hash Table, Class Inheritance
web-dev.html topics:       DOM Tree, CSS Box Model, JavaScript Event Loop, Flexbox Layout, Browser Render Pipeline
game-dev.html topics:      Rendering Pipeline, Physics Engine, Shader Graph, Raycasting, Scene Graph
mobile.html topics:        Component Lifecycle, Navigation Stack, Redux State Flow, Expo Build Pipeline, Flexbox
iot.html topics:           Arduino Signal Flow, MQTT Pub/Sub, Robot Kinematics, Sensor Fusion, I2C Protocol

---

## PRIORITY 9 — Internal links on chapter pages
# One change to chapter template → affects 170+ pages

Find: seekhowithrua-seo/app/courses/[slug]/[chapter]/page.tsx
Add after the chapter content area:

```tsx
<Link
  href={`/animation-lab/${params.slug}`}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 8, marginTop: 24, marginBottom: 8,
    background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.3)',
    color: '#1D9E75', fontSize: 13, fontWeight: 600, textDecoration: 'none',
  }}
>
  ✨ Watch 3D animation for this topic →
</Link>
```

---

## PRIORITY 10 — 5 more blog posts (one per day next week)

Day 1: "Hire React Next.js Developer India 2026"
       → /services/web-app-development | keyword: hire React developer India

Day 2: "React Native Developer India 2026 — iOS Android Mobile App"
       → /services/mobile-app-development | keyword: React Native developer India

Day 3: "Animated Python Course India 2026 — Visual Python Tutorial"
       → /animation-lab/python-programming-course | keyword: animated Python course India

Day 4: "HatimAI 3D Game — Free Educational RPG for Coding Students India"
       → /gaming-lab/hatim-quest | keyword: HatimAI game, educational RPG India

Day 5: "Animated AI ML Course India — 3D Neural Network Visualisation 2026"
       → /animation-lab/ai-course | keyword: animated AI course India, 3D neural network

Each post: 800-1200 words. End with CTA to the target page.
Commit: git commit -m "blog: <post-slug>"

---

## PRIORITY 11 — Mobile App (Expo)
# Build after Priorities 1-7 are complete

Core screens in order:
  1. Splash (3s logo)
  2. Login/Register → /api/login/ + /api/register/
  3. Home → 8 course cards (link to web for now)
  4. Voice Rooms lobby → /api/panels/ (same recommendation engine)
  5. VCR Panel → use Agora React Native SDK (not PeerJS — mobile WebRTC issues)
  6. Profile → username, score, followers, rua_title
  7. Leaderboard → same logic as VCRLeaderboard component

Agora for mobile:
  npm install react-native-agora
  Free tier: 10,000 participant-minutes/month
  Replaces PeerJS for the mobile app only — web VCR stays on PeerJS

---

## RANKING SYSTEM — COMPLETE REFERENCE

User rank formula:
  Score = (total_time_minutes x 1) + (upvotes_received x 3) + (followers x 2)

Panel recommendation score per user per panel:
  course_match x 50     = 0 or 50
  interest_match x 30   = 0 or 30
  co_occurrence x 2     = 0 to 40 (capped)
  quality_score x 15    = 0 to 15
  trending x 10         = 0 to 10
  freshness decay       = -0.5 per hour

Panel eligibility:
  Host:     250+ quiz questions Expert level  OR  Rs2000 one-time
  Audience: 100+ quiz questions               OR  Rs149/month (7-day trial)

Monetisation at 1000 followers:
  Ad revenue share, tips in rooms,
  course sales (70% to creator), brand sponsorships

---

## SESSION BUILD ORDER

Session 1 (NEXT):   VCR bug fix (Priority 1) + blog push (today)
Session 2:          Django voice_rooms models + recommendation engine (Priority 2)
Session 3:          API endpoints + deploy + migrate (Priority 3)
Session 4:          VCR follow + upvote + onboarding screen (Priority 4)
Session 5:          Leaderboard component (Priority 5) + subdomain Vercel deploy (Priority 6)
Session 6:          memory-game.html (Priority 7)
Session 7:          data-science.html animations (Priority 8)
Session 8:          quiz-battle.html + Django consumer (Priority 7 pt2)
Session 9:          Copy animation template for 7 other courses (Priority 8 pt2)
Session 10:         Mobile app core screens (Priority 11)
Ongoing:            1 blog post per day (Priority 10)
                    Internal links on chapter pages (Priority 9)
