// mobile/src/store/authStore.ts
// JWT Auth from app.seekhowithrua.com with deep link support
// Uses: expo-secure-store (encrypted) + zustand (reactive state)

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "seekho_jwt_token";
export const USER_KEY = "seekho_user";
export const WALLET_KEY = "seekho_wallet";

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  profile?: { role?: string };
  is_premium?: boolean;
  wallet_address?: string;
  seekho_tokens?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  walletAddress: string | null;
  isLoading: boolean;

  // Actions
  loadUser: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  setWallet: (address: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  getSeekhoTokens: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  walletAddress: null,
  isLoading: true,

  // Called once on app boot
  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_KEY);
      const walletData = await SecureStore.getItemAsync(WALLET_KEY);

      if (token && userData) {
        const user = JSON.parse(userData);
        set({
          token,
          user,
          walletAddress: walletData || user.wallet_address || null,
          isLoading: false,
        });
      } else {
        set({ token: null, user: null, walletAddress: null, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, walletAddress: null, isLoading: false });
    }
  },

  // Called after successful login via deep link from app.seekhowithrua.com
  setAuth: async (token: string, user: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    if (user.wallet_address) {
      await SecureStore.setItemAsync(WALLET_KEY, user.wallet_address);
    }
    set({ token, user, walletAddress: user.wallet_address || null });
  },

  // Set Solana wallet for SEEKHO tokens
  setWallet: async (address: string) => {
    await SecureStore.setItemAsync(WALLET_KEY, address);
    set((state) => ({
      walletAddress: address,
      user: state.user ? { ...state.user, wallet_address: address } : null,
    }));
  },

  // Called on logout
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(WALLET_KEY);
    set({ token: null, user: null, walletAddress: null });
  },

  isAuthenticated: () => {
    return !!get().token;
  },

  getSeekhoTokens: () => {
    return get().user?.seekho_tokens || 0;
  },
}));