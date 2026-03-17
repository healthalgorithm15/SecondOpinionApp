import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, AppState, AppStateStatus, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import AuthLayout from '../AuthLayout';
import UploadView from '../../components/patient/UploadView';
import ActiveTrackerView from '../../components/patient/ActiveTrackerView';

import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

/**
 * 🟢 FIXED: Notification Handler
 * Explicitly includes both modern and legacy properties to satisfy the 
 * NotificationBehavior type definition and resolve the TS(2322) error.
 */
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
   * 🟢 CORE SYNC LOGIC
   * Normalizes the response to ensure draftReports and payment status are captured.
   */
  const fetchState = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await patientService.getDashboard();
      
      // Standardizes response regardless of Axios/Fetch wrapper
      const result = response?.data?.data || response?.data || response;
      setData(result);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🟢 PUSH NOTIFICATION SETUP
  useEffect(() => {
    const registerForPush = async () => {
      if (!Device.isDevice) return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: COLORS.primary,
        });
      }
    };

    registerForPush();

    const notificationListener = Notifications.addNotificationReceivedListener(() => fetchState(true));
    
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const payload = response.notification.request.content.data as { caseId?: string };
      if (payload.caseId) {
        router.push({ 
          pathname: '/(tabs)/patient/case-summary' as any, 
          params: { caseId: payload.caseId } 
        });
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [fetchState]);

  // 🟢 APP STATE LISTENER
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchState(true);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [fetchState]);

  useFocusEffect(useCallback(() => { fetchState(true); }, [fetchState]));

  /**
   * 🟢 DERIVED LOGIC
   */
  const hasPaid = !!data?.activeCase || !!data?.hasActivePayment;
  const isCaseActive = data?.activeCase && data?.activeCase?.status !== 'COMPLETED';

  const handleFinalSubmission = async () => {
    // Matches schema check for isSubmitted: false
    if (!data?.draftReports || data.draftReports.length === 0) {
      Alert.alert("No Documents", "Please upload medical records first.");
      return;
    }

    try {
      setLoading(true);
      const reportIds = data.draftReports.map((r: any) => r._id);
      
      const response = await patientService.submitForReview(reportIds);
      
      if (response) {
        await fetchState(false);
        Alert.alert("Submitted", "Your reports are now being reviewed.");
      }
    } catch (error: any) {
      console.error("Submission Error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to start review.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🟢 NAVIGATION HANDLER
   * Points to the Discover tab where the Payment process is defined.
   */
  const handleNavigateToPayment = () => {
    router.push('/(tabs)/discover' as any);
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
          <ActiveTrackerView 
            caseData={data.activeCase} 
            onRefresh={() => fetchState(true)} 
          />
        ) : (
          <UploadView 
            name={data?.user?.name || 'User'}
            drafts={data?.draftReports || []} 
            onUpdate={() => fetchState(true)}
            onFinalSubmit={handleFinalSubmission}
            canUpload={hasPaid}
            onRestrictedAccess={() => {
              Alert.alert(
                "Payment Required",
                "You need an active credit to start an analysis.",
                [
                  { text: "Later", style: "cancel" }, 
                  { text: "Get Credit", onPress: handleNavigateToPayment }
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
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#111827' 
  },
  content: { flex: 1 }
});