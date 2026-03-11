import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import AuthLayout from '../AuthLayout'; // Ensure this path is correct

interface LandingProps {
  name: string;
  onStart: () => void;
  onViewDoctor: () => void;
  onViewPayment: () => void;
}

export const PatientLandingUI = ({ name, onStart, onViewDoctor, onViewPayment }: LandingProps) => {
  return (
    <AuthLayout 
      title={`${STRINGS.patient.greeting}, ${name}`}
      subtitle="Your health reports, decoded by experts."
    >
      {/* 1. TRUST CARDS */}
      <View style={styles.section}>
        <BlurView intensity={60} tint="light" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
            <Text style={[styles.cardTitle, TYPOGRAPHY.header, { fontSize: 18 }]}>Clinical Precision</Text>
          </View>
          <Text style={[styles.cardDesc, TYPOGRAPHY.body]}>
            Our AI analyzes your data, which is then verified by senior consultants to ensure 100% accuracy.
          </Text>
          
          <TouchableOpacity style={styles.linkButton} onPress={onViewDoctor}>
            <Text style={[styles.linkText, TYPOGRAPHY.boldText, { color: COLORS.primary }]}>
              Meet our Lead Consultant
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </BlurView>

        <BlurView intensity={60} tint="light" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={28} color={COLORS.primary} />
            <Text style={[styles.cardTitle, TYPOGRAPHY.header, { fontSize: 18 }]}>Transparent Pricing</Text>
          </View>
          <Text style={[styles.cardDesc, TYPOGRAPHY.body]}>
            No hidden costs. Get a comprehensive analysis for just ₹500 per report.
          </Text>

          <TouchableOpacity style={styles.linkButton} onPress={onViewPayment}>
            <Text style={[styles.linkText, TYPOGRAPHY.boldText, { color: COLORS.primary }]}>
              How it works
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* 2. STEP-BY-STEP GUIDE */}
      <View style={styles.guideSection}>
        <Text style={[styles.guideTitle, TYPOGRAPHY.header, { fontSize: 20 }]}>Simple 3-Step Process</Text>
        
        <View style={styles.step}>
          <View style={styles.stepNumber}><Text style={styles.stepNumText}>1</Text></View>
          <Text style={[styles.stepText, TYPOGRAPHY.body]}>Upload your medical reports securely.</Text>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}><Text style={styles.stepNumText}>2</Text></View>
          <Text style={[styles.stepText, TYPOGRAPHY.body]}>Pay a one-time analysis fee.</Text>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}><Text style={styles.stepNumText}>3</Text></View>
          <Text style={[styles.stepText, TYPOGRAPHY.body]}>Receive a detailed AI report in 10 mins.</Text>
        </View>
      </View>

      {/* 3. CALL TO ACTION */}
      <TouchableOpacity style={styles.mainButton} onPress={onStart}>
        <Text style={[styles.mainButtonText, TYPOGRAPHY.button]}>Get Started Now</Text>
        <Ionicons name="rocket-outline" size={20} color="#FFF" />
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  section: { gap: 20, marginTop: 20 },
  glassCard: {
    padding: 20,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
    backgroundColor: COLORS.glassBg,
    ...SHADOWS.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { color: COLORS.primary },
  cardDesc: { color: COLORS.textSub, lineHeight: 20 },
  
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 15 },
  linkText: { fontSize: 14 },
  
  guideSection: { marginTop: 40, paddingHorizontal: 5 },
  guideTitle: { color: COLORS.textMain, marginBottom: 20 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  stepNumber: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.primary, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  stepNumText: { color: COLORS.white, fontWeight: '800' },
  stepText: { color: COLORS.textMain, flex: 1 },
  
  mainButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 56,
    borderRadius: BORDER_RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    ...SHADOWS.button,
  },
  mainButtonText: { color: COLORS.white }
});