import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import AuthLayout from '../AuthLayout'; 

interface LandingProps {
  name: string;
  onStart: () => void;
  onViewDoctor: () => void;
  onViewPayment: () => void;
  activeCaseStatus?: string | null; 
}

export const PatientLandingUI = ({ 
  name, 
  onStart, 
  onViewDoctor, 
  onViewPayment, 
  activeCaseStatus 
}: LandingProps) => {

  const getStatusDisplay = () => {
    switch (activeCaseStatus) {
      case 'AI_PROCESSING':
        return { label: 'AI ANALYSIS IN PROGRESS', color: '#60A5FA' };
      case 'PENDING_DOCTOR':
        return { label: 'SPECIALIST REVIEW PENDING', color: '#FACC15' };
      case 'COMPLETED':
        return { label: 'MEDICAL REPORT READY ✅', color: '#22C55E' };
      default:
        return { label: 'SYNCHRONIZING...', color: '#94A3B8' };
    }
  };
  
  const statusInfo = getStatusDisplay();
  const isCaseActive = !!activeCaseStatus;

  return (
    <AuthLayout title="Praman AI" subtitle={`Welcome, ${name.split(' ')[0]}`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Tracker Strip */}
        {isCaseActive && (
          <TouchableOpacity 
            style={[styles.trackerStrip, { borderColor: statusInfo.color + '40' }]} 
            onPress={onStart}
          >
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={statusInfo.color} />
          </TouchableOpacity>
        )}

        {/* Main Action Button */}
        <TouchableOpacity style={[styles.mainButton, SHADOWS.button]} onPress={onStart}>
          <View style={styles.buttonInner}>
            <Text style={styles.buttonText}>
              {isCaseActive ? 'Track Active Case' : 'Start New Analysis'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Specialist Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
             <View style={styles.iconCircle}>
                <Ionicons name="medical-outline" size={20} color={COLORS.primary} />
             </View>
             <Text style={styles.cardTitle}>Specialist Panel</Text>
          </View>
          <Text style={styles.cardBody}>
            Our AI works alongside top-tier medical specialists to ensure your diagnosis is 100% accurate and verified.
          </Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewDoctor}>
            <Text style={styles.linkText}>Meet the Doctors</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 🟢 RESTORED: Transparent Pricing Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
             <View style={styles.iconCircle}>
                <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
             </View>
             <Text style={styles.cardTitle}>Transparent Pricing</Text>
          </View>
          <Text style={styles.cardBody}>
            No hidden costs. Get a comprehensive analysis for just ₹500 per report.
          </Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewPayment}>
            <Text style={styles.linkText}>How it works</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Secure Vault Card */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
             <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
             </View>
             <Text style={styles.cardTitle}>Secure Vault</Text>
          </View>
          <Text style={styles.cardBody}>
            All your medical history and reports are encrypted and stored in your private vault for future reference.
          </Text>
        </View>

        {/* Process Section */}
        <View style={styles.processSection}>
          <Text style={styles.processHeading}>Simple 3-Step Process</Text>
          
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <View>
              <Text style={styles.stepTitle}>Upload Reports</Text>
              <Text style={styles.stepDesc}>Upload medical reports securely.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <View>
              <Text style={styles.stepTitle}>Pay Analysis Fee</Text>
              <Text style={styles.stepDesc}>Pay a one-time analysis fee.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <View>
              <Text style={styles.stepTitle}>Verified Report</Text>
              <Text style={styles.stepDesc}>Receive verified AI report in 10 mins.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
  trackerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '800', flex: 1, letterSpacing: 0.5 },
  mainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 18,
    marginBottom: 24,
  },
  buttonInner: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  glassCard: { 
    padding: 20, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF', 
    marginBottom: 16,
    ...SHADOWS.soft
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 19, fontWeight: '800', color: COLORS.primary },
  cardBody: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 15 },
  cardLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  processSection: { marginVertical: 10 },
  processHeading: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 18 },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  stepTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  stepDesc: { fontSize: 14, color: '#94A3B8' },
});