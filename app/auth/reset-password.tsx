import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (newPassword.length < 8) {
      return Alert.alert("Error", STRINGS.validation.passwordShort);
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    setLoading(true);
    try {
      await authService.resetPassword(identifier, otp, newPassword);
      
      // 🌐 Web Handling
      if (Platform.OS === 'web') {
        window.alert(STRINGS.auth.resetSuccess || "Password reset successfully!");
        router.replace('/auth/login');
      } 
      // 📱 Mobile Handling
      else {
        Alert.alert(
          "Success", 
          STRINGS.auth.resetSuccess || "Password reset successfully!", 
          [
            { 
              text: "Login", 
              onPress: () => router.replace('/auth/login') 
            }
          ],
          { cancelable: false } // 🛡️ Prevents user from dismissing without clicking "Login"
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
        <Text style={styles.label}>{STRINGS.auth.password}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholderTextColor={COLORS.textSub}
        />
        
        <Text style={[styles.label, { marginTop: 15 }]}>{STRINGS.auth.confirmPassword}</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholderTextColor={COLORS.textSub}
        />

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
  label: { fontSize: 14, color: COLORS.textMain, marginBottom: 8, fontWeight: '600' },
  input: { 
    height: 50, 
    backgroundColor: COLORS.white, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: BORDER_RADIUS.md, 
    paddingHorizontal: 15,
    color: COLORS.textMain
  }
});