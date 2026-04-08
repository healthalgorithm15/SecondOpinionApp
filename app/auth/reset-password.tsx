import React, { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  Alert, 
  View, 
  Text, 
  Platform, 
  TouchableOpacity,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 🟢 Infrastructure & Theme
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import { authService } from '@/services/authService';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { identifier, otp } = useLocalSearchParams<{ identifier: string; otp: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!newPassword) {
      return Alert.alert("Error", "Please enter a new password.");
    }

    if (!passwordRegex.test(newPassword)) {
      return Alert.alert(
        "Security Requirement",
        "Password needs an uppercase letter, a number, and a special character (min 8 chars)."
      );
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    setLoading(true);
    try {
      await authService.resetPassword(identifier, otp, newPassword);
      
      const successMsg = STRINGS.auth.resetSuccess || "Password reset successfully!";

      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.replace('/auth/login');
      } else {
        Alert.alert(
          "Success", 
          successMsg, 
          [{ text: "Login", onPress: () => router.replace('/auth/login') }],
          { cancelable: false }
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your new secure password.">
      <View style={styles.form}>
        
        {/* New Password Field */}
        <Text style={styles.label}>{STRINGS.auth.password}</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor={COLORS.textSub}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={COLORS.textSub} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Confirm Password Field (Now with Eye Toggle) */}
        <Text style={[styles.label, { marginTop: 15 }]}>{STRINGS.auth.confirmPassword}</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor={COLORS.textSub}
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={COLORS.textSub} 
            />
          </TouchableOpacity>
        </View>

        <PrimaryButton 
          title={STRINGS.common.continue} 
          onPress={handleReset} 
          loading={loading}
          style={{ marginTop: 30 }}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%', marginTop: 10 },
  label: { 
    fontSize: 14, 
    color: COLORS.textMain, 
    marginBottom: 8, 
    fontWeight: '600' 
  } as TextStyle,
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    marginBottom: 5, // Added slight spacing
  } as ViewStyle,
  passwordInput: { 
    flex: 1,
    paddingHorizontal: 15,
    color: COLORS.textMain,
    fontSize: 16,
  } as TextStyle,
  eyeIcon: { 
    paddingHorizontal: 15,
  } as ViewStyle,
});