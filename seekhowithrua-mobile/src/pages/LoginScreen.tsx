// mobile/src/pages/LoginScreen.tsx
// JWT Auth with deep links from app.seekhowithrua.com

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../store/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

// Deep link scheme
const APP_SCHEME = 'seekhowithrua://auth/callback';
const WEB_LOGIN_URL = 'https://app.seekhowithrua.com/mobile-login';

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Handle deep link callback from web login
  const handleDeepLink = useCallback(async (event: { url: string }) => {
    const url = event.url;
    
    if (url.includes('auth/callback') || url.includes('jwt=')) {
      setLoading(true);
      try {
        // Parse JWT and user data from URL
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        const token = params.get('jwt');
        const userStr = params.get('user');
        
        if (token && userStr) {
          const user = JSON.parse(decodeURIComponent(userStr));
          await setAuth(token, user);
          // Auth store will update and AppNavigator will redirect
        } else {
          Alert.alert('Login Failed', 'Invalid credentials received');
        }
      } catch (error) {
        console.error('Deep link error:', error);
        Alert.alert('Login Error', 'Failed to parse login data');
      } finally {
        setLoading(false);
      }
    }
  }, [setAuth]);

  // Listen for deep links
  useEffect(() => {
    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Open web login in browser
  const handleLogin = async () => {
    setLoading(true);
    try {
      // Add redirect URL to web login
      const loginUrl = `${WEB_LOGIN_URL}?redirect_uri=${encodeURIComponent(APP_SCHEME)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        APP_SCHEME,
        {
          showInRecents: true,
          preferEphemeralSession: false,
        }
      );

      if (result.type === 'success' && result.url) {
        handleDeepLink({ url: result.url });
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to open login page');
    } finally {
      setLoading(false);
    }
  };

  // Open wallet connection for SEEKHO tokens
  const handleConnectWallet = async () => {
    Alert.alert(
      'Connect Solana Wallet',
      'To earn SEEKHO tokens for hosting panels and speaking, connect your Phantom or Solflare wallet.',
      [
        { text: 'Learn More', style: 'default' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoEmoji}>🎓</Text>
        <Text style={styles.title}>SeekhoWithRua</Text>
        <Text style={styles.subtitle}>Learn • Speak • Earn</Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>📚</Text>
          <Text style={styles.featureText}>All Courses</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🎙️</Text>
          <Text style={styles.featureText}>Voice Chat Rooms</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🤖</Text>
          <Text style={styles.featureText}>AI Co-Host</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🪙</Text>
          <Text style={styles.featureText}>Earn SEEKHO Tokens</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>🔐 Login with app.seekhowithrua.com</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.walletButton} onPress={handleConnectWallet}>
            <Text style={styles.walletButtonText}>💎 Connect Solana Wallet</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By logging in, you agree to earn SEEKHO tokens for hosting panels and speaking
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl * 2,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: SPACING.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  walletButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.lg,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  walletButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: SPACING.xxl,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  footerText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
