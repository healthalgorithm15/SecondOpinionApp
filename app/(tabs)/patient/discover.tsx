import React, { useEffect, useState, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PatientLandingUI } from '@/components/patient/PatientLandingUI';
import { DoctorProfileDetail } from '@/components/patient/DoctorProfileDetail';
import { PaymentLearnMore } from '@/components/patient/PaymentLearnMore';
import { storage } from '@/utils/storage';

type ViewState = 'landing' | 'doctor' | 'payment';

export default function DiscoverScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('User');
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  
  // 🟢 Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Initial entrance animation
    startTransition();

    const fetchUserName = async () => {
      const savedName = await storage.getItem('userName');
      if (savedName) setUserName(savedName);
    };
    fetchUserName();
  }, []);

  const startTransition = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleViewChange = (view: ViewState) => {
    // Re-trigger animation on view change
    setCurrentView(view);
    startTransition();
  };

  // 🟢 Helper to wrap components in animated container
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