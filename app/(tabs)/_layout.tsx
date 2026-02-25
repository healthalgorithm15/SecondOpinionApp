import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { BottomNav } from '../../components/ui/BottomNav';
import { storage } from '../../utils/storage';

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getRole = async () => {
      const savedRole = await storage.getItem('userRole');
      setRole(savedRole ? savedRole.toLowerCase() : 'patient');
    };
    getRole();
  }, []);

  const patientTabs = [
    { name: 'Home', icon: 'home', path: '' },
    { name: 'History', icon: 'chatbubble-ellipses', path: '/(tabs)/patienthome' },
    //{ name: 'Doctors', icon: 'people', path: '/(tabs)/doctors' },
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' }, // 🟢 Added Settings
  ];

  const doctorTabs = [
    { name: 'Cases', icon: 'list', path: '/(tabs)/doctorhome' },
    { name: 'Reviews', icon: 'analytics', path: '/(tabs)/doctorhistory' },
    { name: 'Settings', icon: 'settings', path: '/(tabs)/settings' },
  ];

  return (
    <Tabs
      tabBar={() => <BottomNav tabs={role === 'doctor' ? doctorTabs : patientTabs} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="patienthome" />
      <Tabs.Screen name="doctors" />
      <Tabs.Screen name="settings" />
      {/* 🟢 Add Doctor-specific screens here too */}
      <Tabs.Screen name="doctor-home" /> 
      <Tabs.Screen 
        name="doctor-review/[caseId]" 
        options={{ href: null }} // This ensures it doesn't show up in the bottom bar icons
      />
    </Tabs>
  );
}