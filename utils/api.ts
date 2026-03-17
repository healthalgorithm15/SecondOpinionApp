import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from './storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

/**
 * 🛠️ Configuration
 * baseURL uses the environment variable with a robust fallback.
 * Timeout is set to 90s to accommodate high-res medical scans on slow networks.
 */
const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://healthalgorithm-a5aqe6ckgzdmb0cf.southindia-01.azurewebsites.net/api',
  timeout: 90000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

/**
 * 🛡️ Request Interceptor
 * Injects JWT tokens and handles multi-user security.
 */
API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Sanitize URL to prevent double slashes (e.g., baseURL/ + /endpoint)
    // This solves potential 404/500 issues on strict routing servers.
    if (config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    // 2. Check if token is already in 'defaults' (In-memory/hot token)
    // This solves the race condition where storage.getItem is too slow after login.
    let token = API.defaults.headers.common['Authorization'];

    // 3. Fallback to SecureStore if not in memory
    if (!token) {
      const storedToken = await storage.getItem('userToken');
      if (storedToken) {
        token = `Bearer ${storedToken}`;
        // Sync back to memory to speed up the next request
        API.defaults.headers.common['Authorization'] = token;
      }
    }

    // 4. Apply the token if found
    if (token && config.headers) {
      config.headers.Authorization = token;
    }

    // 5. Specialized handling for Medical Report Uploads (FormData)
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      // Identity transform is crucial for FormData to work in React Native environments
      config.transformRequest = [(data) => data];
    }

    // 6. 🛡️ Double-Tap Protection for Payments & Submissions
    if (config.url?.includes('/submit-review') || config.url?.includes('/payment') || config.url?.includes('/create-order')) {
      config.timeout = 120000; // 2 Minutes for high-stakes transactions
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🛡️ Response Interceptor
 * Handles session expiration (401) and permission denied (403)
 */
API.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Safety check for network failure where no response object is returned
    if (!error.response) {
      console.error("🌐 Network Error: Check connection or Server status.");
      return Promise.reject(error);
    }
    
    // Avoid redirect loops if the login request itself fails
    const isLoginRequest = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/verify-otp');

    // 🚨 401 Unauthorized: Session Expired
    if (error.response?.status === 401 && !isLoginRequest) {
      console.log("🚨 Session Expired - Cleaning up and redirecting");
      
      // Clear headers and storage to prevent cross-user data leakage
      delete API.defaults.headers.common['Authorization'];
      await Promise.all([
        storage.removeItem('userToken'),
        storage.removeItem('userData'),
        storage.removeItem('userRole'),
        storage.removeItem('userId')
      ]);

      // Alert the user before kicking them out
      Alert.alert(
        "Session Expired",
        "Please log in again to continue.",
        [{ text: "OK", onPress: () => router.replace('/auth/login') }]
      );
    }

    // 🚫 403 Forbidden: Permission Denied
    if (error.response?.status === 403) {
      console.warn("🚫 Access Denied: Unauthorized resource access.");
      Alert.alert(
        "Access Denied",
        "You do not have permission to perform this action."
      );
    }

    // 🌐 Network / Timeout Errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error("⏱️ Request Timeout: The server took too long to respond.");
    }

    return Promise.reject(error);
  }
);

export default API;