import { useEffect, useState } from 'react';

import { Stack } from 'expo-router';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import * as Notifications from 'expo-notifications';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';

// Prevent the splash screen from hiding until fonts and notification logic are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // 1. Load Custom Fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // 2. Initialize Native-Only Services (Notifications)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,      // Legacy support
          shouldPlaySound: true,
          shouldSetBadge: false,
          // ✅ FIX for ts(2322): Modern Expo SDK requirements
          shouldShowBanner: true, 
          shouldShowList: true,
        }),
      });
    }
  }, []);

  // 3. Final Readiness Check
  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
      // Small delay ensures smooth transition from splash to app
      setTimeout(async () => {
        await SplashScreen.hideAsync();
      }, 100);
    }
  }, [fontsLoaded, fontError]);

  // Loading State (while fonts are mounting)
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1E7D75" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* --- Auth & Entry Flow --- */}
      <Stack.Screen name="index" /> 
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="auth/otp" />
      <Stack.Screen name="auth/doctor-activation" /> 
      
      {/* --- Main Application Tabs --- */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          animation: 'fade',
          gestureEnabled: false 
        }} 
      />

      {/* --- Global Modals & Utilities --- */}
      <Stack.Screen 
        name="view/DocumentViewScreen" 
        options={{ 
          presentation: 'modal', 
          headerShown: false,
          // This allows the document viewer to slide up like a sheet on iOS
        }} 
      />
    </Stack>
  );
}