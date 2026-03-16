import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import AuthLayout from '../../../components/AuthLayout';
import UploadView from '../../../components/patient/UploadView';
import ActiveTrackerView from '../../../components/patient/ActiveTrackerView';

import { patientService } from '../../../services/patientService';
import { COLORS } from '../../../constants/theme';

export default function PatientHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  /**
   * 🟢 Fetch current status from backend
   * isSilent: if true, doesn't show the full-screen loader (good for background refreshes)
   */
  const fetchState = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await patientService.getDashboard();
      setData(response);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchState(true);
    }, [fetchState])
  );

  // 🟢 LOGIC: Has the user paid for a credit?
  const hasPaid = !!data?.activeCase || !!data?.hasActivePayment;
  
  // 🟢 LOGIC: Is there a case currently being processed?
  const isCaseActive = data?.activeCase && data?.activeCase?.status !== 'COMPLETED';

  /**
   * Final step: Convert uploaded drafts into a real Case for the Doctors/AI
   */
  const handleFinalSubmission = async () => {
    if (!data?.draftReports || data.draftReports.length === 0) {
      Alert.alert("No Documents", "Please upload medical records first.");
      return;
    }

    try {
      setLoading(true);
      const reportIds = data.draftReports.map((r: any) => r._id);
      
      // Transitions drafts -> active case
      await patientService.submitForReview(reportIds); 
      
      // Refresh to switch view from UploadView to ActiveTrackerView
      await fetchState(false); 
      Alert.alert("Success", "Your analysis has started. You will be notified once ready.");
    } catch (error: any) {
      Alert.alert("Submission Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthLayout title="Praman AI" subtitle="Clinical Clarity" scrollEnabled={false}>
      <View style={styles.content}>
        {isCaseActive ? (
          // 🟢 VIEW 1: Status tracking for paid & submitted cases
          <ActiveTrackerView 
            caseData={data.activeCase} 
            onRefresh={() => fetchState(true)} 
          />
        ) : (
          // 🟢 VIEW 2: Upload UI for new users or people with unused credits
          <UploadView 
            name={data?.user?.name}
            drafts={data?.draftReports || []} 
            onUpdate={() => fetchState(true)}
            onFinalSubmit={handleFinalSubmission}
            canUpload={hasPaid}
            onRestrictedAccess={() => {
              Alert.alert(
                "Payment Required",
                "You need an active analysis credit to upload documents.",
                [
                  { text: "Later", style: "cancel" },
                  { text: "Get Credit", onPress: () => router.push('/(tabs)/discover' as any) }
                ]
              );
            }}
          />
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgScreen },
  content: { flex: 1 }
});