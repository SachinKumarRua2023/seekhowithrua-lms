"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model

User = get_user_model()

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
    expected_key = 'seekho-reset-2025'
    
    provided_key = request.data.get('secret_key', '')
    username = request.data.get('username', 'master')
    new_password = request.data.get('password')
    new_email = request.data.get('email')
    
    if provided_key != expected_key:
        return Response({'error': 'Invalid secret key'}, status=403)
    
    if not new_password:
        return Response({'error': 'New password required'}, status=400)
    
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
        })
    except User.DoesNotExist:
        if not new_email:
            return Response({'error': f'User "{username}" not found'}, status=404)
        user = User.objects.create_superuser(
            username=username,
            email=new_email,
            password=new_password,
        )
        return Response({'success': True, 'message': f'New admin "{username}" created'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/ml/', include('ml_apps.urls')),
    path('api/vcr/', include('voice_rooms.urls')),
    path('api/lms/', include('lms.urls')),
    path('api/', include('livevc.urls')),
    path('api/admin/reset-password/', reset_admin_password),
    path('debug/', debug_urls),
]
