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
   * Register device for push notifications
   * 🟢 FIX: Updated endpoint and added error handling to prevent 404 crash
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
      
      // 🟢 PRODUCTION FIX: Match the new dedicated backend endpoint
      // We use /auth/ because that is likely your route prefix
      await API.patch('/auth/update-push-token', { pushToken: token });
      console.log("✅ Push Token Registered Successfully");
    } catch (error: any) {
      console.warn("Push Token Sync Error:", error.response?.data?.message || error.message);
    }
  };

  /**
   * Logic to show/hide specific tabs based on user history
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
      } else if (currentRole === 'doctor') {
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

  useEffect(() => {
    if (role) checkHistoryStatus(role);
  }, [pathname, role, checkHistoryStatus]);

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
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationAction]);

  useEffect(() => {
    const initializeLayout = async () => {
      const savedRole = await storage.getItem('userRole');
      const currentRole = savedRole ? savedRole.toLowerCase() : 'patient';
      setRole(currentRole);
      
      registerForPushNotificationsAsync();
      await checkHistoryStatus(currentRole);
      
      socketService.on('caseCompleted', () => checkHistoryStatus(currentRole));
    };

    initializeLayout();
    return () => { socketService.off('caseCompleted'); };
  }, [checkHistoryStatus]);

  if (!role) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#002D2D' }}>
        <ActivityIndicator color="#FFF" size="large" />
      </View>
    );
  }

  // 🟢 FIX: Define distinct paths to prevent double-tab highlight
  const patientTabs = [
    { name: 'Discover', icon: 'compass', path: '/(tabs)/patient/discover' },
    { name: 'Home', icon: 'home', path: '/(tabs)/patient/' as any },
    ...(isPatientHistoryVisible ? [{ name: 'Vault', icon: 'library', path: '/(tabs)/patient/history' }] : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  const doctorTabs = [
    { name: 'Cases', icon: 'list', path: '/(tabs)/doctor/doctor-home' },
    ...(isDoctorHistoryVisible ? [{ name: 'Reviews', icon: 'analytics', path: '/(tabs)/doctor/doctor-history' }] : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  return (
    <Tabs
      tabBar={() => <BottomNav tabs={role === 'doctor' ? doctorTabs : patientTabs} />}
      screenOptions={{ headerShown: false }}
    >
      {/* 🟢 FIX: Ensure names match the folder structure exactly. 
        Setting href: null for index prevents it from clashing with discover.
      */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="patient/index" options={{ title: 'Home' }} />
      <Tabs.Screen name="patient/discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="patient/history" options={{ title: 'Vault' }} /> 
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      
      {/* Doctor Screens */}
      <Tabs.Screen name="doctor/doctor-home" options={{ title: 'Cases' }} /> 
      <Tabs.Screen name="doctor/doctor-history" options={{ title: 'Reviews' }} /> 
      
      {/* Utility Screens - Href null hides them from the BottomNav logic */}
      <Tabs.Screen name="doctor-review/[caseId]" options={{ href: null }} />
      <Tabs.Screen name="patient/case-status" options={{ href: null }} />
      <Tabs.Screen name="patient/case-summary" options={{ href: null }} />
    </Tabs>
  );
}