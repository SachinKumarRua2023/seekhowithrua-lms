"""
Management command to add Django Full Stack Course with YouTube videos
Run: python manage.py add_django_course
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from lms.models import Course, ClassSession
from datetime import time


class Command(BaseCommand):
    help = 'Add Django Full Stack Course with YouTube video lessons'

    def handle(self, *args, **kwargs):
        # Create Django Full Stack Course
        course, created = Course.objects.get_or_create(
            title='Full Stack Django - Backend Setup & Deployment',
            defaults={
                'description': '''
Complete Django Full Stack course covering:
• Django backend setup from scratch
• End-to-end development workflow
• Deployment to production servers
• Best practices and real-world examples

This course includes two comprehensive video tutorials that will take you from beginner to deployment-ready Django developer.
                ''',
                'category': 'web',
                'level': 'intermediate',
                'course_fee': 0.00,  # Free course
                'is_paid': False,
                'is_active': True,
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created course: {course.title}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Course already exists: {course.title}')
            )
        
        # Add Class Session 1: Django Backend Setup & Course
        session1, created1 = ClassSession.objects.get_or_create(
            course=course,
            title='Full Stack Django Backend Setup - End to End Course',
            defaults={
                'description': '''
Complete Django backend setup tutorial covering:
- Project initialization and structure
- Models, views, and templates
- Authentication and authorization
- Database configuration
- API development
- Testing and debugging

Video ID: TW7PYS6xTpA
                ''',
                'date': timezone.now().date(),
                'start_time': time(10, 0),
                'end_time': time(12, 0),
                'youtube_video_id': 'TW7PYS6xTpA',
                'recording_available': True,
                'is_live': False,
            }
        )
        
        if created1:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Added session: {session1.title}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'  ⚠ Session exists: {session1.title}')
            )
        
        # Add Class Session 2: Django Deployment
        session2, created2 = ClassSession.objects.get_or_create(
            course=course,
            title='Django Project Deployment - Production Ready',
            defaults={
                'description': '''
Learn how to deploy your Django project to production:
- Server setup and configuration
- Database migration in production
- Static and media files handling
- Environment variables and security
- Domain setup and SSL
- Monitoring and maintenance

Video ID: 07U3j9w3J6U
                ''',
                'date': timezone.now().date(),
                'start_time': time(14, 0),
                'end_time': time(16, 0),
                'youtube_video_id': '07U3j9w3J6U',
                'recording_available': True,
                'is_live': False,
            }
        )
        
        if created2:
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Added session: {session2.title}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'  ⚠ Session exists: {session2.title}')
            )
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ Django Full Stack Course setup complete!')
        )
        self.stdout.write(
            self.style.NOTICE(f'Course ID: {course.id}')
        )
        self.stdout.write(
            self.style.NOTICE(f'Video 1: https://youtube.com/watch?v=TW7PYS6xTpA')
        )
        self.stdout.write(
            self.style.NOTICE(f'Video 2: https://youtube.com/watch?v=07U3j9w3J6U')
        )
