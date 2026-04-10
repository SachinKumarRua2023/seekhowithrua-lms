// mobile/src/hooks/useAuth.ts
// Replaces: frontend auth context
// Uses: Zustand authStore

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, isAuthenticated, loadUser, logout, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser().finally(() => setLoading(false));
  }, [loadUser]);

  const isTrainer = useMemo(() => user?.role === "trainer" || user?.profile?.role === "trainer", [user]);
  const isPremium = useMemo(() => user?.is_premium || false, [user]);
  const displayName = useMemo(() => user?.first_name || user?.email || "User", [user]);

  return {
    user,
    isAuthenticated,
    loading,
    logout,
    clearAuth,
    isTrainer,
    isPremium,
    displayName,
  };
}
