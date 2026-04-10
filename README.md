# SeekhoWithRua LMS

A complete Learning Management System with YouTube video integration for the SeekhoWithRua platform.

## Features

- **Course Catalog** - Browse 8 pre-populated courses across various tech topics
- **YouTube Video Player** - Embedded video player with chapter navigation
- **Progress Tracking** - LocalStorage-based progress tracking per video
- **My Learning Dashboard** - View enrolled courses, progress, and certificates
- **Trainer Portal** - Create courses and add YouTube videos
- **Responsive Design** - Works on desktop, tablet, and mobile
- **SEO Optimized** - Proper meta tags and structured content

## File Structure

```
seekhowithrua-lms/
├── index.html              # Course catalog homepage
├── course.html             # Video player with YouTube embed
├── my-learning.html        # Student dashboard
├── trainer-dashboard.html  # Trainer content management
├── css/
│   └── lms.css            # All styling (purple/blue theme)
├── js/
│   └── lms.js             # Course data, progress tracking, UI functions
└── README.md              # This file
```

## Courses Included

1. **Python Programming Fundamentals** - 8 videos
2. **Data Science Complete Course** - 8 videos
3. **Full Stack Web Development** - 8 videos
4. **Machine Learning & AI** - 8 videos
5. **React Native Mobile Development** - 8 videos
6. **MySQL Database Mastery** - 8 videos
7. **English Communication Skills** - 8 videos
8. **Interview Preparation Masterclass** - 8 videos

## How It Works

### For Students
1. Visit `index.html` to browse courses
2. Click any course to open the video player
3. Watch YouTube videos embedded in the platform
4. Mark videos as complete to track progress
5. View progress on the "My Learning" dashboard
6. Download certificates for completed courses

### For Trainers
1. Visit `trainer-dashboard.html`
2. Create a new course with title, category, description
3. Add YouTube video URLs (unlisted videos recommended)
4. Organize videos into modules/chapters
5. View student engagement stats

## Technical Details

- **Storage**: All data stored in browser LocalStorage
- **Video Platform**: YouTube embed via IFrame API
- **CSS**: Custom CSS with CSS variables for theming
- **Responsive**: Mobile-first design with breakpoints at 768px and 1024px
- **No Backend Required**: Works entirely client-side

## Integration with Main Platform

This LMS integrates with the SeekhoWithRua ecosystem:
- Links to `app.seekhowithrua.com` for Live Voice Rooms
- Links to `seekhowithrua.com` for SEO site
- Links to `gaming.seekhowithrua.com` for Gaming Lab
- Consistent branding and design language

## Deployment

1. Upload all files to a web server
2. Set up subdomain: `lms.seekhowithrua.com`
3. Or deploy to Vercel/Netlify for free hosting

## Future Enhancements

- Connect to Django backend for user authentication
- Add Razorpay payment integration
- Implement real certificate generation
- Sync progress across devices
- Add quiz/assessment functionality

---

Built by Master Rua (Sachin Kumar) for SeekhoWithRua
