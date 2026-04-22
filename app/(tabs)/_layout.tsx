import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router'; 
import { Platform, ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications'; 
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Internal Imports
import { BottomNav } from '../../components/ui/BottomNav';
import { storage } from '../../utils/storage';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import { socketService } from '../../services/socketService';
import { COLORS } from '../../constants/theme';
import API from '../../utils/api';

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [role, setRole] = useState<string | null>(null);
  const [isPatientHistoryVisible, setIsPatientHistoryVisible] = useState(false);
  const [isDoctorHistoryVisible, setIsDoctorHistoryVisible] = useState(false);
  
  const isChecking = useRef(false);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  /**
   * 🛡️ Push Notification Registration
   */
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') return;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      // Sync with dedicated backend endpoint
      await API.patch('/auth/update-push-token', { pushToken: token });
      console.log("✅ Push Token Registered");
    } catch (error: any) {
      console.warn("Push Token Sync Error:", error.response?.data?.message || error.message);
    }
  };

  /**
   * 🔄 History Check (Role-Aware)
   */
  const checkHistoryStatus = useCallback(async (currentRole: string) => {
    if (isChecking.current) return;
    isChecking.current = true;
    try {
      if (currentRole === 'patient') {
        const res = await patientService.getReviewHistory();
        if (res.success && Array.isArray(res.data)) {
          const hasFinished = res.data.some((c: any) => c.status?.toUpperCase() === "COMPLETED");
          setIsPatientHistoryVisible(hasFinished);
        }
      } 
      // 🟢 CMO and Doctor both check for completed review history
      else if (currentRole === 'doctor' || currentRole === 'cmo') {
        const res = await doctorService.getDoctorHistory(1, 1);
        if (res.success && Array.isArray(res.data)) {
          setIsDoctorHistoryVisible(res.data.length > 0);
        }
      }
    } catch (err) {
      console.warn("History check silent fail");
    } finally {
      isChecking.current = false;
    }
  }, []);

  /**
   * 🔔 Notification Routing Engine
   */
  const handleNotificationAction = useCallback((data: any) => {
    const payload = data as any;
    if (!payload?.caseId) return;
    
    if (payload.type === 'REPORT_READY' || payload.screen === 'case-summary') {
      router.push({ 
        pathname: '/(tabs)/patient/case-summary' as any, 
        params: { caseId: payload.caseId } 
      });
    } else if (payload.type === 'NEW_CASE' || payload.screen === 'doctor-review') {
      router.push(`/(tabs)/doctor-review/${payload.caseId}` as any);
    }
  }, [router]);

  // Sync history visibility on tab changes
  useEffect(() => {
    if (role) checkHistoryStatus(role);
  }, [pathname, role, checkHistoryStatus]);

  // Setup Notification Listeners
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationAction(response.notification.request.content.data);
    });

    return () => {
      if (responseListener.current) responseListener.current.remove();
    };
  }, [handleNotificationAction]);

  /**
   * 🏗️ Initialize Layout & Roles
   */
  useEffect(() => {
    const initializeLayout = async () => {
      const savedRole = await storage.getItem('userRole');
      const currentRole = savedRole ? savedRole.toLowerCase() : 'patient';
      setRole(currentRole);
      
      registerForPushNotificationsAsync();
      await checkHistoryStatus(currentRole);
      
      // Socket sync for real-time tab updates
      socketService.on('caseCompleted', () => checkHistoryStatus(currentRole));
    };

    initializeLayout();
    return () => { socketService.off('caseCompleted'); };
  }, [checkHistoryStatus]);

  // 🟢 Loading State (MedTech Aesthetic)
  if (!role) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // --- TAB DEFINITIONS ---

  const patientTabs = [
    { name: 'Discover', icon: 'compass', path: '/(tabs)/patient/discover' },
    { name: 'Home', icon: 'home', path: '/(tabs)/patient/' as any },
    ...(isPatientHistoryVisible ? [{ name: 'Vault', icon: 'library', path: '/(tabs)/patient/history' }] : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  // 🟢 Medical Tabs (Handles CMO and Doctor)
  const medicalTabs = [
    { 
      name: role === 'cmo' ? 'Assignments' : 'Worklist', 
      icon: 'list', 
      path: '/(tabs)/doctor/doctor-home' 
    },
    ...(isDoctorHistoryVisible ? [{ name: 'Archive', icon: 'analytics', path: '/(tabs)/doctor/doctor-history' }] : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  return (
    <Tabs
      tabBar={() => (
        <BottomNav 
          tabs={(role === 'doctor' || role === 'cmo') ? medicalTabs : patientTabs} 
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      {/* Root redirection prevention */}
      <Tabs.Screen name="index" options={{ href: null }} />
      
      {/* Patient Folder Screens */}
      <Tabs.Screen name="patient/index" options={{ title: 'Home' }} />
      <Tabs.Screen name="patient/discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="patient/history" options={{ title: 'Vault' }} /> 
      
      {/* 🟢 Medical Folder Screens (Doctor & CMO) */}
      <Tabs.Screen name="doctor/doctor-home" options={{ title: 'Worklist' }} /> 
      <Tabs.Screen name="doctor/doctor-history" options={{ title: 'Archive' }} /> 
      
      {/* Common Settings */}
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      
      {/* Utility/Stack Routes (Hidden from Tab Bar) */}
      <Tabs.Screen name="doctor-review/[caseId]" options={{ href: null }} />
      <Tabs.Screen name="patient/case-status" options={{ href: null }} />
      <Tabs.Screen name="patient/case-summary" options={{ href: null }} />
    </Tabs>
  );
}