import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { storage } from './storage';
import { router } from 'expo-router';
import { Alert } from 'react-native';

/**
 * 🛠️ IMPORTANT: 
 * If testing on a physical device, ensure EXPO_PUBLIC_API_URL 
 * in your .env is your LAPTOP IP (e.g., http://192.168.1.5:5000/api)
 * NOT localhost.
 */
const API = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://healthalgorithm-a5aqe6ckgzdmb0cf.southindia-01.azurewebsites.net/api',
  timeout: 15000, // ⏱️ Reduced to 15s for debugging so it fails faster and shows logs
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

API.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 🔍 DEBUG LOG: See exactly where the app is trying to go
    console.log(`🚀 API REQUEST: [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);

    if (config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    const storedToken = await storage.getItem('userToken');
    if (storedToken && config.headers) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }

    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
      config.transformRequest = [(data) => data];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response: AxiosResponse) => {
    // 🔍 DEBUG LOG: See successful data
    console.log(`✅ API SUCCESS: ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(`❌ API ERROR [${error.config?.url}]:`, error.message);
    
    if (error.code === 'ECONNABORTED') {
       console.error("⏱️ TIMEOUT: Check if your server is running or if the IP is correct.");
    }

    if (error.response?.status === 401) {
      await storage.removeItem('userToken');
      router.replace('/auth/login');
    }

    return Promise.reject(error);
  }
);

export default API;