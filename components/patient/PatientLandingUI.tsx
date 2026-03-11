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

export const PatientLandingUI = ({ name, onStart, onViewDoctor, onViewPayment, activeCaseStatus }: LandingProps) => {
  return (
    <AuthLayout 
      title={`Hello, ${name}`}
      subtitle="Your health reports, decoded by experts."
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        
        {/* CASE TRACKER - Only shows if activeCaseStatus is passed */}
        {activeCaseStatus && (
          <TouchableOpacity style={styles.trackerContainer} onPress={onStart}>
            <BlurView intensity={90} tint="dark" style={styles.trackerBlur}>
              <View style={styles.trackerContent}>
                <View style={styles.trackerLeft}>
                  <View style={[styles.pulseDot, { backgroundColor: '#FACC15' }]} />
                  <Text style={styles.trackerLabel}>Case Status:</Text>
                  <Text style={[styles.trackerStatus, { color: '#FACC15' }]}>{activeCaseStatus}</Text>
                </View>
                <Ionicons name="chevron-forward-circle" size={20} color="#FFF" />
              </View>
            </BlurView>
          </TouchableOpacity>
        )}

        {/* CLINICAL PRECISION CARD */}
        <BlurView intensity={80} tint="light" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Clinical Precision</Text>
          </View>
          <Text style={styles.cardBody}>AI analysis verified by senior consultants to ensure 100% accuracy.</Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewDoctor}>
            <Text style={styles.linkText}>Meet our Lead Consultant</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </BlurView>

        {/* TRANSPARENT PRICING CARD */}
        <BlurView intensity={80} tint="light" style={styles.glassCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Transparent Pricing</Text>
          </View>
          <Text style={styles.cardBody}>No hidden costs. Get a comprehensive analysis for just ₹500 per report.</Text>
          <TouchableOpacity style={styles.cardLink} onPress={onViewPayment}>
            <Text style={styles.linkText}>How it works</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </BlurView>

        {/* 3-STEP PROCESS */}
        <View style={styles.processSection}>
          <Text style={styles.processHeading}>Simple 3-Step Process</Text>
          <StepRow num="1" text="Upload your medical reports securely." active />
          <StepRow num="2" text="Pay a one-time analysis fee." active />
          <StepRow num="3" text="Receive a detailed AI report in 10 mins." active={false} />
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={onStart}>
          <Text style={styles.mainButtonText}>{activeCaseStatus ? "View Active Case" : "Get Started Now"}</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </AuthLayout>
  );
};

const StepRow = ({ num, text, active }: { num: string, text: string, active: boolean }) => (
  <View style={[styles.stepRow, !active && { opacity: 0.5 }]}>
    <View style={[styles.stepNumber, !active && { backgroundColor: '#CBD5E1' }]}><Text style={styles.stepNumberText}>{num}</Text></View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  trackerContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 15, marginTop: 10 },
  trackerBlur: { padding: 12 },
  trackerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackerLabel: { color: '#FFF', fontSize: 12 },
  trackerStatus: { fontWeight: 'bold', fontSize: 13 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  glassCard: { padding: 20, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.9)', marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  cardBody: { fontSize: 14, color: '#4A5568', lineHeight: 20, marginBottom: 12 },
  cardLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  processSection: { marginVertical: 10 },
  processHeading: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 15 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#FFF', fontWeight: 'bold' },
  stepText: { color: '#FFF', fontSize: 14, flex: 1 },
  mainButton: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10, ...SHADOWS.button },
  mainButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});