import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, AppState, AppStateStatus, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import AuthLayout from '../../../components/AuthLayout';
import UploadView from '../../../components/patient/UploadView';
import ActiveTrackerView from '../../../components/patient/ActiveTrackerView';

import { patientService } from '../../../services/patientService';
import { COLORS } from '../../../constants/theme';

// 🔔 Notification Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

export default function PatientHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  /**
   * 🟢 Fetch current status from backend
   * Fixed: Now unwraps the Axios response correctly.
   */
  const fetchState = useCallback(async (isSilent = false) => {
    console.log("🟢 [DEBUG] FETCH STARTING...");
    if (!isSilent) setLoading(true);
    
    try {
      const response = await patientService.getDashboard();
      
      // 🛡️ UNWRAP AXIOS RESPONSE: 
      // This handles cases where data is in response.data or response.data.data
      const raw = response?.data?.success ? response.data.data : (response?.data || response);
      
      // Normalize reports to ensure they have an _id for the UI
      const rawList = raw?.draftReports || raw?.drafts || raw?.reports || [];
      const normalizedReports = rawList.map((item: any) => ({
        ...item,
        _id: item._id || item.id, 
        title: item.title || item.filename || item.name || "Medical Record",
        contentType: item.contentType || item.mimetype || 'application/pdf',
      }));

      const finalData = {
        ...raw,
        draftReports: normalizedReports,
      };

      console.log("✅ [DEBUG] DATA SYNCED. Reports:", normalizedReports.length);
      setData(finalData);
      return finalData;
    } catch (error: any) {
      console.error("🔴 [DEBUG] Dashboard Sync Error:", error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🛡️ THE PERMISSION LOGIC
   * Recalculates whenever 'data' changes.
   */
  const hasPaid = !!(
    data?.hasActivePayment || 
    data?.user?.hasActivePayment || 
    data?.activeCase || 
    (data?.draftReports && data.draftReports.length > 0)
  );

  console.log("📊 [DEBUG] hasPaid status:", hasPaid);

  const isCaseActive = data?.activeCase && data?.activeCase?.status !== 'COMPLETED';

  // --- NOTIFICATION & APP STATE LISTENERS ---
  useEffect(() => {
    async function registerNotifications() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
      }
    }
    registerNotifications();

    const sub = Notifications.addNotificationReceivedListener(() => fetchState(true));
    return () => sub.remove();
  }, [fetchState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') fetchState(true);
      appState.current = next;
    });
    return () => subscription.remove();
  }, [fetchState]);

  useFocusEffect(useCallback(() => { fetchState(true); }, [fetchState]));

  // --- ACTION HANDLERS ---
  const handleFinalSubmission = async () => {
    if (!data?.draftReports?.length) {
      Alert.alert("No Documents", "Please upload medical records first.");
      return;
    }
    try {
      setLoading(true);
      const reportIds = data.draftReports.map((r: any) => r._id);
      await patientService.submitForReview(reportIds);
      await fetchState(false);
      Alert.alert("Success", "Your reports are now being reviewed.");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to start review.");
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
          <ActiveTrackerView caseData={data.activeCase} onRefresh={() => fetchState(true)} />
        ) : (
          <UploadView 
            name={data?.user?.name || 'User'}
            drafts={data?.draftReports || []} 
            onUpdate={fetchState} 
            onFinalSubmit={handleFinalSubmission}
            canUpload={hasPaid} 
            onRestrictedAccess={() => router.push('/(tabs)/discover' as any)}
          />
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgScreen || '#111827' },
  content: { flex: 1 }
});