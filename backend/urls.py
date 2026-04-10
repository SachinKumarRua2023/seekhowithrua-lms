"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.contrib.auth.models import User


def debug_urls(request):
    from django.urls import get_resolver
    resolver = get_resolver()
    urls = []
    for url in resolver.url_patterns:
        urls.append(str(url.pattern))
    return JsonResponse({"loaded_urls": urls})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_admin_password(request):
    """
    Reset admin password via API (no shell access needed).
    Requires secret_key in request for basic security.
    """
    import os
    expected_key = os.environ.get('ADMIN_RESET_KEY', 'seekho-reset-2025')
    
    provided_key = request.data.get('secret_key', '')
    username = request.data.get('username', 'master')
    new_password = request.data.get('password')
    new_email = request.data.get('email')
    
    if provided_key != expected_key:
        return Response(
            {'error': 'Invalid secret key'},
            status=403
        )
    
    if not new_password:
        return Response(
            {'error': 'New password required'},
            status=400
        )
    
    try:
        user = User.objects.get(username=username)
        user.set_password(new_password)
        if new_email:
            user.email = new_email
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return Response({
            'success': True,
            'message': f'Admin user "{username}" password reset successfully',
            'username': username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        })
    except User.DoesNotExist:
        if not new_email:
            return Response(
                {'error': f'User "{username}" not found. Provide email to create new admin.'},
                status=404
            )
        user = User.objects.create_superuser(
            username=username,
            email=new_email,
            password=new_password,
            first_name='Master',
            last_name='Admin'
        )
        return Response({
            'success': True,
            'message': f'New admin "{username}" created successfully',
            'username': username,
            'email': new_email,
            'is_staff': True,
            'is_superuser': True
        })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/employees/', include('users.urls_old')),
    path('api/auth/', include('users.urls')),
    path('api/ml/', include('ml_apps.urls')),
    path('api/vcr/', include('voice_rooms.urls')),
    path('api/lms/', include('lms.urls')),
    path('api/', include('livevc.urls')),
    path('api/admin/reset-password/', reset_admin_password, name='reset-admin-password'),
    path('debug/', debug_urls),
]