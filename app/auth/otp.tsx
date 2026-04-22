import React, { useState, useEffect } from 'react';
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
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
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

  // 🛡️ Rate Limiting States
  const [timer, setTimer] = useState(60); 
  const [canResend, setCanResend] = useState(false);

  /**
   * ⏲️ Countdown Timer Effect
   */
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  /**
   * 🛡️ handleVerifyOtp
   */
  const handleVerifyOtp = async () => {
    if (otp.length < 4) return setErrorMsg("Please enter the verification code.");
    
    setLoading(true);
    setErrorMsg(null);

    const verificationMode = (mode === 'reset' ? 'reset' : 'login');

    try {
      const response = await authService.verifyOTP(identifier, otp, verificationMode);
      
      if (!response?.data) throw new Error("Invalid response from server");
      
      if (verificationMode === 'reset') {
        setLoading(false);
        return router.push({
          pathname: '/auth/reset-password',
          params: { identifier, otp }
        });
      }

      const { user, token } = response.data;

      // 🟢 AUTH PERSISTENCE
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await Promise.all([
          storage.setItem('userToken', token),
          storage.setItem('userId', user._id || ''),
          storage.setItem('userName', user.name || ''),
          storage.setItem('userEmail', user.email || ''),
          storage.setItem('userPhone', user.mobile || ''),
          storage.setItem('userRole', user.role.toLowerCase()),
          storage.setItem('isFirstLogin', String(user.isFirstLogin)), // Store for guard logic
        ]);
      }

      // 🟢 SERVICE INITIALIZATION
      if (token && verificationMode === 'login') {
        try {
          await socketService.connect(token);
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) await authService.updateProfile({ pushToken });
        } catch (srvErr) {
          console.warn("Non-critical service init failure:", srvErr);
        }
      }

      // 🟢 DYNAMIC ROUTING ENGINE
      if (user && user.role) {
        const role = user.role.toLowerCase();
        
        setTimeout(() => {
          // 1. Check for Mandatory Password Change (Doctors & CMOs)
          if ((role === 'doctor' || role === 'cmo') && user.isFirstLogin) {
            return router.replace({
              pathname: '/auth/doctor-activation',
              params: { userId: user._id, email: user.email }
            });
          }

          // 2. Role-Based Dashboard Redirection
       // Inside handleVerifyOtp, within the role-based switch
switch (role) {
  case 'admin': 
    router.replace('/(admin)/' as any); 
    break;
    
  case 'doctor': 
  case 'cmo': 
    // 🟢 Both roles now point to the shared file in your existing structure
    router.replace('/(tabs)/doctor/doctor-home' as any); 
    break;
    
  case 'patient': 
    router.replace('/(tabs)/patient/discover' as any); 
    break;
    
  default: 
    router.replace('/auth/login' as any); 
    break;
}
        }, 300); 
      } else {
        setErrorMsg("Profile data missing. Please log in again.");
      }
    } catch (error: any) {
      const backendMessage = error.response?.data?.message;
      setErrorMsg(backendMessage || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔄 handleResend
   */
  const handleResend = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      await authService.resendOTP(identifier);
      
      setTimer(60);
      setCanResend(false);
      
      Alert.alert("Code Sent", "A new verification code has been sent.");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to resend code.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
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
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={handleResend}
                disabled={!canResend}
              >
                <Text style={[
                  styles.resendLink, 
                  !canResend && { color: '#94a3b8', textDecorationLine: 'none' }
                ]}>
                  {canResend ? "Resend Code" : `Resend in ${timer}s`}
                </Text>
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