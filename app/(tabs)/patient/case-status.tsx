import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity, RefreshControl, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Design System
import AuthLayout from '@/components/AuthLayout';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '@/constants/theme';
import { STRINGS } from '@/constants/Strings';

// Logic
import { patientService } from '@/services/patientService';

export default function CaseStatus() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams();
  
  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);

  /**
   * 🔄 Fetch Current Case Status
   * This is now a standalone function we can call on mount or on pull-to-refresh
   */
  const fetchStatus = async () => {
    try {
      const idToFetch = Array.isArray(caseId) ? caseId[0] : caseId;
      if (!idToFetch) return;

      const res = await patientService.getCaseStatus(idToFetch);
      
      if (res.success) {
        setCaseData(res.data);
      } else {
        // If the server says unauthorized (token expired/changed)
        if (res.status === 401) {
          Alert.alert("Session Expired", "Please log in again to view your case status.");
          router.replace('../auth/login');
        }
      }
    } catch (error) {
      console.error("❌ Error fetching case status:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * ☝️ Pull-to-Refresh Logic
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, [caseId]);

  /**
   * ⏲️ Effect Hook
   * Only runs ONCE when the page loads. No more continuous intervals.
   */
  useEffect(() => {
    fetchStatus();
  }, [caseId]);

  // Logic Helpers
  const displayId = typeof caseId === 'string' 
    ? caseId.slice(-8).toUpperCase() 
    : Array.isArray(caseId) ? caseId[0].slice(-8).toUpperCase() : 'N/A';

  const isAiDone = caseData?.uiSteps?.aiCompleted || ['PENDING_DOCTOR', 'COMPLETED'].includes(caseData?.status);
  const isDoctorDone = caseData?.uiSteps?.doctorStarted || caseData?.status === 'COMPLETED';
  const isProcessComplete = caseData?.status === 'COMPLETED';

  if (loading && !caseData) {
    return (
      <AuthLayout>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Loading case status...</Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.secondary}
            colors={[COLORS.secondary]} // Android
          />
        }
      >
        
        <View style={styles.headerSection}>
          <Text style={styles.appName}>{STRINGS.common.appName}</Text>
          <Text style={styles.title}>{STRINGS.status.title}</Text>
          <Text style={styles.subtitle}>Swipe down to refresh for updates from your specialist.</Text>
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
                {isDoctorDone ? "Review Complete" : "Specialist is reviewing your data"}
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
              marginTop: 10,
              opacity: !isProcessComplete ? 0.6 : 1,
              backgroundColor: isProcessComplete ? COLORS.primary : COLORS.border
            }} 
          />
        </View>

        <TouchableOpacity style={styles.supportLink} onPress={() => fetchStatus()}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
          <Text style={styles.supportText}>Tap to check manually</Text>
        </TouchableOpacity>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSub, marginTop: 10 },
  scrollContent: { paddingBottom: 120, paddingTop: 20 },
  headerSection: { alignItems: 'center', marginBottom: 25 },
  appName: { ...TYPOGRAPHY.brand, fontSize: 20, color: COLORS.primary, marginBottom: 5 },
  title: { ...TYPOGRAPHY.header, color: COLORS.textMain, marginBottom: 8 },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSub, textAlign: 'center', paddingHorizontal: 40, fontSize: 13 },
  glassCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.card,
    padding: 24,
    marginHorizontal: 15,
    ...SHADOWS.soft
  },
  idBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 25,
  },
  caseLabel: { fontSize: 12, color: COLORS.textSub },
  caseValue: { fontWeight: 'bold', color: COLORS.primary },
  timelineItem: { flexDirection: 'row', alignItems: 'center' },
  activeCircle: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: COLORS.secondary, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15,
  },
  inactiveCircle: { 
    width: 30, 
    height: 30, 
    borderRadius: 15, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
  stepText: { fontWeight: '700', fontSize: 14, color: COLORS.textMain, flex: 1 },
  dimText: { fontWeight: '500', color: COLORS.textSub },
  connector: { width: 2, height: 30, backgroundColor: COLORS.border, marginLeft: 14, marginVertical: -2 },
  activeConnector: { backgroundColor: COLORS.secondary },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 30,
    marginBottom: 20,
  },
  estimateText: { fontWeight: '600', color: COLORS.textMain, fontSize: 12 },
  supportLink: { marginTop: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  supportText: { fontWeight: '600', color: COLORS.primary, fontSize: 13 }
});