from django.urls import path
from . import views

urlpatterns = [
    # Google OAuth
    path('google/', views.google_auth, name='google-auth'),
    path('google/callback/', views.google_callback, name='google-callback'),
    
    # Standard auth
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout, name='logout'),
    path('user/', views.get_user, name='get-user'),
]
