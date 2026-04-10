// SeekhoWithRua LMS JavaScript

// ─── CROSS-DOMAIN AUTHENTICATION HANDLER ───
// Handle login from main app (seekhowithrua.com)
function checkMainAppAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userData = urlParams.get('user');
  
  if (token && userData) {
    try {
      // Parse user data from main app
      const user = JSON.parse(decodeURIComponent(userData));
      
      // Store in localStorage for LMS
      localStorage.setItem('cosmos_auth_token', token);
      localStorage.setItem('cosmos_user', JSON.stringify(user));
      
      // Clean up URL (remove token and user params)
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('user');
      window.history.replaceState({}, '', url.toString());
      
      console.log('Authenticated via main app:', user.email);
      return true;
    } catch (e) {
      console.error('Failed to parse auth data:', e);
    }
  }
  return false;
}

// Auto-check on load
checkMainAppAuth();

// ─── PROACTIVE SSO AUTH CHECK ───
// If not authenticated via URL params, check localStorage or redirect to main app
function checkSSOAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Skip if already authenticated
  if (localStorage.getItem('cosmos_auth_token')) {
    console.log('Already authenticated (localStorage)');
    updateAuthUI();
    return;
  }
  
  // Skip if explicitly told not to check (coming from main app link)
  if (urlParams.get('skip_sso') === '1') {
    console.log('Skipping SSO check (skip_sso=1)');
    return;
  }
  
  // Check if we're in an iframe (avoid redirect loops)
  if (window.self !== window.top) {
    return;
  }
  
  // Check if we've already tried SSO recently (prevent loops)
  const lastSSOAttempt = sessionStorage.getItem('last_sso_attempt');
  const now = Date.now();
  if (lastSSOAttempt && (now - parseInt(lastSSOAttempt)) < 5000) {
    return; // Don't retry within 5 seconds
  }
  
  // Mark SSO attempt
  sessionStorage.setItem('last_sso_attempt', now.toString());
  
  // Redirect to main app to check auth status
  // Main app should verify its own auth and redirect back with token
  const currentPage = encodeURIComponent(window.location.href);
  const mainAppAuthUrl = `https://app.seekhowithrua.com/auth/check?redirect=${currentPage}`;
  
  console.log('Redirecting to main app for SSO check...');
  window.location.href = mainAppAuthUrl;
}

// Check auth status and update UI
function updateAuthUI() {
  const token = localStorage.getItem('cosmos_auth_token');
  const userData = localStorage.getItem('cosmos_user');
  
  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      // Update UI to show logged-in state
      const userSection = document.querySelector('.user-section');
      if (userSection) {
        userSection.innerHTML = `
          <div class="user-info" style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #fff; font-size: 14px;">👋 ${user.first_name || user.username}</span>
            <button onclick="logout()" style="background: #ff4757; color: #fff; border: none; padding: 5px 15px; border-radius: 20px; cursor: pointer; font-size: 12px;">Logout</button>
          </div>
        `;
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }
  }
}

// Logout function
function logout() {
  localStorage.removeItem('cosmos_auth_token');
  localStorage.removeItem('cosmos_user');
  window.location.reload();
}

// Run SSO check after a short delay (let page load first)
setTimeout(checkSSOAuth, 100);

