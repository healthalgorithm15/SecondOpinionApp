import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Generates an Expo Push Token for the current device.
 * Returns the token string or null if registration fails.
 */
export const registerForPushNotificationsAsync = async () => {
  // 1. Physical Device Check (Push notifications don't work on most Emulators/Simulators)
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
    // The projectId MUST match the one in your app.json and Azure Env Variables
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: 'e81e2f1d-4edc-4b90-869d-b9e7d0edcb36', 
    });
    
    const token = tokenResponse.data;
    console.log("📲 Generated Expo Push Token:", token);

    // 6. Android-Specific Configuration
    // Required for notifications to show up as banners on newer Android versions
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
    // 🛡️ Error Guard: Ensures your login flow doesn't crash if the 
    // Expo servers are down or the internet is unstable.
    console.error("❌ Error registering for push notifications:", error);
    return null;
  }
};