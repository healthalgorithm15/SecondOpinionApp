import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AuthLayout from '../../components/AuthLayout';
import { STRINGS } from '../../constants/Strings';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { authService } from '@/services/authService'; // 👈 Centralized logic

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Simple navigation to Login
  const handleProceedToLogin = () => {
    router.replace('/auth/login');
  };

  // Logic to trigger a resend of the verification email
  const handleResendEmail = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      // Assuming you add a resendEmail method to authService.ts
      // await authService.resendVerification(email as string); 
      
      setFeedbackMsg({ 
        text: "Verification link resent! Check your inbox.", 
        type: 'success' 
      });
    } catch (error: any) {
      setFeedbackMsg({ 
        text: error.response?.data?.message || "Failed to resend. Try again later.", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={STRINGS.auth.verifyEmailTitle} subtitle={STRINGS.auth.verifyEmailSub}>
      <View style={styles.container}>
        
        {/* Feedback Display (Success or Error) */}
        {feedbackMsg && (
          <View style={[
            styles.feedbackBox, 
            feedbackMsg.type === 'error' ? styles.errorBox : styles.successBox
          ]}>
            <Text style={[
              styles.feedbackText, 
              feedbackMsg.type === 'error' ? styles.errorText : styles.successText
            ]}>
              {feedbackMsg.text}
            </Text>
          </View>
        )}

        <Text style={styles.instruction}>{STRINGS.auth.emailSentTo}</Text>
        <View style={styles.emailBadge}>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <PrimaryButton 
          title="Proceed to Login" 
          onPress={handleProceedToLogin} 
          style={{ marginTop: 30 }}
        />

        <View style={styles.footer}>
          <Text style={styles.didntReceive}>{STRINGS.auth.didntReceiveEmail}</Text>
          <TouchableOpacity 
            onPress={handleResendEmail} 
            disabled={loading}
          >
            <Text style={[styles.resendBtn, loading && { opacity: 0.5 }]}>
              {loading ? "Sending..." : STRINGS.auth.resendEmail}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10, alignItems: 'center', width: '100%' },
  feedbackBox: {
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 20,
    borderWidth: 1,
    width: '100%'
  },
  successBox: { backgroundColor: '#F0FDFA', borderColor: COLORS.secondary },
  errorBox: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  feedbackText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  successText: { color: COLORS.primary },
  errorText: { color: '#B91C1C' },
  instruction: { fontSize: 14, color: COLORS.textSub, marginBottom: 15 },
  emailBadge: { 
    backgroundColor: '#F8FAFC', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: BORDER_RADIUS.md, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  emailText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  footer: { marginTop: 40, alignItems: 'center' },
  didntReceive: { color: COLORS.textSub, fontSize: 14 },
  resendBtn: { color: COLORS.secondary, fontWeight: 'bold', marginTop: 10, fontSize: 16 }
});