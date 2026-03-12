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

  // Map backend status strings to UI labels and colors
  const getStatusDisplay = () => {
    switch (activeCaseStatus) {
      case 'AI_PROCESSING':
        return { label: 'AI ANALYSIS IN PROGRESS', color: '#60A5FA' }; // Blue
      case 'PENDING_DOCTOR':
        return { label: 'SPECIALIST REVIEW PENDING', color: '#FACC15' }; // Yellow
      case 'COMPLETED':
        return { label: 'MEDICAL REPORT READY', color: '#4ADE80' }; // Green
      default:
        return { label: 'SYNCHRONIZING...', color: '#94A3B8' };
    }
  };
  
  const { label, color } = getStatusDisplay();

  return (
    <AuthLayout title="Praman AI" subtitle={`Hello, ${name}`}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
       
        {/* ACTIVE CASE TRACKER STRIP - Only shows if status exists */}
        {activeCaseStatus && (
          <TouchableOpacity 
            style={styles.trackerContainer} 
            onPress={onStart}
            activeOpacity={0.9}
          >
            <View style={[styles.trackerBorder, { backgroundColor: color + '30' }]}>
              <View style={styles.trackerContent}>
                <View style={styles.trackerLeft}>
                  <View style={[styles.pulseDot, { backgroundColor: color }]} />
                  <View>
                    <Text style={styles.trackerLabel}>ACTIVE CASE STATUS</Text>
                    <Text style={[styles.trackerStatus, { color: color }]}>
                      {label}
                    </Text>
                  </View>
                </View>
                <View style={styles.trackerRight}>
                  <Text style={styles.trackText}>View</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* CLINICAL PRECISION CARD */}
        <View style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Clinical Precision</Text>
          </View>
          <Text style={styles.cardBody}>
            AI analysis verified by senior consultants to ensure 100% accuracy.
          </Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewDoctor}>
            <Text style={styles.linkText}>Meet our Lead Consultant</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* PRICING CARD */}
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

        {/* PROCESS SECTION */}
        <View style={styles.processSection}>
          <Text style={styles.processHeading}>Simple 3-Step Process</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Upload medical reports securely.</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Pay a one-time analysis fee.</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={[styles.stepNumber, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { opacity: 0.7 }]}>Receive verified AI report in 10 mins.</Text>
          </View>
        </View>

        {/* MAIN CTA */}
        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={onStart}
          activeOpacity={0.9}
        >
          <Text style={styles.mainButtonText}>
            {activeCaseStatus ? "Track Active Case" : "Start New Analysis"}
          </Text>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </TouchableOpacity>

      </ScrollView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  trackerContainer: { marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  trackerBorder: { padding: 2, borderRadius: 16 },
  trackerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#1A2130', 
    padding: 16, 
    borderRadius: 14 
  },
  trackerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackerLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  trackerStatus: { fontWeight: 'bold', fontSize: 14 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  trackerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
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
  stepText: { color: '#FFF', fontSize: 16, flex: 1, fontWeight: '500' },
  mainButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
    ...SHADOWS.soft
  },
  mainButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
});