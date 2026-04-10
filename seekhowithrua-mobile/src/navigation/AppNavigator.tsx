// mobile/src/navigation/AppNavigator.tsx

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";

// Pages
import LoginSignupLogout from "../pages/LoginSignupLogout";
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
        <Stack.Screen name="Auth" component={LoginSignupLogout} />
      )}
      <Stack.Screen name="VCRoom" component={VCRoom} />
    </Stack.Navigator>
  );
}