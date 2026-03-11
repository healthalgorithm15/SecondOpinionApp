import React, { useState } from 'react';
import { 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  View, 
  Image, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextStyle,
  ViewStyle
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { STRINGS } from '../../constants/Strings';
import { COLORS } from '../../constants/theme';
import { authService } from '@/services/authService';

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '',
    mobile: '', 
    password: '' 
  });

  // 🟢 LOGIC UNTOUCHED: STRICT VALIDATION
  const validateSignup = () => {
    const { name, email, mobile, password } = formData;
    
    if (!name.trim()) return "Full name is required.";
    
    if (!email.trim() && !mobile.trim()) {
      return "Please provide either an email or a mobile number.";
    }

    if (email.trim().length > 0) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        return "The email format is invalid (e.g., name@domain.com).";
      }
    }

    if (mobile.trim().length > 0) {
      const numericMobile = mobile.replace(/\D/g, ''); 
      if (numericMobile.length !== 10) {
        return "Mobile number must be exactly 10 digits.";
      }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!password) return "Password is required.";
    if (!passwordRegex.test(password)) {
      return "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character.";
    }

    return null; 
  };

  // 🟢 LOGIC UNTOUCHED: REGISTRATION HANDLER
  const handleRegister = async () => {
    setErrorMsg(null);
    
    const validationError = validateSignup();
    if (validationError) {
      setErrorMsg(validationError);
      return; 
    }

    setLoading(true);
    try {
      await authService.register(formData.name, formData.email, formData.mobile, formData.password);
      
      if (formData.mobile.trim()) {
        router.push({ 
          pathname: '/auth/otp' as any, 
          params: { identifier: formData.mobile.trim(), mode: 'signup' } 
        });
      } else {
        router.push({ 
          pathname: '/auth/verify-email' as any, 
          params: { email: formData.email.trim() } 
        });
      }
    } catch (error: any) {
      const debugMessage = `
    Err: ${error.message} 
    URL: ${error.config?.url} 
    Status: ${error.response?.status}
  `;
  setErrorMsg(debugMessage);
  console.log("Full Error Object:", error);
      //setErrorMsg(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={STRINGS.auth.createAccount} subtitle={STRINGS.auth.signUpInstructions}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flexContainer}
        keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.glassCard}>
            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. John Doe" 
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              onChangeText={(v) => setFormData({...formData, name: v})} 
            />

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
            <TextInput 
              style={styles.input} 
              placeholder="name@email.com" 
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              onChangeText={(v) => setFormData({...formData, email: v})} 
            />

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <Text style={styles.optionalText}>Optional</Text>
            </View>
            <TextInput 
              style={styles.input} 
              placeholder="+91 00000 00000" 
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              onChangeText={(v) => setFormData({...formData, mobile: v})} 
            />

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.passwordInput} 
                secureTextEntry={!showPassword} 
                placeholder="••••••••" 
                placeholderTextColor="rgba(15, 23, 42, 0.4)"
                onChangeText={(v) => setFormData({...formData, password: v})} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <PrimaryButton 
              title="Create Account" 
              onPress={handleRegister} 
              loading={loading} 
              variant="primary"
              style={{ marginTop: 8 }}
            />

            <View style={styles.divider}>
              <View style={styles.line} /><Text style={styles.orText}>OR</Text><View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.7}>
              <Image source={require('../../assets/images/google-icon.webp')} style={styles.googleIcon} />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.footerContainer}
            onPress={() => router.push('/auth/login' as any)}
          >
            <Text style={styles.footerLink}>
              Already have an account? <Text style={styles.footerBold}>Log in</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 100, // 🟢 FIX: Provides room for footer without clipping
    paddingTop: 8 
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.69)', 
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10,
  } as ViewStyle,
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 6, marginLeft: 4 } as TextStyle,
  optionalText: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginBottom: 6 },
  input: { 
    backgroundColor: '#ffffff', borderRadius: 14, padding: 14, fontSize: 16, color: '#0f172a',
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16,
  } as TextStyle,
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20,
  } as ViewStyle,
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: '#0f172a' } as TextStyle,
  eyeIcon: { paddingRight: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#cbd5e1' },
  orText: { marginHorizontal: 12, color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  googleBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' 
  } as ViewStyle,
  googleIcon: { width: 18, height: 18, marginRight: 10 },
  googleText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  errorBox: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', 
    padding: 10, borderRadius: 12, marginBottom: 16, gap: 8 
  } as ViewStyle,
  errorText: { color: '#ef4444', fontSize: 13, fontWeight: '600', flex: 1 },
  footerContainer: {
    marginTop: 30,
    alignItems: 'center',
  } as ViewStyle,
  footerLink: { color: '#FFFFFF', fontSize: 15 } as TextStyle,
  footerBold: { color: '#2b146b', fontWeight: '800', textDecorationLine: 'underline' },
});