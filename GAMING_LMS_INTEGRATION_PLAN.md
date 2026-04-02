# Gaming-LMS Integration Master Plan

## 1. Cross-Domain Login for Gaming Site

### Implementation:
- Gaming site (gaming.seekhowithrua.com) redirects to main app login
- Same flow as LMS: `app.seekhowithrua.com/login?redirect=https://gaming.seekhowithrua.com`
- After login, redirect back with token: `gaming.seekhowithrua.com?token=xxx&user=xxx`
- Gaming site stores token and shows logged-in state

### Files to Update:
- `gaming/index.html` - Add login button with redirect
- `gaming/js/auth.js` - Handle token from URL
- `main-app/Login_Signup_Logout.jsx` - Add gaming redirect support

## 2. Gaming Score Tracking & Storage

### Database Schema (Backend):
```python
class GamingScore(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_name = models.CharField(max_length=100)
    score = models.IntegerField()
    level = models.IntegerField(default=1)
    play_time = models.DurationField()
    played_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)  # Additional game-specific data
```

### API Endpoints:
- `POST /api/gaming/score/` - Save new score
- `GET /api/gaming/scores/` - Get user's scores
- `GET /api/gaming/leaderboard/` - Get leaderboard

### Frontend:
- Gaming site calls API after each game session
- Scores displayed in gaming dashboard

## 3. Quiz Results Tracking System

### Database Schema:
```python
class QuizResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    quiz_name = models.CharField(max_length=200)
    score = models.FloatField()
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    time_taken = models.DurationField()
    completed_at = models.DateTimeField(auto_now_add=True)
    answers = models.JSONField()  # Store question-wise answers
```

## 4. Time Tracking System

### For VCR (Voice Chat Rooms):
```python
class VCRSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room_name = models.CharField(max_length=100)
    joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True)
    duration = models.DurationField(null=True)
    role = models.CharField(max_length=20)  # 'host' or 'participant'
```

### For Courses:
```python
class CourseProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    video_id = models.CharField(max_length=100)
    watch_time = models.DurationField(default=timedelta(0))
    completed = models.BooleanField(default=False)
    last_watched = models.DateTimeField(auto_now=True)
```

## 5. Ranking System

### Implementation:
- Calculate score based on: Gaming scores + Quiz scores + Course completion + VCR time
- Weekly and All-time leaderboards
- Rank displayed on profile and dashboard

## 6. Trainer Analytics Dashboard

### Features:
- View all students' progress
- Individual student detailed report
- Course completion rates
- Average scores per course
- Time spent by students
- Export reports (PDF/CSV)

## 7. Student Self-Analytics

### Features:
- Personal growth chart over time
- Skills progress visualization
- Comparison with peers (percentile)
- Achievement timeline
- Recommended courses based on performance

## 8. Achievement Email System

### Triggers:
- Complete first course
- Score 100% on quiz
- Reach top 10 in leaderboard
- Spend 10+ hours on platform
- Complete 5 courses
- Participate in 10 VCR sessions

### Email Service:
- Use SendGrid/AWS SES
- HTML email templates
- Achievement badges in email

## Implementation Priority:
1. Cross-domain login (High - Blocks everything else)
2. Database models & APIs (High)
3. Gaming score tracking (High)
4. Time tracking (Medium)
5. Quiz results (Medium)
6. Rankings (Medium)
7. Dashboards (Medium)
8. Email system (Low)
