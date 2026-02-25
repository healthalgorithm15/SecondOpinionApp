import { Platform } from 'react-native';

/**
 * Universal Storage Utility
 * Web: Uses standard localStorage
 * Mobile: Uses expo-secure-store (Hardware-encrypted)
 */
export const storage = {
  /**
   * Retrieves a value from storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      // Require inline to prevent web bundler issues
      const SecureStore = require('expo-secure-store');
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      return null;
    }
  },

  /**
   * Saves a value to storage
   * Note: SecureStore only accepts strings
   */
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      if (Platform.OS === 'web') {
        localStorage.setItem(key, stringValue);
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.setItemAsync(key, stringValue);
      }
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  },

  /**
   * Removes a single key from storage
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        const SecureStore = require('expo-secure-store');
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
    }
  },

  /**
   * Helper to clear auth-related data specifically
   * Updated to include 'userRole' to ensure RootLayout doesn't 
   * redirect based on a previous user's session.
   */
  clearAuth: async (): Promise<void> => {
    try {
      const keys = ['userToken', 'userName', 'userRole'];

      if (Platform.OS === 'web') {
        keys.forEach(key => localStorage.removeItem(key));
      } else {
        const SecureStore = require('expo-secure-store');
        // Execute deletions in parallel for better performance
        await Promise.all([
          SecureStore.deleteItemAsync('userToken'),
          SecureStore.deleteItemAsync('userName'),
          SecureStore.deleteItemAsync('userRole'),
        ]);
      }
      console.log("🧹 Auth storage cleared successfully");
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  }
};