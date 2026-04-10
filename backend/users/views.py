import json
import urllib.parse
import requests
from django.http import JsonResponse, HttpResponseRedirect
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()

# Google OAuth settings - using environment variables
GOOGLE_CLIENT_ID = getattr(settings, 'GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = getattr(settings, 'GOOGLE_REDIRECT_URI', 'https://api.seekhowithrua.com/api/auth/google/callback/')

@api_view(['GET'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Initiate Google OAuth flow
    Redirects user to Google's OAuth consent screen
    """
    redirect_uri = request.GET.get('redirect_uri', GOOGLE_REDIRECT_URI)
    
    # Build Google OAuth URL
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        'client_id': GOOGLE_CLIENT_ID,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'consent',
        'state': json.dumps({'redirect_uri': redirect_uri}),
    }
    
    auth_url = f"{google_auth_url}?{urllib.parse.urlencode(params)}"
    
    return HttpResponseRedirect(auth_url)


@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth callback
    Exchanges code for tokens and creates/logs in user
    """
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')
    
    # Parse state to get the redirect_uri
    try:
        state_data = json.loads(state) if state else {}
        mobile_redirect_uri = state_data.get('redirect_uri', '')
    except:
        mobile_redirect_uri = ''
    
    if error:
        return Response({'error': f'Google auth error: {error}'}, status=400)
    
    if not code:
        return Response({'error': 'No authorization code received'}, status=400)
    
    # Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        'code': code,
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'redirect_uri': mobile_redirect_uri or GOOGLE_REDIRECT_URI,
        'grant_type': 'authorization_code',
    }
    
    try:
        token_response = requests.post(token_url, data=token_data)
        token_response.raise_for_status()
        tokens = token_response.json()
        
        access_token = tokens.get('access_token')
        id_token = tokens.get('id_token')
        
        # Get user info from Google
        userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        userinfo_response.raise_for_status()
        userinfo = userinfo_response.json()
        
        email = userinfo.get('email')
        google_id = userinfo.get('sub')
        first_name = userinfo.get('given_name', '')
        last_name = userinfo.get('family_name', '')
        picture = userinfo.get('picture', '')
        
        if not email:
            return Response({'error': 'Could not get email from Google'}, status=400)
        
        # Create or get user
        try:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                    'google_id': google_id,
                }
            )
            
            if not created:
                # Update user info
                user.google_id = google_id
                if first_name:
                    user.first_name = first_name
                if last_name:
                    user.last_name = last_name
                user.save()
            
            # Get or create token
            token, _ = Token.objects.get_or_create(user=user)
            
            # Prepare user data for response
            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_trainer': user.is_trainer,
                'profile_picture': picture,
            }
            
            # If mobile redirect URI provided, redirect with token
            if mobile_redirect_uri and '://' in mobile_redirect_uri:
                user_json = urllib.parse.quote(json.dumps(user_data))
                redirect_url = f"{mobile_redirect_uri}?token={token.key}&user={user_json}"
                return HttpResponseRedirect(redirect_url)
            
            # Otherwise return JSON response
            return Response({
                'token': token.key,
                'user': user_data,
                'message': 'Google authentication successful'
            })
            
        except IntegrityError:
            return Response({'error': 'Failed to create user'}, status=500)
            
    except requests.RequestException as e:
        return Response({'error': f'Failed to authenticate with Google: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Standard email/password login"""
    email = request.data.get('username') or request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_trainer': user.is_trainer,
                }
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=401)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=401)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration"""
    email = request.data.get('email')
    password = request.data.get('password')
    username = request.data.get('username') or email.split('@')[0] if email else None
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=400)
    
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=400)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already registered'}, status=400)
    
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_trainer': user.is_trainer,
            }
        })
    except IntegrityError:
        return Response({'error': 'Username already exists'}, status=400)


@api_view(['POST'])
def logout(request):
    """Logout user by deleting token"""
    if request.user.is_authenticated:
        Token.objects.filter(user=request.user).delete()
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
def get_user(request):
    """Get current user info"""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=401)
    
    return Response({
        'id': request.user.id,
        'email': request.user.email,
        'username': request.user.username,
        'first_name': request.user.first_name,
        'last_name': request.user.last_name,
        'is_trainer': request.user.is_trainer,
    })
