if (Platform.OS === 'web') {
  const globalAny: any = global;
  globalAny.ExpoNotifications = globalAny.ExpoNotifications || {
    // This is the specific method causing the crash in your call stack
    getLastNotificationResponseAsync: () => Promise.resolve(null),
    getLastNotificationResponse: () => null, 
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
    removeNotificationSubscription: () => {},
  };
}
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Generates an Expo Push Token for the current device.
 * Returns the token string or null if registration fails or if on Web.
 */
export const registerForPushNotificationsAsync = async () => {
  // 🛡️ WEB GUARD: Browsers do not support Expo's native push notification system.
  // This prevents the "getLastNotificationResponse is not available on web" error.
  if (Platform.OS === 'web') {
    console.log('🌐 Web platform detected: Skipping native push registration.');
    return null;
  }

  // 1. Physical Device Check (Push notifications don't work on most Emulators)
  if (!Device.isDevice) {
    console.warn('Must use physical device for Push Notifications');
    return null;
  }

  try {
    // 2. Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // 3. Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // 4. Handle cases where the user denies permission
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return null;
    }

    // 5. Fetch the Expo Push Token
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: 'e81e2f1d-4edc-4b90-869d-b9e7d0edcb36', 
    });
    
    const token = tokenResponse.data;
    console.log("📲 Generated Expo Push Token:", token);

    // 6. Android-Specific Configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;

  } catch (error) {
    console.error("❌ Error registering for push notifications:", error);
    return null;
  }
};