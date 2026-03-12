import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PatientLandingUI } from '@/components/patient/PatientLandingUI';
import { DoctorProfileDetail } from '@/components/patient/DoctorProfileDetail';
import { PaymentLearnMore } from '@/components/patient/PaymentLearnMore';
import { patientService } from '@/services/patientService';
import { storage } from '@/utils/storage';

// Define the possible views within this tab
type ViewState = 'landing' | 'doctor' | 'payment';

export default function DiscoverScreen() {
  const router = useRouter();
  
  // State Management
  const [userName, setUserName] = useState('User');
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  
  // Animation Values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(10));

  /**
   * 1. INITIAL LOAD
   * Fetch static data like user name from local storage
   */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedName = await storage.getItem('userName');
        if (savedName) setUserName(savedName);
      } catch (err) {
        console.log("Error loading user from storage", err);
      }
    };
    loadUser();
  }, []);

  /**
   * 2. DATA FETCHING (DASHBOARD)
   * Accesses res.data.activeCase.status to match your PatientController logic
   */
  const fetchDashboardData = async () => {
    try {
      const res = await patientService.getDashboard();
      
      // Verification: Controller returns { success: true, data: { activeCase: {...} } }
      if (res.success && res.data && res.data.activeCase) {
        console.log("Active Case Status found:", res.data.activeCase.status);
        setActiveStatus(res.data.activeCase.status);
      } else {
        console.log("No active case found for tracker");
        setActiveStatus(null);
      }
    } catch (err) {
      console.error("Discover fetch error:", err);
      setActiveStatus(null);
    }
  };

  /**
   * 3. AUTO-REFRESH ON TAB FOCUS
   * This ensures that if a patient finishes a payment or uploads a report, 
   * the tracker appears immediately when they return to this screen.
   */
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      triggerAnimation();
    }, [])
  );

  /**
   * 4. UI TRANSITIONS
   * Handles smooth fading between Landing, Doctor Profile, and Payment Info
   */
  const triggerAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    triggerAnimation();
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {currentView === 'landing' && (
          <PatientLandingUI 
            name={userName} 
            activeCaseStatus={activeStatus} 
            onStart={() => router.push('/(tabs)/patient/patienthome')} 
            onViewDoctor={() => handleNavigate('doctor')}
            onViewPayment={() => handleNavigate('payment')}
          />
        )}

        {currentView === 'doctor' && (
          <DoctorProfileDetail onBack={() => handleNavigate('landing')} />
        )}

        {currentView === 'payment' && (
          <PaymentLearnMore onBack={() => handleNavigate('landing')} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF', // Matches your clean clinical theme
  },
  content: {
    flex: 1,
  },
});