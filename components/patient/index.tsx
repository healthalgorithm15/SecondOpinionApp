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

// 🟢 FIXED: Updated to resolve TS(2322) deprecation warning
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function PatientHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const router = useRouter();
  const appState = useRef(AppState.currentState);

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

  // 🟢 PUSH NOTIFICATIONS
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
      // 🟢 FIXED: Type cast for payload
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

  const hasPaid = !!data?.activeCase || !!data?.hasActivePayment;
  const isCaseActive = data?.activeCase && data?.activeCase?.status !== 'COMPLETED';

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
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to start review.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>
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
            name={data?.user?.name}
            drafts={data?.draftReports || []} 
            onUpdate={() => fetchState(true)}
            onFinalSubmit={handleFinalSubmission}
            canUpload={hasPaid}
            onRestrictedAccess={() => {
              Alert.alert(
                "Payment Required",
                "You need an active credit to start an analysis.",
                [{ text: "Later", style: "cancel" }, { text: "Get Credit", onPress: () => router.push('/(tabs)/discover' as any) }]
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