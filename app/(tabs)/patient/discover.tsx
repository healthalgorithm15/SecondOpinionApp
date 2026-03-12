import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native'; // 🟢 Added for auto-refresh
import { PatientLandingUI } from '@/components/patient/PatientLandingUI';
import { DoctorProfileDetail } from '@/components/patient/DoctorProfileDetail';
import { PaymentLearnMore } from '@/components/patient/PaymentLearnMore';
import { storage } from '@/utils/storage';
import { patientService } from '@/services/patientService'; // 🟢 Added

type ViewState = 'landing' | 'doctor' | 'payment';

export default function DiscoverScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [activeStatus, setActiveStatus] = useState<string | null>(null); // 🟢 State for tracker
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // 1. Fetch User Profile Name once
  useEffect(() => {
    startTransition();
    const fetchUserName = async () => {
      const savedName = await storage.getItem('userName');
      if (savedName) setUserName(savedName);
    };
    fetchUserName();
  }, []);

  // 2. 🟢 AUTO-UPDATE LOGIC: Runs every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchStatus = async () => {
        try {
          const res = await patientService.getDashboard();
          if (res.success && res.activeCase) {
            // Map backend status to user-friendly UI labels
            const statusMap: Record<string, string> = {
              'AI_PROCESSING': 'AI Analyzing...',
              'PENDING_DOCTOR': 'Specialist Reviewing',
              'COMPLETED': 'Report Ready'
            };
            setActiveStatus(statusMap[res.activeCase.status] || res.activeCase.status);
          } else {
            setActiveStatus(null);
          }
        } catch (err) {
          console.error("Dashboard refresh failed:", err);
        }
      };

      fetchStatus();
    }, [])
  );

  const startTransition = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    startTransition();
  };

  const AnimatedWrapper = ({ children }: { children: React.ReactNode }) => (
    <Animated.View style={[styles.flex, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {currentView === 'landing' && (
        <AnimatedWrapper>
          <PatientLandingUI 
            name={userName} 
            activeCaseStatus={activeStatus} // 🟢 Pass dynamic status
            onStart={() => router.push('/(tabs)/patient/patienthome')} 
            onViewDoctor={() => handleViewChange('doctor')}
            onViewPayment={() => handleViewChange('payment')}
          />
        </AnimatedWrapper>
      )}

      {currentView === 'doctor' && (
        <AnimatedWrapper>
          <DoctorProfileDetail onBack={() => handleViewChange('landing')} />
        </AnimatedWrapper>
      )}

      {currentView === 'payment' && (
        <AnimatedWrapper>
          <PaymentLearnMore onBack={() => handleViewChange('landing')} />
        </AnimatedWrapper>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  flex: { flex: 1 }
});