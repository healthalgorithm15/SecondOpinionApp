import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { storage } from '../utils/storage'; 
import { COLORS } from '../constants/theme';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Only hide splash screen and show the app once fonts are ready
    if (fontsLoaded || fontError) {
      setIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1E7D75" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Main Entry & Auth Flow */}
      <Stack.Screen name="index" /> 
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="auth/otp" />
      <Stack.Screen name="auth/doctor-activation" /> 
      
      {/* Main App Tabs */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          animation: 'fade',
          gestureEnabled: false 
        }} 
      />

      {/* 🚀 Document Viewer (Correctly placed as a sibling) */}
      <Stack.Screen 
        name="view/DocumentViewScreen" 
        options={{ 
          presentation: 'modal', // Slides up from bottom
          headerShown: false,    // Using your custom header
          title: 'Document Viewer'
        }} 
      />
    </Stack>
  );
}