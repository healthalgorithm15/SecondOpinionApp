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
import API from '@/utils/api'; 

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
      
      if (!response?.data) {
        throw new Error("Invalid response from server");
      }

      const { user, token } = response.data;

      // 2. Persist Auth Session & Set Headers
      if (token) {
        // ⚡ CRITICAL: Set header in memory FIRST. 
        // This ensures the very next API call (Payment/Socket) has the token.
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Save to local storage in parallel for speed
        await Promise.all([
          storage.setItem('userToken', token),
          storage.setItem('userId', user._id || ''),
          storage.setItem('userName', user.name || ''),
          storage.setItem('userEmail', user.email || ''),
          storage.setItem('userPhone', user.mobile || ''),
          storage.setItem('userRole', user.role.toLowerCase()),
        ]);
      }

      // 3. Initialize Background Services
      // We pass the token directly to the socket to bypass storage latency
      if (token) {
        try {
          // Attempting background initialization
          await socketService.connect(token);
          // Only register push notifications if we are in login mode
          if (verificationMode === 'login') {
            await registerForPushNotificationsAsync();
          }
        } catch (srvErr) {
          console.warn("Background services init warning:", srvErr);
        }
      }

      // 4. ROLE-BASED NAVIGATION
      if (user && user.role) {
        const role = user.role.toLowerCase();
        
        // Small delay ensures state and storage are fully flushed
        setTimeout(() => {
          if (role === 'doctor' && user.isFirstLogin) {
            return router.replace('/auth/doctor-activation');
          }

          switch (role) {
            case 'admin':
              router.replace('/(tabs)/admin-home');
              break;
            case 'doctor':
              router.replace('/(tabs)/doctor/doctor-home');
              break;
            case 'patient':
              // 🟢 SUCCESS: Navigate specifically to the nested discover route
              // This helps resolve the "Home" vs "Discover" icon highlight issue
              router.replace('/(tabs)/patient/discover');
              break;
            default:
              router.replace('/auth/login');
              break;
          }
        }, 300); 
      } else {
        setErrorMsg("User data missing. Please try logging in again.");
      }

    } catch (error: any) {
      console.error("❌ OTP Verification Error:", error);
      const backendMessage = error.response?.data?.message;
      setErrorMsg(backendMessage || "Invalid or expired OTP");
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
  flexContainer: { flex: 1 },
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
  submitBtn: { width: '100%', marginTop: 10, borderRadius: 16 },
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
  resendText: { color: '#475569', fontSize: 14, marginBottom: 6 } as TextStyle,
  resendLink: { 
    color: '#1E5D57', 
    fontWeight: '800', 
    fontSize: 16,
    textDecorationLine: 'underline'
  } as TextStyle,
});