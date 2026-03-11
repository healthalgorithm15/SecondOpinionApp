import React, { useEffect, useState, useCallback } from 'react';

import { Tabs, usePathname, useRouter } from 'expo-router'; 
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications'; 
import { BottomNav } from '@/components/ui/BottomNav';
import { storage } from '@/utils/storage';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { socketService } from '@/services/socketService';

// 🔔 Configure how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter(); 
  const [role, setRole] = useState<string | null>(null);
  const [isPatientHistoryVisible, setIsPatientHistoryVisible] = useState(false);
  const [isDoctorHistoryVisible, setIsDoctorHistoryVisible] = useState(false);

  // 🟢 Listen for the most recent notification response (taps)
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  /**
   * 🔄 Check function for BottomNav visibility logic
   */
  const checkHistoryStatus = useCallback(async (currentRole: string) => {
    try {
      if (currentRole === 'patient') {
        const res = await patientService.getReviewHistory();
        if (res.success && Array.isArray(res.data)) {
          const hasFinished = res.data.some((c: any) => 
            c.status?.trim().toUpperCase() === "COMPLETED"
          );
          setIsPatientHistoryVisible(hasFinished);
        }
      } else if (currentRole === 'doctor') {
        const res = await doctorService.getDoctorHistory(1, 1);
        if (res.success && Array.isArray(res.data)) {
          setIsDoctorHistoryVisible(res.data.length > 0);
        }
      }
    } catch (err) {
      console.warn(`${currentRole} history check failed`);
    }
  }, []);

  /**
   * 🚀 REDIRECTION LOGIC
   * Maps notification 'data' to the correct Expo Router path
   */
  const handleNotificationAction = useCallback((data: any) => {
    if (!data || !data.caseId) return;

    console.log("🚀 Deep Linking triggered. Screen:", data.screen, "Case:", data.caseId);

    if (data.screen === 'case-summary') {
      // Navigates to app/(tabs)/patient/case-summary.tsx
      router.push({
        pathname: '/(tabs)/patient/case-summary',
        params: { caseId: data.caseId }
      } as any);
    } else {
      // Navigates to app/(tabs)/doctor-review/[caseId].tsx
      // Using template literal for dynamic route segment [caseId]
      router.push(`/(tabs)/doctor-review/${data.caseId}` as any);
    }
  }, [router]);

  /**
   * 🔔 EFFECT: Push Notification Setup & Listeners
   */
  useEffect(() => {
    // 1. Android Channel Setup (Critical for High-Priority Sound)
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // 2. Listen for notification taps while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationAction(response.notification.request.content.data);
    });

    // 3. Handle Cold Start (Tapping notification when app was closed)
    if (lastNotificationResponse?.notification.request.content.data) {
      handleNotificationAction(lastNotificationResponse.notification.request.content.data);
    }

    return () => subscription.remove();
  }, [lastNotificationResponse, handleNotificationAction]);

  /**
   * ⚡ EFFECT: Initialization & Socket Listener
   */
  useEffect(() => {
    const initializeLayout = async () => {
      const savedRole = await storage.getItem('userRole');
      const currentRole = savedRole ? savedRole.toLowerCase() : 'patient';
      setRole(currentRole);
      
      await checkHistoryStatus(currentRole);

      // Refresh tabs instantly if a case is completed via socket
      socketService.on('caseCompleted', () => {
        checkHistoryStatus(currentRole);
      });
    };

    initializeLayout();
    return () => { socketService.off('caseCompleted'); };
  }, [checkHistoryStatus]);

  /**
   * 🎯 EFFECT: Refresh on internal navigation
   */
  useEffect(() => {
    if (role) {
      checkHistoryStatus(role);
    }
  }, [pathname, role, checkHistoryStatus]);

  // --- UI Layouts ---

  const patientTabs = [
    { name: 'Discover', icon: 'compass', path: '/(tabs)/patient/discover' },
    { name: 'Home', icon: 'home', path: '/(tabs)/patient/patienthome' },
    ...(isPatientHistoryVisible 
      ? [{ name: 'History', icon: 'chatbubble-ellipses', path: '/(tabs)/patient/history' }] 
      : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  const doctorTabs = [
    { name: 'Cases', icon: 'list', path: '/(tabs)/doctor/doctor-home' },
    ...(isDoctorHistoryVisible 
      ? [{ name: 'Reviews', icon: 'analytics', path: '/(tabs)/doctor/doctor-history' }] 
      : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  return (
    <Tabs
      tabBar={() => <BottomNav tabs={role === 'doctor' ? doctorTabs : patientTabs} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="patient/discover" />
      <Tabs.Screen name="patient/patienthome" />
      <Tabs.Screen name="patient/history" /> 
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="doctor/doctor-home" /> 
      <Tabs.Screen name="doctor/doctor-history" /> 
      
      {/* Dynamic and Hidden Routes */}
      <Tabs.Screen name="doctor-review/[caseId]" options={{ href: null }} />
      <Tabs.Screen name="patient/case-status" options={{ href: null }} />
      <Tabs.Screen name="patient/case-summary" options={{ href: null }} />
    </Tabs>
  );
}