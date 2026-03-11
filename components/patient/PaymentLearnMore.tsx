import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import AuthLayout from '../AuthLayout';

export const PaymentLearnMore = ({ onBack }: { onBack: () => void }) => {
  const pay = STRINGS.patient.paymentGuide;

  return (
    <AuthLayout 
      title="Pricing Details" 
      subtitle="Secure & Transparent Process"
    >
      <TouchableOpacity onPress={onBack} style={styles.floatingClose}>
        <Ionicons name="close" size={28} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={styles.priceCard}>
        <Text style={[styles.priceLabel, TYPOGRAPHY.caption, { color: '#94a3b8' }]}>{pay.totalFeeLabel}</Text>
        <Text style={[styles.priceAmount, TYPOGRAPHY.brand, { fontSize: 48, color: 'white' }]}>{pay.amount}</Text>
        <View style={styles.secureBadge}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
          <Text style={[TYPOGRAPHY.boldText, { fontSize: 12, color: '#4CAF50', marginLeft: 6 }]}>
    One-time secure payment
  </Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, TYPOGRAPHY.boldText]}>{pay.breakdownTitle}</Text>
      <View style={styles.breakdownList}>
        {pay.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumText}>{i + 1}</Text></View>
            <Text style={[styles.stepText, TYPOGRAPHY.body]}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.securityBox}>
        <MaterialCommunityIcons name="lock-outline" size={32} color={COLORS.primary} />
        <View style={styles.securityTextContent}>
          <Text style={[styles.securityTitle, TYPOGRAPHY.boldText]}>{pay.securityTitle}</Text>
          <Text style={[styles.securityDesc, TYPOGRAPHY.caption]}>{pay.securityDesc}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={onBack}>
        <Text style={[styles.ctaText, TYPOGRAPHY.button]}>{pay.cta}</Text>
      </TouchableOpacity>
      
      <Text style={[TYPOGRAPHY.disclaimer, { color: COLORS.textSub, marginTop: 25 }]}>
  Payments are handled via secure, PCI-compliant gateways. No medical data is shared with the payment provider.
</Text>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  floatingClose: { position: 'absolute', top: -10, left: 0, padding: 10, zIndex: 10 },
  priceCard: { 
    backgroundColor: COLORS.textMain, 
    borderRadius: BORDER_RADIUS.card, 
    padding: 40, 
    alignItems: 'center', 
    ...SHADOWS.button,
    marginTop: 10
  },
  priceLabel: { fontWeight: '600' },
  priceAmount: { marginVertical: 10 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
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
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E8F3F1', justifyContent: 'center', alignItems: 'center' },
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
  ctaButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: BORDER_RADIUS.button, alignItems: 'center', marginTop: 40, ...SHADOWS.button },
  ctaText: { color: 'white' }
});