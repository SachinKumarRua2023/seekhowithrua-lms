import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app='users'")
    cursor.execute("DELETE FROM django_migrations WHERE app='admin'")
    print('Deleted users and admin migration records')
