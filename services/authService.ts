import { router } from 'expo-router';
import API from '@/utils/api';
import { storage } from '@/utils/storage'; 

export const authService = {
  // 1. SIGNUP
  register: async (name: string, email: string, mobile: string, password?: string) => {
    const payload = {
      name: name.trim(),
      email: email?.trim() || undefined,
      mobile: mobile?.trim() || undefined,
      password: password
    };
    try {
      const response = await API.post('/auth/register', payload);
      console.log("response date", response.data)
      return response.data;
    } catch (error: any) {
      console.error("❌ Registration Error:", error.response?.data || error.message);
      throw error;
    }
  },

  // 2. LOGIN - Production Hardened
  login: async (identifier: string, password: string) => {
    try {
      const response = await API.post('/auth/login', { 
        identifier: identifier.trim(), 
        password 
      });
      
      const { token, user } = response.data;
      
      if (token && user) {
        // 🛡️ PROD GUARD: Ensure role is always a lowercase string
        const userRole = (user.role || 'patient').toLowerCase();

        await Promise.all([
          storage.setItem('userToken', token),
          storage.setItem('userRole', userRole),
          storage.setItem('userName', user.name || '')
        ]);
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Login API Error:", error.response?.data || error.message);
      throw error;
    }
  },

  // 3. VERIFY OTP - Production Hardened
  verifyOTP: async (identifier: string, otp: string, mode: 'login' | 'reset' = 'login') => {
    try {
      const response = await API.post('/auth/verify-otp', { identifier, otp, mode });
      const { token, user } = response.data;

      if (token && mode === 'login' && user) {
        const userRole = (user.role || 'patient').toLowerCase();

        await Promise.all([
          storage.setItem('userToken', token),
          storage.setItem('userRole', userRole),
          storage.setItem('userName', user.name || '')
        ]);
      }
      
      return response; 
    } catch (error: any) {
      console.error("❌ OTP Error:", error.response?.data);
      throw error;
    }
  },

  // 4. FORGOT PASSWORD
  requestPasswordReset: async (identifier: string) => {
    try {
      const response = await API.post('/auth/forgot-password', { identifier: identifier.trim() });
      return response.data;
    } catch (error: any) {
      console.error("❌ Forgot Password Error:", error.response?.data);
      throw error;
    }
  },

  // 5. RESET PASSWORD
  resetPassword: async (identifier: string, otp: string, newPassword: string) => {
    try {
      const response = await API.post('/auth/reset-password', { 
        identifier: identifier.trim(), 
        otp, 
        newPassword 
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Reset Password Error:", error.response?.data);
      throw error;
    }
  },

  // 6. UPDATE PASSWORD
  updatePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await API.put('/auth/update-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Update Password Error:", error.response?.data);
      throw error;
    }
  },

  // 7. RESEND OTP
 // 7. RESEND OTP (Point to the new dedicated endpoint)
  resendOTP: async (identifier: string) => {
    try {
      const response = await API.post('/auth/resend-otp', { 
        identifier: identifier.trim() 
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Resend OTP Error:", error.response?.data);
      throw error;
    }
  },

  // 8. LOGOUT
  logout: async () => {
    try {
      await storage.clearAuth(); 
      router.replace('/auth/login');
    } catch (e) {
      console.error("Logout Error:", e);
    }
  },

  // 🚀 9. COMPLETE ONBOARDING
  completeOnboarding: async (newPassword: string) => {
    try {
      const response = await API.post('/auth/complete-onboarding', { 
        newPassword 
      });
      return response.data;
    } catch (error: any) {
      console.error("❌ Onboarding Error:", error.response?.data);
      throw error;
    }
  },

  // 🟢 10. GET CURRENT PROFILE (Fixed to hit /auth/me)
  getProfile: async () => {
    try {
      // Hits router.get('/me', protect, getMe) in your backend authRoutes
      const response = await API.get('/auth/me');
      
      // returns { success: true, data: user }
      return response.data; 
    } catch (error: any) {
      console.error("❌ Get Profile Error:", error.response?.data || error.message);
      return null;
    }
  },

  // 11. UPDATE PROFILE
  updateProfile: async (data: { pushToken?: string; name?: string }) => {
    try {
      // Hits router.patch('/profile', protect, authController.updateProfile)
      const response = await API.patch('/auth/profile', data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Update Profile Error:", error.response?.data || error.message);
      throw error;
    }
  },
};