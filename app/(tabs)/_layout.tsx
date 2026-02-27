import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, usePathname } from 'expo-router'; // 🟢 Added usePathname
import { BottomNav } from '../../components/ui/BottomNav';
import { storage } from '../../utils/storage';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import { socketService } from '@/services/socketService';

export default function TabLayout() {
  const pathname = usePathname(); // 🟢 This detects every screen change
  const [role, setRole] = useState<string | null>(null);
  const [isPatientHistoryVisible, setIsPatientHistoryVisible] = useState(false);
  const [isDoctorHistoryVisible, setIsDoctorHistoryVisible] = useState(false);

  /**
   * 🔄 Unified check function
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
   * ⚡ EFFECT 1: Initialization & Socket Listener
   */
  useEffect(() => {
    const initializeLayout = async () => {
      const savedRole = await storage.getItem('userRole');
      const currentRole = savedRole ? savedRole.toLowerCase() : 'patient';
      setRole(currentRole);
      
      await checkHistoryStatus(currentRole);

      // Listen for socket events
      socketService.on('caseCompleted', () => {
        console.log("⚡ Case Completed Socket Event");
        checkHistoryStatus(currentRole);
      });
    };

    initializeLayout();
    return () => { socketService.off('caseCompleted'); };
  }, [checkHistoryStatus]);

  /**
   * 🎯 EFFECT 2: Refresh on Navigation
   * This forces the Bottom Nav to re-calculate visibility every time 
   * the user moves between screens (like coming back from a review).
   */
  useEffect(() => {
    if (role) {
      checkHistoryStatus(role);
    }
  }, [pathname, role, checkHistoryStatus]);

  const patientTabs = [
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
      <Tabs.Screen name="patient/patienthome" />
      <Tabs.Screen name="patient/history" /> 
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="doctor/doctor-home" /> 
      <Tabs.Screen name="doctor/doctor-history" /> 
      <Tabs.Screen name="doctor-review/[caseId]" options={{ href: null }} />
      <Tabs.Screen name="patient/case-summary" options={{ href: null }} />
    </Tabs>
  );
}