// Course Data - 8 Pre-populated Courses
const defaultCourses = [
  {
    id: 'python-fundamentals',
    title: 'Python Programming Fundamentals',
    category: 'python',
    level: 'beginner',
    description: 'Master Python from basics to advanced. Learn syntax, data structures, OOP, and build real projects.',
    icon: '🐍',
    gradient: 'linear-gradient(135deg, #3776ab, #ffd43b)',
    videos: [
      { title: 'Introduction to Python', duration: '10:30', youtubeUrl: 'https://www.youtube.com/watch?v=8DvywoWv6fI', module: 'Module 1: Getting Started', description: 'What is Python and why learn it?' },
      { title: 'Setting Up Python Environment', duration: '12:45', youtubeUrl: 'https://www.youtube.com/watch?v=YYXdXT2l-Gg', module: 'Module 1: Getting Started', description: 'Install Python and IDE setup' },
      { title: 'Variables and Data Types', duration: '15:20', youtubeUrl: 'https://www.youtube.com/watch?v=khIv5p1JIAA', module: 'Module 2: Python Basics', description: 'Understanding variables, strings, integers, floats' },
      { title: 'Operators and Expressions', duration: '14:00', youtubeUrl: 'https://www.youtube.com/watch?v=v5CM47X7pHA', module: 'Module 2: Python Basics', description: 'Arithmetic, comparison, and logical operators' },
      { title: 'Control Flow - If Statements', duration: '18:30', youtubeUrl: 'https://www.youtube.com/watch?v=PqFKFXyNbXk', module: 'Module 3: Control Structures', description: 'Making decisions with if-elif-else' },
      { title: 'Loops - For and While', duration: '20:15', youtubeUrl: 'https://www.youtube.com/watch?v=94UHCEMAXmU', module: 'Module 3: Control Structures', description: 'Repeating code with loops' },
      { title: 'Functions in Python', duration: '22:00', youtubeUrl: 'https://www.youtube.com/watch?v=u-OmVr_fT4s', module: 'Module 4: Functions', description: 'Creating reusable code blocks' },
      { title: 'Lists and Tuples', duration: '19:45', youtubeUrl: 'https://www.youtube.com/watch?v=W8KRzm-HUcc', module: 'Module 5: Data Structures', description: 'Working with sequences' }
    ]
  },
  {
    id: 'data-science-complete',
    title: 'Data Science Complete Course',
    category: 'data-science',
    level: 'intermediate',
    description: 'Complete data science roadmap: Python, pandas, numpy, matplotlib, statistics, and machine learning basics.',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
    videos: [
      { title: 'Introduction to Data Science', duration: '8:45', youtubeUrl: 'https://www.youtube.com/watch?v=ua-CiDNNj30', module: 'Module 1: Introduction', description: 'What is data science and career paths' },
      { title: 'NumPy Fundamentals', duration: '25:30', youtubeUrl: 'https://www.youtube.com/watch?v=QUT1VHiLmmI', module: 'Module 2: NumPy', description: 'Arrays, broadcasting, and operations' },
      { title: 'Pandas Basics', duration: '28:00', youtubeUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg', module: 'Module 3: Pandas', description: 'DataFrames and Series' },
      { title: 'Data Cleaning with Pandas', duration: '30:15', youtubeUrl: 'https://www.youtube.com/watch?v=KdmPHEu9mkI', module: 'Module 3: Pandas', description: 'Handling missing data and duplicates' },
      { title: 'Data Visualization with Matplotlib', duration: '24:00', youtubeUrl: 'https://www.youtube.com/watch?v=3Xc3CA655Y4', module: 'Module 4: Visualization', description: 'Charts, plots, and customization' },
      { title: 'Seaborn for Statistical Viz', duration: '26:30', youtubeUrl: 'https://www.youtube.com/watch?v=6GUZXDef2U4', module: 'Module 4: Visualization', description: 'Advanced statistical visualizations' },
      { title: 'Statistics for Data Science', duration: '35:00', youtubeUrl: 'https://www.youtube.com/watch?v=xxpc-HPKN28', module: 'Module 5: Statistics', description: 'Descriptive and inferential statistics' },
      { title: 'Introduction to Machine Learning', duration: '40:00', youtubeUrl: 'https://www.youtube.com/watch?v=ukzFI9rgwfM', module: 'Module 6: ML Basics', description: 'Supervised vs unsupervised learning' }
    ]
  },
  {
    id: 'full-stack-web-dev',
    title: 'Full Stack Web Development',
    category: 'web-dev',
    level: 'beginner',
    description: 'Become a full stack developer. HTML, CSS, JavaScript, React, Node.js, and database integration.',
    icon: '💻',
    gradient: 'linear-gradient(135deg, #61dafb, #f7df1e)',
    videos: [
      { title: 'Web Development Roadmap', duration: '12:00', youtubeUrl: 'https://www.youtube.com/watch?v=ZxKM3DCV2kE', module: 'Module 1: Introduction', description: 'Frontend, backend, and full stack overview' },
      { title: 'HTML5 Complete Guide', duration: '32:00', youtubeUrl: 'https://www.youtube.com/watch?v=mJgBOIoGihA', module: 'Module 2: HTML', description: 'Structure, tags, forms, and semantics' },
      { title: 'CSS3 Fundamentals', duration: '35:00', youtubeUrl: 'https://www.youtube.com/watch?v=yfoY53QXEnI', module: 'Module 3: CSS', description: 'Selectors, box model, flexbox, grid' },
      { title: 'CSS Animations and Transitions', duration: '28:00', youtubeUrl: 'https://www.youtube.com/watch?v=1PnVor36_40', module: 'Module 3: CSS', description: 'Keyframes, transforms, and effects' },
      { title: 'JavaScript Basics', duration: '40:00', youtubeUrl: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', module: 'Module 4: JavaScript', description: 'Variables, functions, DOM manipulation' },
      { title: 'JavaScript ES6+ Features', duration: '38:00', youtubeUrl: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc', module: 'Module 4: JavaScript', description: 'Arrow functions, destructuring, async/await' },
      { title: 'React.js Fundamentals', duration: '42:00', youtubeUrl: 'https://www.youtube.com/watch?v=Ke90Tje7q0A', module: 'Module 5: React', description: 'Components, props, state, hooks' },
      { title: 'Node.js and Express', duration: '36:00', youtubeUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', module: 'Module 6: Backend', description: 'Server setup, routes, and middleware' }
    ]
  },
  {
    id: 'machine-learning-ai',
    title: 'Machine Learning & AI',
    category: 'ai-ml',
    level: 'advanced',
    description: 'Deep dive into ML algorithms, neural networks, deep learning, and AI applications with Python.',
    icon: '🤖',
    gradient: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
    videos: [
      { title: 'ML vs AI vs Deep Learning', duration: '10:00', youtubeUrl: 'https://www.youtube.com/watch?v=J6_1M3hYnQI', module: 'Module 1: Foundations', description: 'Understanding the terminology' },
      { title: 'Linear Regression', duration: '28:00', youtubeUrl: 'https://www.youtube.com/watch?v=nk2CQITm_eo', module: 'Module 2: Supervised Learning', description: 'Theory and implementation' },
      { title: 'Logistic Regression', duration: '25:00', youtubeUrl: 'https://www.youtube.com/watch?v=yIYKR4sgzI8', module: 'Module 2: Supervised Learning', description: 'Classification basics' },
      { title: 'Decision Trees and Random Forest', duration: '32:00', youtubeUrl: 'https://www.youtube.com/watch?v=J4Wdy0Wc_xo', module: 'Module 2: Supervised Learning', description: 'Tree-based algorithms' },
      { title: 'Support Vector Machines', duration: '30:00', youtubeUrl: 'https://www.youtube.com/watch?v=efR1C6CvhmE', module: 'Module 2: Supervised Learning', description: 'SVM theory and kernel trick' },
      { title: 'K-Means Clustering', duration: '24:00', youtubeUrl: 'https://www.youtube.com/watch?v=4b5d3muPQmA', module: 'Module 3: Unsupervised Learning', description: 'Clustering algorithms' },
      { title: 'Neural Networks Basics', duration: '45:00', youtubeUrl: 'https://www.youtube.com/watch?v=aircAruvnKk', module: 'Module 4: Deep Learning', description: 'Perceptrons, layers, backpropagation' },
      { title: 'Convolutional Neural Networks', duration: '50:00', youtubeUrl: 'https://www.youtube.com/watch?v=YRhxdVk_sIs', module: 'Module 4: Deep Learning', description: 'CNNs for image recognition' }
    ]
  },
  {
    id: 'react-native-mobile',
    title: 'React Native Mobile Development',
    category: 'mobile',
    level: 'intermediate',
    description: 'Build iOS and Android apps with React Native. Components, navigation, APIs, and app deployment.',
    icon: '📱',
    gradient: 'linear-gradient(135deg, #61dafb, #764abc)',
    videos: [
      { title: 'React Native Introduction', duration: '12:00', youtubeUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', module: 'Module 1: Getting Started', description: 'Why React Native vs native development' },
      { title: 'Environment Setup', duration: '20:00', youtubeUrl: 'https://www.youtube.com/watch?v=0NCCHNFL1xc', module: 'Module 1: Getting Started', description: 'Expo, Android Studio, Xcode setup' },
      { title: 'Core Components', duration: '28:00', youtubeUrl: 'https://www.youtube.com/watch?v=qSRrxpdMpVc', module: 'Module 2: Components', description: 'View, Text, Image, ScrollView, FlatList' },
      { title: 'Styling in React Native', duration: '24:00', youtubeUrl: 'https://www.youtube.com/watch?v=Hf4MJH0F3TU', module: 'Module 2: Components', description: 'Flexbox and StyleSheet' },
      { title: 'Navigation with React Navigation', duration: '32:00', youtubeUrl: 'https://www.youtube.com/watch?v=OmQhHyROufc', module: 'Module 3: Navigation', description: 'Stack, Tab, and Drawer navigation' },
      { title: 'State Management with Redux', duration: '35:00', youtubeUrl: 'https://www.youtube.com/watch?v=9jULH5nH9B4', module: 'Module 4: State', description: 'Redux, actions, reducers, store' },
      { title: 'API Integration', duration: '30:00', youtubeUrl: 'https://www.youtube.com/watch?v=K3aT1I8UQ3s', module: 'Module 5: Backend', description: 'Fetch, Axios, and REST APIs' },
      { title: 'Building and Publishing Apps', duration: '25:00', youtubeUrl: 'https://www.youtube.com/watch?v=gjgRdbwxeKI', module: 'Module 6: Deployment', description: 'App Store and Play Store deployment' }
    ]
  },
  {
    id: 'mysql-database',
    title: 'MySQL Database Mastery',
    category: 'database',
    level: 'beginner',
    description: 'Master SQL and MySQL. Database design, queries, joins, optimization, and real-world projects.',
    icon: '🗄️',
    gradient: 'linear-gradient(135deg, #00758f, #f29111)',
    videos: [
      { title: 'Database Fundamentals', duration: '15:00', youtubeUrl: 'https://www.youtube.com/watch?v=4cWkVbCP2-E', module: 'Module 1: Introduction', description: 'Relational databases and SQL basics' },
      { title: 'MySQL Installation and Setup', duration: '18:00', youtubeUrl: 'https://www.youtube.com/watch?v=Cz3WcZLRaWc', module: 'Module 1: Introduction', description: 'Installing MySQL and Workbench' },
      { title: 'Creating Databases and Tables', duration: '22:00', youtubeUrl: 'https://www.youtube.com/watch?v=7S_tz1z_5bA', module: 'Module 2: DDL', description: 'CREATE, ALTER, DROP operations' },
      { title: 'Basic SQL Queries', duration: '28:00', youtubeUrl: 'https://www.youtube.com/watch?v=9Pzj7AjZG7U', module: 'Module 3: DML', description: 'SELECT, INSERT, UPDATE, DELETE' },
      { title: 'WHERE Clause and Filtering', duration: '24:00', youtubeUrl: 'https://www.youtube.com/watch?v=82zC9Ip3Zjg', module: 'Module 3: DML', description: 'Conditional filtering with WHERE' },
      { title: 'JOINs Explained', duration: '32:00', youtubeUrl: 'https://www.youtube.com/watch?v=9yeOJ0ZMUYw', module: 'Module 4: Relationships', description: 'INNER, LEFT, RIGHT, FULL JOINs' },
      { title: 'Aggregation and Grouping', duration: '26:00', youtubeUrl: 'https://www.youtube.com/watch?v=BEbQRda27Kw', module: 'Module 5: Advanced', description: 'GROUP BY, HAVING, aggregate functions' },
      { title: 'Database Design Best Practices', duration: '30:00', youtubeUrl: 'https://www.youtube.com/watch?v=ztHopE5Wnpc', module: 'Module 6: Design', description: 'Normalization, indexing, optimization' }
    ]
  },
  {
    id: 'english-communication',
    title: 'English Communication Skills',
    category: 'english',
    level: 'beginner',
    description: 'Improve your English speaking and writing. Grammar, vocabulary, business communication, and confidence building.',
    icon: '🗣️',
    gradient: 'linear-gradient(135deg, #e74c3c, #3498db)',
    videos: [
      { title: 'Building English Confidence', duration: '15:00', youtubeUrl: 'https://www.youtube.com/watch?v=nKqDk5dZTV4', module: 'Module 1: Mindset', description: 'Overcoming fear of speaking' },
      { title: 'English Grammar Basics', duration: '30:00', youtubeUrl: 'https://www.youtube.com/watch?v=SyhdTt6QZsk', module: 'Module 2: Grammar', description: 'Tenses, parts of speech, sentence structure' },
      { title: 'Daily Vocabulary Building', duration: '20:00', youtubeUrl: 'https://www.youtube.com/watch?v=nmP3J0X1u9Q', module: 'Module 3: Vocabulary', description: 'Word roots, context learning, flashcards' },
      { title: 'Pronunciation and Accent', duration: '25:00', youtubeUrl: 'https://www.youtube.com/watch?v=mM6sWKubP8o', module: 'Module 4: Speaking', description: 'Phonetics and clear speech' },
      { title: 'Business Email Writing', duration: '22:00', youtubeUrl: 'https://www.youtube.com/watch?v=k0QHX3s4UpE', module: 'Module 5: Writing', description: 'Professional email formats and etiquette' },
      { title: 'Interview English', duration: '28:00', youtubeUrl: 'https://www.youtube.com/watch?v=iRULJlR1sQc', module: 'Module 6: Professional', description: 'Common interview questions and answers' },
      { title: 'Presentations in English', duration: '32:00', youtubeUrl: 'https://www.youtube.com/watch?v=bcgshUqszcY', module: 'Module 6: Professional', description: 'Structuring and delivering presentations' },
      { title: 'Group Discussion Skills', duration: '24:00', youtubeUrl: 'https://www.youtube.com/watch?v=8pNJP5xWNqQ', module: 'Module 7: Advanced', description: 'GD tips and communication strategies' }
    ]
  },
  {
    id: 'interview-preparation',
    title: 'Interview Preparation Masterclass',
    category: 'career',
    level: 'intermediate',
    description: 'Crack technical and HR interviews. DSA, system design, resume building, salary negotiation, and mock interviews.',
    icon: '💼',
    gradient: 'linear-gradient(135deg, #2ecc71, #27ae60)',
    videos: [
      { title: 'Interview Strategy Overview', duration: '18:00', youtubeUrl: 'https://www.youtube.com/watch?v=U8mQG6A7E5E', module: 'Module 1: Strategy', description: 'Understanding interview process' },
      { title: 'Resume Building Guide', duration: '25:00', youtubeUrl: 'https://www.youtube.com/watch?v=jla50rC27rU', module: 'Module 2: Resume', description: 'ATS-friendly resume tips' },
      { title: 'DSA - Arrays and Strings', duration: '40:00', youtubeUrl: 'https://www.youtube.com/watch?v=UTVg7wzMWQc', module: 'Module 3: Technical', description: 'Common array problems and solutions' },
      { title: 'DSA - Linked Lists and Trees', duration: '45:00', youtubeUrl: 'https://www.youtube.com/watch?v=6sBsM13nO5k', module: 'Module 3: Technical', description: 'Data structure fundamentals' },
      { title: 'System Design Basics', duration: '50:00', youtubeUrl: 'https://www.youtube.com/watch?v=MbjObhmHaXU', module: 'Module 4: System Design', description: 'Scalability, databases, caching' },
      { title: 'HR Interview Questions', duration: '30:00', youtubeUrl: 'https://www.youtube.com/watch?v=1iB3z9n8qYg', module: 'Module 5: HR Round', description: 'Tell me about yourself, strengths, weaknesses' },
      { title: 'Salary Negotiation', duration: '22:00', youtubeUrl: 'https://www.youtube.com/watch?v=uiZ-2E9XL8Q', module: 'Module 6: Offer', description: 'How to negotiate effectively' },
      { title: 'Mock Interview Session', duration: '45:00', youtubeUrl: 'https://www.youtube.com/watch?v=B8QpD-I8E3c', module: 'Module 7: Practice', description: 'Full mock interview with feedback' }
    ]
  }
];

// Storage Helpers
function getCourses() {
  const stored = localStorage.getItem('lms_courses');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default courses
  localStorage.setItem('lms_courses', JSON.stringify(defaultCourses));
  return defaultCourses;
}

function saveCourse(course) {
  const courses = getCourses();
  const existingIndex = courses.findIndex(c => c.id === course.id);
  if (existingIndex >= 0) {
    courses[existingIndex] = course;
  } else {
    courses.push(course);
  }
  localStorage.setItem('lms_courses', JSON.stringify(courses));
}

function updateCourse(course) {
  saveCourse(course);
}

function getCourseProgress(courseId) {
  const stored = localStorage.getItem(`lms_progress_${courseId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  return { completedVideos: [], lastWatched: null };
}

function saveCourseProgress(courseId, progress) {
  localStorage.setItem(`lms_progress_${courseId}`, JSON.stringify(progress));
}

function getEnrolledCourses() {
  const stored = localStorage.getItem('lms_enrolled');
  if (stored) {
    return JSON.parse(stored);
  }
  // Auto-enroll in all courses by default
  const allCourseIds = defaultCourses.map(c => c.id);
  localStorage.setItem('lms_enrolled', JSON.stringify(allCourseIds));
  return allCourseIds;
}

function enrollInCourse(courseId) {
  const enrolled = getEnrolledCourses();
  if (!enrolled.includes(courseId)) {
    enrolled.push(courseId);
    localStorage.setItem('lms_enrolled', JSON.stringify(enrolled));
  }
}

// UI Functions
function showNotification(message, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const particleCount = 30;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
    container.appendChild(particle);
  }
}

function calculateOverallProgress() {
  const courses = getCourses();
  const enrolled = getEnrolledCourses();

  if (enrolled.length === 0) return 0;

  let totalProgress = 0;
  enrolled.forEach(courseId => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const progress = getCourseProgress(courseId);
      const percentage = (progress.completedVideos.length / course.videos.length) * 100;
      totalProgress += percentage;
    }
  });

  return Math.round(totalProgress / enrolled.length);
}

function updateOverallProgress() {
  const progressEl = document.getElementById('overallProgress');
  if (progressEl) {
    const progress = calculateOverallProgress();
    progressEl.textContent = `${progress}% Complete`;
  }
}

function renderCourseCard(course) {
  const progress = getCourseProgress(course.id);
  const percentage = Math.round((progress.completedVideos.length / course.videos.length) * 100);
  const isCompleted = percentage === 100;

  return `
    <div class="course-card" onclick="window.location.href='course.html?course=${course.id}'">
      <div class="course-image" style="background: ${course.gradient};">
        <span>${course.icon}</span>
        <span class="course-badge">${course.level}</span>
      </div>
      <div class="course-content">
        <div class="course-category">${course.category.replace('-', ' ')}</div>
        <h3 class="course-title">${course.title}</h3>
        <p class="course-description">${course.description}</p>
        <div class="course-meta">
          <span>${course.videos.length} videos</span>
          <div class="course-progress">
            ${isCompleted
              ? '<span style="color: var(--success);">✓ Completed</span>'
              : `<div class="progress-circle" style="--progress: ${percentage}">${percentage}%</div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function filterCourses(courses, filter, searchTerm) {
  return courses.filter(course => {
    const matchesFilter = filter === 'all' || course.category === filter;
    const matchesSearch = !searchTerm ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
}

function renderCourseGrid() {
  const grid = document.getElementById('courseGrid');
  if (!grid) return;

  const courses = getCourses();
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const searchTerm = document.getElementById('searchInput')?.value || '';

  const filtered = filterCourses(courses, activeFilter, searchTerm);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <p>No courses found matching your search.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(renderCourseCard).join('');
}

// Event Listeners
function initIndexPage() {
  createParticles();
  updateOverallProgress();
  renderCourseGrid();

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCourseGrid();
    });
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderCourseGrid();
    });
  }

  // Update stats
  const courses = getCourses();
  const totalVideos = courses.reduce((sum, c) => sum + c.videos.length, 0);

  const totalCoursesEl = document.getElementById('totalCourses');
  const totalVideosEl = document.getElementById('totalVideos');

  if (totalCoursesEl) totalCoursesEl.textContent = courses.length;
  if (totalVideosEl) totalVideosEl.textContent = totalVideos + '+';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('courseGrid')) {
    initIndexPage();
  }
});
