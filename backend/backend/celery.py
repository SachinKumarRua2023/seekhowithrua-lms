"""
Celery configuration for Django backend
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'payment-reminder-7th': {
        'task': 'lms.tasks.send_payment_reminders',
        'schedule': crontab(day_of_month='7-10', hour=9, minute=0),
    },
    'class-reminder-24h': {
        'task': 'lms.tasks.send_class_reminders',
        'schedule': crontab(hour='*/1', minute=0),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
