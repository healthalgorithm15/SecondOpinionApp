import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Design System
import AuthLayout from '../../../components/AuthLayout';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { STRINGS } from '../../../constants/Strings';

// Logic
import { patientService } from '../../../services/patientService';

export default function CaseStatus() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);

  /**
   * 🔄 Fetch Current Case Status
   */
  const fetchStatus = async () => {

    console.log("case id in case status",caseId )
    try {
      if (caseId) {
        const idToFetch = Array.isArray(caseId) ? caseId[0] : caseId;
          console.log("case id in case status inside try",caseId )
        const res = await patientService.getCaseStatus(idToFetch);
        if (res.success) {
          setCaseData(res.data);
          
          // 🛑 Optimization: If status is COMPLETED, we can stop the loading spinner
          if (loading) setLoading(false);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching case status:", error);
    } finally {
      // Ensure initial loader disappears even on error
      setLoading(false);
    }
  };

  /**
   * ⏲️ Polling Logic
   * Checks every 7 seconds, but clears itself if the case is COMPLETED
   */
  useEffect(() => {
    // Initial fetch
    fetchStatus();

    const interval = setInterval(() => {
      // If we already have data and it's completed, stop polling
      if (caseData?.status === 'COMPLETED') {
        clearInterval(interval);
      } else {
        fetchStatus();
      }
    }, 7000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [caseId, caseData?.status]); // Re-run effect if status changes to handle interval clearing

  const displayId = typeof caseId === 'string' 
    ? caseId.slice(-8).toUpperCase() 
    : Array.isArray(caseId) ? caseId[0].slice(-8).toUpperCase() : 'N/A';

  // 🟢 LOGIC STATES
// 🟢 LOGIC STATES (Updated to use your backend uiSteps)
const isAiDone = caseData?.uiSteps?.aiCompleted || ['PENDING_DOCTOR', 'COMPLETED'].includes(caseData?.status);

const isDoctorDone = caseData?.uiSteps?.doctorStarted || caseData?.status === 'COMPLETED';

const isProcessComplete = caseData?.status === 'COMPLETED';

  if (loading && !caseData) {
    return (
      <AuthLayout>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Initializing status tracker...</Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <Text style={styles.appName}>{STRINGS.common.appName}</Text>
          <Text style={styles.title}>{STRINGS.status.title}</Text>
          <Text style={styles.subtitle}>{STRINGS.status.subtitle}</Text>
        </View>

        <View style={styles.glassCard}>
          <View style={styles.idBadge}>
            <Text style={styles.caseLabel}>
              Case ID: <Text style={styles.caseValue}>{displayId}</Text>
            </Text>
          </View>

          {/* 🟢 STEP 1: Uploaded */}
          <View style={styles.timelineItem}>
            <View style={styles.activeCircle}>
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            </View>
            <Text style={styles.stepText}>{STRINGS.status.stepUploaded}</Text>
          </View>
          
          <View style={[styles.connector, isAiDone && styles.activeConnector]} />

          {/* 🟡 STEP 2: AI Processing */}
          <View style={styles.timelineItem}>
            <View style={isAiDone ? styles.activeCircle : styles.inactiveCircle}>
              {isAiDone ? (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              ) : (
                <ActivityIndicator size="small" color={COLORS.primary} />
              )}
            </View>
            <Text style={[styles.stepText, !isAiDone && styles.dimText]}>
              {STRINGS.status.stepAi}
            </Text>
          </View>

          <View style={[styles.connector, isDoctorDone && styles.activeConnector]} />

          {/* 🔵 STEP 3: Specialist Review */}
          <View style={styles.timelineItem}>
            <View style={isDoctorDone ? styles.activeCircle : styles.inactiveCircle}>
              {isDoctorDone ? (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              ) : (
                <View style={styles.pulseDot} />
              )}
            </View>
            <Text style={[styles.stepText, !isDoctorDone && styles.dimText]}>
              {STRINGS.status.stepDoctor}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons 
              name={isDoctorDone ? "checkmark-circle" : "time-outline"} 
              size={18} 
              color={isDoctorDone ? "#10B981" : COLORS.secondary} 
            />
            <Text style={[styles.estimateText, isDoctorDone && { color: "#10B981" }]}>
                {isDoctorDone ? "Review Complete" : STRINGS.status.estimateTime}
            </Text>
          </View>

          <PrimaryButton 
            title={STRINGS.status.caseSummary} 
            disabled={!isProcessComplete} 
            onPress={() => {
              router.push({
                pathname: '/(tabs)/patient/case-summary',
                params: { caseId: Array.isArray(caseId) ? caseId[0] : caseId }
              } as any);
            }}
            style={{ 
              opacity: !isProcessComplete ? 0.6 : 1,
              backgroundColor: isProcessComplete ? COLORS.primary : COLORS.border
            }} 
          />
        </View>

        <TouchableOpacity style={styles.supportLink} onPress={() => {}}>
          <Text style={styles.supportText}>{STRINGS.status.needHelp}</Text>
        </TouchableOpacity>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSub, marginTop: 10 },
  scrollContent: { paddingBottom: 120 },
  headerSection: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  appName: { ...TYPOGRAPHY.brand, fontSize: 22, color: COLORS.primary, marginBottom: 10 },
  title: { ...TYPOGRAPHY.header, color: COLORS.textMain, marginBottom: 8 },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSub, textAlign: 'center', paddingHorizontal: 40 },
  glassCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginHorizontal: 15,
  },
  idBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  caseLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: COLORS.textSub },
  caseValue: { fontFamily: 'Inter-Bold', color: COLORS.primary },
  timelineItem: { flexDirection: 'row', alignItems: 'center' },
  activeCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.secondary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15,
    elevation: 3
  },
  inactiveCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  stepText: { fontFamily: 'Inter-Bold', fontSize: 15, color: COLORS.textMain, flex: 1 },
  dimText: { fontFamily: 'Inter-Medium', color: COLORS.textSub },
  connector: { width: 2, height: 35, backgroundColor: COLORS.border, marginLeft: 15, marginVertical: -2 },
  activeConnector: { backgroundColor: COLORS.secondary },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 15,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 35,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)'
  },
  estimateText: { fontFamily: 'Inter-Bold', color: COLORS.textMain, fontSize: 13 },
  supportLink: { marginTop: 30, alignItems: 'center' },
  supportText: { fontFamily: 'Inter-SemiBold', color: COLORS.primary, textDecorationLine: 'underline' }
});