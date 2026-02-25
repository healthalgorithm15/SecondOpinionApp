import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestReset = async () => {
    if (!identifier.trim()) {
      return Alert.alert("Error", STRINGS.validation.invalidIdentifier("email or mobile"));
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(identifier);
      // Navigate to your existing OTP screen
      router.push({
        pathname: '/auth/otp',
        params: { identifier: identifier, mode: 'reset' }
      });
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Could not initiate reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={STRINGS.auth.forgotPasswordTitle || "Forgot Password?"} 
      subtitle={STRINGS.auth.forgotPasswordSub || "Enter your email or mobile to receive a 6-digit code."}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder={STRINGS.auth.email + " / " + STRINGS.auth.mobile}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          placeholderTextColor={COLORS.textSub}
          keyboardType="email-address"
        />

        <PrimaryButton 
          title={STRINGS.auth.sendCode || "Send Code"} 
          onPress={handleRequestReset} 
          loading={loading}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: 20 },
  input: {
    height: 56,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    color: COLORS.textMain,
  }
});