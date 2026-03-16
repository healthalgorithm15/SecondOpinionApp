import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import AuthLayout from '../AuthLayout';

interface PaymentLearnMoreProps {
  onBack: () => void;
  onPay: () => Promise<void>; 
}

export const PaymentLearnMore = ({ onBack, onPay }: PaymentLearnMoreProps) => {
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const pay = STRINGS.patient.paymentGuide;

  const handlePaymentClick = async () => {
    if (isLocalLoading) return;
    
    setIsLocalLoading(true);
    try {
      // Trigger the parent's handlePaymentProcess
      await onPay();
    } catch (error: any) {
      // Error is already handled by parent Alert, but we catch it here to stop the spinner
      console.log("Payment flow stopped.");
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Pricing Details" 
      subtitle="Secure & Transparent Process"
    >
      <TouchableOpacity onPress={onBack} style={styles.floatingClose}>
        <Ionicons name="close" size={28} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.priceCard}>
        <Text style={[styles.priceLabel, TYPOGRAPHY.caption, { color: '#94a3b8' }]}>
          {pay.totalFeeLabel}
        </Text>
        <Text style={[styles.priceAmount, TYPOGRAPHY.brand, { fontSize: 48, color: 'white' }]}>
          {pay.amount}
        </Text>
        <View style={styles.secureBadge}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
          <Text style={[TYPOGRAPHY.boldText, { fontSize: 12, color: '#4CAF50', marginLeft: 6 }]}>
            Single-case AI credit
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, TYPOGRAPHY.boldText]}>
        {pay.breakdownTitle}
      </Text>
      
      <View style={styles.breakdownList}>
        {pay.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, TYPOGRAPHY.body]}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Trust Box: Very important for medical apps */}
      <View style={styles.securityBox}>
        <MaterialCommunityIcons name="lock-outline" size={32} color={COLORS.primary} />
        <View style={styles.securityTextContent}>
          <Text style={[styles.securityTitle, TYPOGRAPHY.boldText]}>
            PCI-Compliant Payment
          </Text>
          <Text style={[styles.securityDesc, TYPOGRAPHY.caption]}>
            Encrypted by Razorpay. No medical data is shared.
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.ctaButton, isLocalLoading && { opacity: 0.8 }]} 
        onPress={handlePaymentClick}
        disabled={isLocalLoading}
        activeOpacity={0.8}
      >
        {isLocalLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={[styles.ctaText, TYPOGRAPHY.button]}>{pay.cta}</Text>
        )}
      </TouchableOpacity>
      
      <Text style={[TYPOGRAPHY.disclaimer, { color: COLORS.textSub, marginTop: 25, textAlign: 'center' }]}>
        Credits never expire and can be used for any medical specialty.
      </Text>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  floatingClose: { position: 'absolute', top: -10, left: 0, padding: 10, zIndex: 10 },
  priceCard: { 
    backgroundColor: COLORS.textMain, 
    borderRadius: BORDER_RADIUS.card, 
    padding: 30, 
    alignItems: 'center', 
    ...SHADOWS.button,
    marginTop: 10
  },
  priceLabel: { fontWeight: '600' },
  priceAmount: { marginVertical: 10 },
  secureBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(76, 175, 80, 0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  sectionLabel: { color: COLORS.textMain, marginBottom: 15, marginTop: 30 },
  breakdownList: { gap: 12 },
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    padding: 16, 
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.soft
  },
  stepNumber: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#E8F3F1', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepNumText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  stepText: { marginLeft: 15, color: COLORS.textSub, flex: 1 },
  securityBox: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.white, 
    padding: 20, 
    borderRadius: BORDER_RADIUS.md, 
    marginTop: 30, 
    alignItems: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  securityTextContent: { marginLeft: 15, flex: 1 },
  securityTitle: { color: COLORS.textMain },
  securityDesc: { marginTop: 2 },
  ctaButton: { 
    backgroundColor: COLORS.primary, 
    padding: 18, 
    borderRadius: BORDER_RADIUS.button, 
    alignItems: 'center', 
    marginTop: 30, 
    ...SHADOWS.button
  },
  ctaText: { color: 'white', fontWeight: '700' }
});