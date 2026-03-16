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

// Logic
import { patientService } from '@/services/patientService';

export default function CaseStatus() {
  const router = useRouter();
  const { caseId, mode } = useLocalSearchParams(); // Added mode here
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caseData, setCaseData] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const idToFetch = Array.isArray(caseId) ? caseId[0] : caseId;
      if (!idToFetch) return;

      const res = await patientService.getCaseStatus(idToFetch);
      
      if (res.success) {
        setCaseData(res.data);
        
        // --- 🚀 NAVIGATION FIX ---
        // If the mode is 'results' or the status is already COMPLETED,
        // we jump straight to the summary instead of showing the "Waiting" screen.
        const currentStatus = res.data?.status?.toUpperCase() || '';
        if (mode === 'results' || currentStatus === 'COMPLETED' || currentStatus === 'REVIEWED') {
          router.replace({
            pathname: '/(tabs)/patient/case-summary',
            params: { caseId: idToFetch }
          } as any);
        }
      } else if (res.status === 401) {
        router.replace('../auth/login');
      }
    } catch (error) {
      console.error("❌ Error fetching status:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [caseId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, [caseId]);

  const currentStatus = caseData?.status?.toUpperCase() || '';
  const isProcessComplete = ['COMPLETED', 'REVIEWED'].includes(currentStatus);
  
  const displayId = typeof caseId === 'string' 
    ? caseId.slice(-8).toUpperCase() 
    : 'N/A';

  if (loading && !caseData) {
    return (
      <AuthLayout>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
      >
        <View style={styles.headerSection}>
          <Ionicons name="cloud-done-outline" size={60} color={COLORS.secondary} />
          <Text style={styles.title}>Documents Submitted</Text>
          <Text style={styles.caseIdText}>Case ID: {displayId}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.bullet} />
            <Text style={styles.infoText}>
              Our AI is currently organizing your medical data for the specialist.
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.bullet} />
            <Text style={styles.infoText}>
              A medical specialist will review the findings and finalize your report.
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.bullet} />
            <Text style={styles.infoText}>
              <Text style={{ fontWeight: 'bold' }}>You will receive a notification</Text> once your case review is ready.
            </Text>
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              You may close the app now. We'll alert you the moment your results are available.
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <PrimaryButton 
            title={isProcessComplete ? "View Case Summary" : "Waiting for Specialist..."} 
            disabled={!isProcessComplete} 
            onPress={() => {
              router.push({
                pathname: '/(tabs)/patient/case-summary',
                params: { caseId: Array.isArray(caseId) ? caseId[0] : caseId }
              } as any);
            }}
            style={{ 
              opacity: !isProcessComplete ? 0.5 : 1,
              backgroundColor: isProcessComplete ? COLORS.primary : COLORS.border
            }} 
          />
          
          <TouchableOpacity style={styles.homeLink} onPress={() => router.replace('/(tabs)/patient' as any)}>
            <Text style={styles.homeLinkText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  headerSection: { alignItems: 'center', marginVertical: 30 },
  title: { ...TYPOGRAPHY.header, fontSize: 24, marginTop: 15, color: COLORS.textMain },
  caseIdText: { ...TYPOGRAPHY.body, color: COLORS.textSub, marginTop: 5 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.card,
    padding: 24,
    ...SHADOWS.soft,
    marginBottom: 30
  },
  infoTitle: { ...TYPOGRAPHY.header, fontSize: 18, marginBottom: 20, color: COLORS.primary },
  infoRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary, marginTop: 6, marginRight: 12 },
  infoText: { ...TYPOGRAPHY.body, flex: 1, color: COLORS.textMain, lineHeight: 20 },
  noticeBox: {
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary
  },
  noticeText: { ...TYPOGRAPHY.body, fontSize: 13, color: '#0369A1', fontStyle: 'italic' },
  actionContainer: { gap: 15 },
  homeLink: { alignSelf: 'center', marginTop: 10 },
  homeLinkText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 }
});