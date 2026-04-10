from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Reset admin password and update email'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='New admin email')
        parser.add_argument('--password', type=str, help='New admin password')
        parser.add_argument('--username', type=str, default='master', help='Admin username to reset')

    def handle(self, *args, **options):
        username = options['username']
        new_email = options['email']
        new_password = options['password']

        try:
            user = User.objects.get(username=username)
            
            if new_email:
                user.email = new_email
                self.stdout.write(self.style.SUCCESS(f'Email updated to: {new_email}'))
            
            if new_password:
                user.set_password(new_password)
                self.stdout.write(self.style.SUCCESS('Password reset successfully'))
            
            # Ensure user is staff and superuser
            user.is_staff = True
            user.is_superuser = True
            user.save()
            
            self.stdout.write(self.style.SUCCESS(
                f'Admin user "{username}" updated successfully!\n'
                f'Email: {user.email}\n'
                f'Is Staff: {user.is_staff}\n'
                f'Is Superuser: {user.is_superuser}'
            ))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User "{username}" not found. Creating new admin...'))
            
            if not new_email or not new_password:
                self.stdout.write(self.style.ERROR('Need --email and --password to create new admin'))
                return
            
            user = User.objects.create_superuser(
                username=username,
                email=new_email,
                password=new_password,
                first_name='Master',
                last_name='Admin'
            )
            self.stdout.write(self.style.SUCCESS(f'New admin "{username}" created!'))
