import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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

  // 🟢 Dynamic visual feedback based on status
  const getStatusTheme = () => {
  const status = activeCaseStatus?.toUpperCase() || '';
  if (status.includes('COMPLETED')) return '#4ADE80'; // Green for finished
  if (status.includes('PROCESSING')) return '#60A5FA'; // Blue for AI
  if (status.includes('PENDING_DOCTOR')) return '#FACC15'; // Yellow for Specialist
  return '#94A3B8';
};
  const themeColor = getStatusTheme();

  return (
    <AuthLayout 
      title={`Hello, ${name}`}
      subtitle="PramanAI: Expert Medical Second Opinions"
    >
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* 1. ACTIVE CASE TRACKER - Automatically shows/hides */}
        {activeCaseStatus && (
          <TouchableOpacity style={styles.trackerContainer} onPress={onStart}>
            <BlurView intensity={90} tint="dark" style={styles.trackerBlur}>
              <View style={styles.trackerContent}>
                <View style={styles.trackerLeft}>
                  {/* Pulse Dot color changes with status */}
                  <View style={[styles.pulseDot, { backgroundColor: themeColor }]} />
                  <Text style={styles.trackerLabel}>Case Status:</Text>
                  <Text style={[styles.trackerStatus, { color: themeColor }]}>
                    {activeCaseStatus}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </View>
            </BlurView>
          </TouchableOpacity>
        )}

        {/* 2. CLINICAL PRECISION CARD */}
        <BlurView intensity={80} tint="light" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Clinical Precision</Text>
          </View>
          <Text style={styles.cardBody}>
            AI analysis verified by senior consultants to ensure 100% accuracy.
          </Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewDoctor}>
            <Text style={styles.linkText}>Meet our Lead Consultant</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </BlurView>

        {/* 3. TRANSPARENT PRICING CARD */}
        <BlurView intensity={80} tint="light" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Transparent Pricing</Text>
          </View>
          <Text style={styles.cardBody}>
            No hidden costs. Get a comprehensive analysis for just ₹500 per report.
          </Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewPayment}>
            <Text style={styles.linkText}>How it works</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </BlurView>

        {/* 4. 3-STEP PROCESS */}
        <View style={styles.processSection}>
          <Text style={styles.processHeading}>Simple 3-Step Process</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Upload your medical reports securely.</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Pay a one-time analysis fee.</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { opacity: 0.8 }]}>Receive a detailed AI report in 10 mins.</Text>
          </View>
        </View>

        {/* 5. PRIMARY CALL TO ACTION */}
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={onStart}
          activeOpacity={0.8}
        >
          <Text style={styles.mainButtonText}>
            {activeCaseStatus ? "Track Active Case" : "Get Started Now"}
          </Text>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </TouchableOpacity>

      </ScrollView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 4, paddingBottom: 180 },
  trackerContainer: { marginBottom: 15, borderRadius: 20, overflow: 'hidden' },
  trackerBlur: { padding: 16 },
  trackerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackerLabel: { color: '#FFF', fontSize: 13 },
  trackerStatus: { fontWeight: 'bold', fontSize: 14 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  glassCard: { 
    padding: 20, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...SHADOWS.soft
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  cardBody: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 12 },
  cardLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  processSection: { marginVertical: 15, paddingHorizontal: 5 },
  processHeading: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 15 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  stepText: { color: '#FFF', fontSize: 15, flex: 1, fontWeight: '500' },
  mainButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 18,
    gap: 12,
    ...SHADOWS.soft,
    marginTop: 10,
    marginBottom: 20, 
  },
  mainButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});