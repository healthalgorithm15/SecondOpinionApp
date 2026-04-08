import React, { useState } from 'react';
import {
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
  TextStyle,
  ViewStyle,
  Alert, // 🟢 Required for the Native Popup
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Constants & Components
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { STRINGS } from '../../constants/Strings';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';
import { authService } from '@/services/authService';

export default function Login() {
  const router = useRouter();

  // --- State Management ---
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  /**
   * handleLogin
   * Uses Native Alert to ensure visibility even if state resets
   */
  const handleLogin = async () => {
    // Basic local validation before hitting API
    if (!formData.identifier.trim() || !formData.password) {
      Alert.alert("Required", "Please enter both your email/mobile and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login(
        formData.identifier.trim(), 
        formData.password
      );
      
      if (res.success || res.message === 'OTP sent') {
        router.push({
          pathname: '/auth/otp' as any,
          params: { identifier: formData.identifier.trim(), mode: 'login' }
        });
      }
    } catch (error: any) {
      // 1. Extract the error message from the response
      const serverMsg = error.response?.data?.message || "Invalid credentials";
      
      // 2. Format a user-friendly message
      const finalDisplayMsg = serverMsg === "Invalid credentials" 
        ? "The email/mobile or password you entered is incorrect. Please try again." 
        : serverMsg;

      console.log("🚨 NATIVE ALERT COMMAND SENT:", finalDisplayMsg);

      // 3. 🛡️ THE NATIVE FIX:
      // This alert belongs to the OS. It will stay on screen even if 
      // the Login component behind it resets or unmounts.
      Alert.alert(
        "Login Failed",
        finalDisplayMsg,
        [{ text: "Try Again", style: "default" }]
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={STRINGS.common.login}
      subtitle="Welcome back! Log in to access your dashboard."
    >
      <View style={styles.glassCard}>
        <Text style={styles.label}>Email or Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., name@email.com"
          placeholderTextColor="rgba(15, 23, 42, 0.4)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={formData.identifier}
          onChangeText={(val: string) => setFormData(prev => ({ ...prev, identifier: val }))}
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
            onChangeText={(val: string) => setFormData(prev => ({ ...prev, password: val }))}
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
        </Text>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  } as ViewStyle,
  labelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#1e293b', 
    marginLeft: 4 
  } as TextStyle,
  forgotText: { 
    color: '#0f766e', 
    fontSize: 13, 
    fontWeight: '700' 
  } as TextStyle,
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
  passwordInput: { 
    flex: 1, 
    padding: 16, 
    fontSize: 16, 
    color: '#0f172a' 
  } as TextStyle,
  eyeIcon: { paddingRight: 16 },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 20 
  },
  line: { flex: 1, height: 1, backgroundColor: '#cbd5e1' },
  orText: { 
    marginHorizontal: 12, 
    color: '#94a3b8', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  footerLinkContainer: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#64748b', fontSize: 15 },
  footerBold: { color: '#0f766e', fontWeight: '800' },
  disclaimerContainer: { marginTop: 40, paddingHorizontal: 20 },
  disclaimerText: { 
    textAlign: 'center', 
    fontSize: 12, 
    color: '#FFFFFF', 
    lineHeight: 18,
    opacity: 0.8
  } as TextStyle,
});