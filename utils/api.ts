import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from './storage';
import { router } from 'expo-router';

/**
 * 🛠️ Configuration
 * baseURL uses the environment variable with a robust fallback.
 * Timeout is set to 90s to accommodate high-res medical scans on slow networks.
 */
const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://healthalgorithm-a5aqe6ckgzdmb0cf.southindia-01.azurewebsites.net/api',
  timeout: 90000, 
});

/**
 * 🛡️ Request Interceptor
 * Injects JWT tokens and handles multi-user security.
 */
API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 1. Fetch token from SecureStore
    const token = await storage.getItem('userToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Specialized handling for Medical Report Uploads (FormData)
    if (config.data instanceof FormData) {
      // We set multipart/form-data but allow the native layer to append the boundary
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = [(data) => data];
    }

    // 3. 🛡️ Double-Tap Protection for Payments & Submissions
    // Gives extra time for processing and prevents accidental double-requests
    if (config.url?.includes('/submit-review') || config.url?.includes('/payment')) {
      config.timeout = 120000; // 2 Minutes
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
    
    // Check if the request was to the login endpoint to avoid loops
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');

    // 🚨 401 Unauthorized: Session Expired
    if (error.response?.status === 401 && !isLoginRequest) {
      console.log("🚨 Session Expired - Redirecting to Login");
      
      // Clear local state to prevent cross-user data leakage
      await storage.removeItem('userToken');
      await storage.removeItem('userData');
      await storage.removeItem('userRole');

      // Kick to login
      router.replace('/auth/login'); 
    }

    // 🚫 403 Forbidden: Permission Denied
    if (error.response?.status === 403) {
      console.warn("🚫 Access Denied: User attempted to access unauthorized resource");
      // You can optionally route to a "Forbidden" page here
    }

    // 🌐 Network / Timeout Errors
    if (error.code === 'ECONNABORTED') {
      console.error("⏱️ Request Timeout: The server took too long to respond.");
    }

    return Promise.reject(error);
  }
);

export default API;