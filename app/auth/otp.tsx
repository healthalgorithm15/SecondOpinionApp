import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  TextStyle,
  ViewStyle 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

// 🟢 Core Infrastructure
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { authService } from '@/services/authService';
import { storage } from '@/utils/storage'; 
import API from '@/utils/api'; 

// 🟢 Real-time & Notification Services
import { socketService } from '@/services/socketService';
import { registerForPushNotificationsAsync } from '@/hooks/useNotifications';

export default function OtpVerificationScreen() {
  const { identifier, mode } = useLocalSearchParams<{ identifier: string; mode: string }>();
  const router = useRouter();
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * 🛡️ handleVerifyOtp
   * Finalizes the auth flow and prepares the app state
   */
  const handleVerifyOtp = async () => {
    if (otp.length < 4) return setErrorMsg("Please enter the verification code.");
    
    setLoading(true);
    setErrorMsg(null);

    // Normalize mode for the authService
    const verificationMode = (mode === 'reset' ? 'reset' : 'login');

    try {
      // 1. Verify with Backend
      const response = await authService.verifyOTP(identifier, otp, verificationMode);
      
      if (!response?.data) throw new Error("Invalid response from server");

      const { user, token } = response.data;

      // 2. ⚡ SESSION PERSISTENCE (High Priority)
      if (token) {
        // Set header IMMEDIATELY to prevent 401s on next immediate app calls
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Store user metadata in parallel
        await Promise.all([
          storage.setItem('userToken', token),
          storage.setItem('userId', user._id || ''),
          storage.setItem('userName', user.name || ''),
          storage.setItem('userEmail', user.email || ''),
          storage.setItem('userPhone', user.mobile || ''),
          storage.setItem('userRole', user.role.toLowerCase()),
        ]);
      }

      // 3. 🔄 BACKGROUND SERVICES INIT
      if (token && verificationMode === 'login') {
        try {
          // Connect socket with raw token to bypass storage read latency
          await socketService.connect(token);
          
          // Register for push notifications for medical updates
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await authService.updateProfile({ pushToken });
          }
        } catch (srvErr) {
          console.warn("Non-critical service init failure:", srvErr);
        }
      }

      // 4. 🚀 ROLE-BASED ROUTING
      if (user && user.role) {
        const role = user.role.toLowerCase();
        
        // Small delay to ensure storage flush on low-end devices
        setTimeout(() => {
          // Check for Doctor Activation Requirement
          if (role === 'doctor' && user.isFirstLogin) {
            return router.replace('/auth/doctor-activation');
          }

          // Main Navigation Switch
          switch (role) {
            case 'admin':
              router.replace('/(tabs)/admin-home');
              break;
            case 'doctor':
              router.replace('/(tabs)/doctor/doctor-home');
              break;
            case 'patient':
              router.replace('/(tabs)/patient/discover');
              break;
            default:
              router.replace('/auth/login');
              break;
          }
        }, 300); 
      } else {
        setErrorMsg("Profile data missing. Please log in again.");
      }

    } catch (error: any) {
      console.error("❌ OTP Error:", error);
      const backendMessage = error.response?.data?.message;
      setErrorMsg(backendMessage || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 handleResend
   * Triggers a new OTP and provides UI feedback
   */
  const handleResend = async () => {
    try {
      await authService.resendOTP(identifier);
      Alert.alert("Code Sent", "A new verification code has been sent.");
    } catch (error: any) {
      setErrorMsg("Failed to resend code. Please wait a moment.");
    }
  };

  return (
    <AuthLayout title="Enter Code" subtitle={`We've sent a 6-digit code to ${identifier}`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flexContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.glassCard}>
            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Verification Code</Text>
            
            <TextInput 
              style={styles.otpInput} 
              placeholder="000000" 
              placeholderTextColor="rgba(15, 23, 42, 0.1)"
              keyboardType="number-pad" 
              maxLength={6} 
              value={otp} 
              onChangeText={setOtp} 
              autoFocus 
            />

            <PrimaryButton 
              title="Verify & Continue" 
              onPress={handleVerifyOtp} 
              loading={loading} 
              style={styles.submitBtn} 
            />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleResend}>
                <Text style={styles.resendLink}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  scrollContent: { 
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center', 
    paddingBottom: 40,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  } as ViewStyle,
  fieldLabel: { 
    fontSize: 14,
    fontWeight: '700', 
    color: '#1e293b', 
    marginBottom: 16, 
    textAlign: 'center',
    textTransform: 'uppercase'
  } as TextStyle,
  otpInput: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    borderRadius: 16, 
    padding: 16, 
    fontSize: 28, 
    fontWeight: '800', 
    textAlign: 'center', 
    letterSpacing: 8, 
    marginBottom: 24, 
    color: '#1E5D57' 
  } as TextStyle,
  submitBtn: { width: '100%', borderRadius: 16 },
  errorBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fef2f2', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 20, 
    gap: 8,
    borderWidth: 1,
    borderColor: '#fee2e2'
  } as ViewStyle,
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', flex: 1 },
  resendContainer: { marginTop: 28, alignItems: 'center' } as ViewStyle,
  resendText: { color: '#64748b', fontSize: 14, marginBottom: 4 } as TextStyle,
  resendLink: { 
    color: '#1E5D57', 
    fontWeight: '800', 
    fontSize: 15,
    textDecorationLine: 'underline'
  } as TextStyle,
});