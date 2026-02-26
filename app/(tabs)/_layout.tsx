import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { BottomNav } from '../../components/ui/BottomNav';
import { storage } from '../../utils/storage';
import { patientService } from '../../services/patientService';

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const [isCaseCompleted, setIsCaseCompleted] = useState(false);

  useEffect(() => {
    const initializeLayout = async () => {
      try {
        // 1. Get User Role
        const savedRole = await storage.getItem('userRole');
        const currentRole = savedRole ? savedRole.toLowerCase() : 'patient';
        setRole(currentRole);
  
        // 2. Logic for History Visibility
        if (currentRole === 'patient') {
  // 1. Fetch all cases from the ReviewCase collection
  const res = await patientService.getReviewHistory(); 
   console.log("curent roledsfdfdfdfds", res);
  if (res.success && Array.isArray(res.data)) {
    // 2. Check if any case is "COMPLETED"
    const hasFinished = res.data.some((c: any) => 
      c.status?.trim().toUpperCase() === "COMPLETED"
    );
    
    console.log("hasFinished result:", hasFinished);
    setIsCaseCompleted(hasFinished);
  }


   
  }
        
      } catch (error) {
        console.warn("Layout sync failed, defaulting to basic tabs.");
      }
    };
    initializeLayout();
  }, []);

  const patientTabs = [
    { name: 'Home', icon: 'home', path: '/(tabs)/patient/patienthome' },
    ...(isCaseCompleted 
      ? [{ name: 'History', icon: 'chatbubble-ellipses', path: '/(tabs)/patient/history' }] 
      : []),
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  const doctorTabs = [
    { name: 'Cases', icon: 'list', path: '/(tabs)/doctor/doctor-home' },
  { name: 'Reviews', icon: 'analytics', path: '/(tabs)/doctor/doctor-history' },
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
      {/* Kept your existing dynamic route logic */}
      <Tabs.Screen name="doctor-review/[caseId]" options={{ href: null }} />
      <Tabs.Screen name="patient/case-summary" options={{ href: null }} />
    </Tabs>
  );
}