import React, { useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextStyle,
  ViewStyle
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Constants & Components
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { STRINGS } from '../../constants/Strings';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { authService } from '@/services/authService';

export default function Login() {
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  // Local Validation Logic
  const validateForm = () => {
    const { identifier, password } = formData;
    const trimmedId = identifier.trim();

    if (!trimmedId) return "Email or mobile number is required.";
    if (!password) return "Password is required.";

    const isEmail = trimmedId.includes('@');
    const isNumeric = /^\d+$/.test(trimmedId);

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedId)) return "Please enter a valid email address.";
    } else if (isNumeric) {
      if (trimmedId.length < 10 || trimmedId.length > 15) return "Mobile number must be 10-15 digits.";
    }

    if (password.length < 8) return "Password must be at least 8 characters long.";

    return null;
  };

  /**
   * handleLogin
   * Updated with strict status guards to prevent unauthorized navigation
   */
  const handleLogin = async () => {
    setErrorMsg(null);
    const validationError = validateForm();
    if (validationError) return setErrorMsg(validationError);

    setLoading(true);

    try {
      // 1. API call to your backend
      await authService.login(formData.identifier.trim(), formData.password);
      
      // 2. SUCCESS: Navigate to OTP
      router.push({
        pathname: '/auth/otp' as any,
        params: { identifier: formData.identifier.trim(), mode: 'login' }
      });

    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || "";

      console.log(`[Login] Error Status: ${status} | Message: ${message}`);

      // 🛑 GUARD 1: Explicit Credentials Failure
      // If the user isn't found (404) or password/OTP check failed (401), 
      // we STOP and show the error on the login page.
      if (status === 401 || status === 404) {
        return setErrorMsg("Invalid email/mobile or password.");
      }

      // 🟢 FAIL-SAFE: Delivery issues
      // Only navigate if credentials were correct but notification delivery failed
      const isDeliveryError = message.includes('535') || message.includes('OTP sent') || message.includes('Username and Password');
      
      if (isDeliveryError) {
        console.warn("Credentials verified, but SMTP/SMS failed. Navigating to OTP screen...");
        router.push({
          pathname: '/auth/otp' as any,
          params: { identifier: formData.identifier.trim(), mode: 'login' }
        });
      } else if (status === 403) {
        setErrorMsg(message || "Please verify your account first.");
      } else {
        setErrorMsg(message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={STRINGS.common.login}
      subtitle="Welcome back! Log in to access your dashboard."
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Glass Form Card */}
          <View style={styles.glassCard}>
            
            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <Text style={styles.label}>Email or Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="name@emmmmmail.com or 9876543210"
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              autoCapitalize="none"
              value={formData.identifier}
              onChangeText={(val) => setFormData(prev => ({ ...prev, identifier: val }))}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/auth/forgot-password' as any)}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="rgba(15, 23, 42, 0.4)"
                secureTextEntry={!showPassword}
                value={formData.password}
                onChangeText={(val) => setFormData(prev => ({ ...prev, password: val }))}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <PrimaryButton
              title={STRINGS.common.login}
              onPress={handleLogin}
              loading={loading}
              variant="primary"
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/auth/signup' as any)} 
              style={styles.footerLinkContainer}
            >
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.footerBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimerContainer}>
             <Text style={styles.disclaimerText}>
               Your medical data is encrypted with enterprise-grade security. 
               We prioritize your privacy and confidentiality.
             </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 40, 
    flexGrow: 1, 
    justifyContent: 'center' 
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  } as ViewStyle,
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 14,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fee2e2'
  } as ViewStyle,
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', flex: 1 } as TextStyle,
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginLeft: 4 } as TextStyle,
  forgotText: { color: '#0f766e', fontSize: 13, fontWeight: '700' } as TextStyle,
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  } as TextStyle,
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  } as ViewStyle,
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: '#0f172a' } as TextStyle,
  eyeIcon: { paddingRight: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#cbd5e1' },
  orText: { marginHorizontal: 12, color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  footerLinkContainer: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#64748b', fontSize: 15 },
  footerBold: { color: '#0f766e', fontWeight: '800' },
  disclaimerContainer: { marginTop: 50, paddingHorizontal: 20 },
  disclaimerText: { 
    textAlign: 'center', 
    fontSize: 12, 
    color: '#FFFFFF', 
    lineHeight: 18,
    opacity: 0.85
  } as TextStyle,
});