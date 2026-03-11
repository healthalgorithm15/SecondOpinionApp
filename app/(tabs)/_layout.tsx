import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router'; 
import { Platform, ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications'; 
import { BottomNav } from '@/components/ui/BottomNav';
import { storage } from '@/utils/storage';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { socketService } from '@/services/socketService';
import { COLORS } from '@/constants/theme';

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

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

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

  const handleNotificationAction = useCallback((data: any) => {
    if (!data || !data.caseId) return;
    if (data.screen === 'case-summary') {
      router.push({ pathname: '/(tabs)/patient/case-summary', params: { caseId: data.caseId } } as any);
    } else {
      router.push(`/(tabs)/doctor-review/${data.caseId}` as any);
    }
  }, [router]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationAction(response.notification.request.content.data);
    });
    return () => subscription.remove();
  }, [handleNotificationAction]);

  useEffect(() => {
    const initializeLayout = async () => {
      const savedRole = await storage.getItem('userRole');
      const currentRole = savedRole ? savedRole.toLowerCase() : 'patient';
      setRole(currentRole);
      await checkHistoryStatus(currentRole);
      socketService.on('caseCompleted', () => checkHistoryStatus(currentRole));
    };
    initializeLayout();
    return () => { socketService.off('caseCompleted'); };
  }, [checkHistoryStatus]);

  if (!role) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#002D2D' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  const patientTabs = [
    { name: 'Discover', icon: 'compass', path: '/(tabs)/patient/discover' },
    { name: 'Home', icon: 'home', path: '/(tabs)/patient/patienthome' },
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
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen 
        name="patient/patienthome" 
        listeners={{
          tabPress: () => router.setParams({ tab: 'home' }),
        }}
      />
      <Tabs.Screen name="patient/discover" />
      <Tabs.Screen name="patient/history" /> 
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="doctor/doctor-home" /> 
      <Tabs.Screen name="doctor/doctor-history" /> 
      <Tabs.Screen name="doctor-review/[caseId]" options={{ href: null }} />
      <Tabs.Screen name="patient/case-status" options={{ href: null }} />
      <Tabs.Screen name="patient/case-summary" options={{ href: null }} />
    </Tabs>
  );
}