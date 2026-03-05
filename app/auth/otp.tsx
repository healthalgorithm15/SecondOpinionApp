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
  TextStyle,
  ViewStyle 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { COLORS } from '../../constants/theme';
import { authService } from '@/services/authService';
import { storage } from '@/utils/storage'; 

// 🟢 Services for Real-time & Notifications
import { socketService } from '@/services/socketService';
import { registerForPushNotificationsAsync } from '@/hooks/useNotifications';

export default function OtpVerificationScreen() {
  const { identifier, mode } = useLocalSearchParams<{ identifier: string; mode: string }>();
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * handleVerifyOtp
   * Verifies the 2FA code and initializes background services
   */
  const handleVerifyOtp = async () => {
    if (otp.length < 4) return setErrorMsg("Please enter the verification code.");
    setLoading(true);
    setErrorMsg(null);

    const verificationMode = (mode || 'login') as 'login' | 'reset';

    try {
      // 1. Verify OTP with Backend
      const response = await authService.verifyOTP(identifier, otp, verificationMode);
      const { user, token } = response.data;

      // 2. Persist Auth Session
      if (token) {
        await storage.setItem('userToken', token);
        if (user?._id) await storage.setItem('userId', user._id); 
        if (user?.name) await storage.setItem('userName', user.name);
        if (user?.role) await storage.setItem('userRole', user.role.toLowerCase());
      }

      // 🟢 3. BACKGROUND SERVICES (Real-time & Push)
      // We perform these BEFORE navigation to ensure the DB is updated
      if (verificationMode === 'login' && user) {
        try {
          // Connect to Socket.io
          socketService.connect();
          socketService.joinRoom({ 
            userId: user._id, 
            role: user.role 
          });

          // Get Push Token and update profile
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            // 🔥 CRITICAL: We await this so the DB is updated before the screen unmounts
            await authService.updateProfile({ pushToken });
            console.log("✅ Push token registered successfully");
          }
        } catch (bgError) {
          // Log background errors but don't block the user
          console.error("⚠️ Background Service Init Failed:", bgError);
        }
      }

      // 🟢 4. ROLE-BASED NAVIGATION (With Crash Protection)
      // Wrapping in 300ms timeout prevents java.lang.IllegalStateException on Android
      setTimeout(() => {
        if (user?.role === 'doctor' && user?.isFirstLogin) {
          return router.replace('/auth/doctor-activation');
        }

        switch (user?.role?.toLowerCase()) {
          case 'admin':
            router.replace('/(tabs)/admin-home');
            break;
          case 'doctor':
            router.replace('/(tabs)/doctor/doctor-home');
            break;
          case 'patient':
            router.replace('/(tabs)/patient/patienthome');
            break;
          default:
            router.replace('/auth/login');
            break;
        }
      }, 300);

    } catch (error: any) {
      console.error("❌ OTP Verification Error:", error);
      setErrorMsg(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Enter Code" subtitle={`We've sent a code to ${identifier}`}>
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
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => authService.resendOTP(identifier)}
              >
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
  flexContainer: { 
    flex: 1 
  },
  scrollContent: { 
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start', 
    paddingBottom: 40,
  },
  glassCard: {
    marginTop: 10, 
    backgroundColor: 'rgba(255, 255, 255, 0.97)', 
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
    width: '100%',
  } as ViewStyle,
  fieldLabel: { 
    fontSize: 16,
    fontWeight: '700', 
    color: '#1e293b', 
    marginBottom: 16, 
    textAlign: 'center' 
  } as TextStyle,
  otpInput: { 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0', 
    borderRadius: 16, 
    padding: 16, 
    fontSize: 32, 
    fontWeight: '800', 
    textAlign: 'center', 
    letterSpacing: 12, 
    marginBottom: 24, 
    width: '100%', 
    color: '#1E5D57' 
  } as TextStyle,
  submitBtn: { 
    width: '100%', 
    marginTop: 10,
    borderRadius: 16 
  },
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
  resendContainer: { 
    marginTop: 28, 
    alignItems: 'center' 
  } as ViewStyle,
  resendText: { 
    color: '#475569',
    fontSize: 14, 
    marginBottom: 6 
  } as TextStyle,
  resendLink: { 
    color: '#1E5D57', 
    fontWeight: '800', 
    fontSize: 16,
    textDecorationLine: 'underline'
  } as TextStyle,
});