import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from './storage';
import { router } from 'expo-router';

/**
 * 🛠️ Configuration
 * Ensure your .env file has EXPO_PUBLIC_API_URL set.
 * For physical devices, use your computer's IP: http://192.168.x.x:5000/api
 */
const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000, // 15-second timeout for slow medical report uploads
});

/**
 * 🛡️ Request Interceptor
 * Injects the JWT token and handles FormData headers
 */
API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Fetch token from SecureStore/AsyncStorage
    const token = await storage.getItem('userToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Specialized handling for Medical Report Uploads (FormData)
    if (config.data instanceof FormData) {
      // Axios usually sets this automatically, but deleting it 
      // ensures the browser/mobile environment sets the correct boundary
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🛡️ Response Interceptor
 * Globally handles 401 (Unauthorized) and 403 (Forbidden) errors
 */
API.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    // Detect if the user's session has expired or token is invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("🚨 Session Expired - Redirecting to Login");
      
      // Clear sensitive data
      await storage.removeItem('userToken');
      await storage.removeItem('userData'); // Clear cached user role/details
      
      // Redirect to login (Expo Router)
      router.replace('../(auth)/login');
    }

    // Optional: Handle 403 Forbidden (e.g., Patient trying to access Admin screens)
    if (error.response?.status === 403) {
      console.warn("🚫 Access Denied: Insufficient Permissions");
    }

    return Promise.reject(error);
  }
);

export default API;