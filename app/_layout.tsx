import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, Platform, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';

// Ignore specific logs that can clutter production monitoring
LogBox.ignoreLogs(['Params being passed in navigation state']);

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Reloading the app might trigger this; ignore it */
});

// ✅ Production Notification Config
// We configure this outside the component to ensure it's registered early
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, 
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  // 1. Load Custom Fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // 2. Resource Management
  useEffect(() => {
    async function prepare() {
      try {
        // If fonts are loaded or there's an error loading them, move forward
        if (fontsLoaded || fontError) {
          // You could fetch remote config or local storage keys here if needed
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn('Preparation Error:', e);
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  // 3. Smooth Transition Handler
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Small delay prevents a "flash" of white between splash and first screen
      setTimeout(async () => {
        await SplashScreen.hideAsync();
      }, 150);
    }
  }, [appIsReady]);

  // Loading State
  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#1E7D75" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/signup" />
        <Stack.Screen name="auth/otp" />
        <Stack.Screen name="auth/doctor-activation" />

        {/* Tab Application */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            gestureEnabled: false,
            animation: 'fade'
          }} 
        />

        {/* Global Modal Viewers */}
        <Stack.Screen 
          name="view/DocumentViewScreen" 
          options={{ 
            presentation: 'transparentModal',
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
    </View>
  );
}