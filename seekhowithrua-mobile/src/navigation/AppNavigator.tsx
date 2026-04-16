// mobile/src/navigation/AppNavigator.tsx
// JWT Auth from app.seekhowithrua.com

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";

// Pages
import LoginScreen from "../pages/LoginScreen";
import MainTabs from "./MainTabs";
import VCRoom from "../pages/VCRoom";

// UI
import { LoadingScreen } from "../components/ui/LoadingScreen";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  VCRoom: { panelId?: string | number } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
      <Stack.Screen name="VCRoom" component={VCRoom} />
    </Stack.Navigator>
  );
}