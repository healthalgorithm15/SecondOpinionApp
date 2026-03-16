import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Alert, ActivityIndicator, Modal, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { PatientLandingUI } from '../../../components/patient/PatientLandingUI';
import { DoctorProfileDetail } from '../../../components/patient/DoctorProfileDetail';
import { PaymentLearnMore } from '../../../components/patient/PaymentLearnMore';
import { patientService } from '../../../services/patientService';
import { storage } from '../../../utils/storage';
import { startPaymentFlow } from '../../../services/paymentService'; 
import { COLORS } from '../../../constants/theme';

type ViewState = 'landing' | 'doctor' | 'payment';

export default function DiscoverScreen() {
  const router = useRouter();
  
  const [userName, setUserName] = useState('User');
  const [userId, setUserId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [hasPaidCredit, setHasPaidCredit] = useState(false);
  const [loading, setLoading] = useState(false); 
  
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(10));

  const fetchDashboardData = async () => {
    try {
      const data = await patientService.getDashboard();
      setUserName(data.user?.name || 'User');
      setUserId(data.user?._id || null);
      setActiveStatus(data.activeCase?.status || null);
      
      // ✅ Production Logic: Enable upload if payment is confirmed or case is active
      const canProceed = !!data.activeCase || !!data.hasActivePayment;
      setHasPaidCredit(canProceed);
    } catch (error) {
      console.error("Discover Sync Error:", error);
    }
  };

  const triggerAnimation = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, slideAnim]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      triggerAnimation();
    }, [triggerAnimation])
  );

  const handleStartAnalysis = () => {
    if (hasPaidCredit) {
      // ✅ Routes to the main patient tab where upload exists
      router.push('/(tabs)/patient' as any);
    } else {
      Alert.alert(
        "Praman AI",
        "To start a new medical analysis, please purchase a single-case credit.",
        [
          { text: "Later", style: "cancel" },
          { text: "Get Credit", onPress: () => handleNavigate('payment') }
        ]
      );
    }
  };

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    triggerAnimation();
  };

  const handlePaymentProcess = async () => {
    if (!userId) {
      Alert.alert("Session Error", "Please log in again to continue.");
      return;
    }

    setLoading(true); // 🟢 Start Loader
    try {
      const email = await storage.getItem('userEmail') || '';
      const phone = await storage.getItem('userPhone') || '';
      
      // 1. Trigger Razorpay Service
      const result = await startPaymentFlow('new_scan', userId, { 
        email, 
        phone, 
        name: userName 
      });
      
      // 2. Verification Handshake
      if (result && result.success) {
        await fetchDashboardData(); // Refresh local state
        handleNavigate('landing');
        Alert.alert("Success", "Analysis credit added! You can now start uploading.");
      }
    } catch (error: any) {
      // 2 is Razorpay's "User Cancelled" code
      if (error.code !== 2 && error.code !== 'PAYMENT_CANCELLED') {
        Alert.alert("Payment Issue", error.message || "Verification failed. Our server will process it shortly.");
      }
    } finally {
      setLoading(false); // 🟢 Stop Loader
    }
  };

  return (
    <View style={styles.container}>
      {/* 🟢 FULL SCREEN LOADING OVERLAY */}
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Verifying Transaction...</Text>
          <Text style={styles.loaderSub}>Please do not close the app</Text>
        </View>
      </Modal>

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {currentView === 'landing' && (
          <PatientLandingUI 
            name={userName} 
            activeCaseStatus={activeStatus} 
            onStart={handleStartAnalysis} 
            onViewDoctor={() => handleNavigate('doctor')}
            onViewPayment={() => handleNavigate('payment')}
          />
        )}

        {currentView === 'doctor' && (
          <DoctorProfileDetail onBack={() => handleNavigate('landing')} />
        )}

        {currentView === 'payment' && (
          <PaymentLearnMore 
            onBack={() => handleNavigate('landing')} 
            onPay={handlePaymentProcess} 
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { flex: 1 },
  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20
  },
  loaderSub: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8
  }
});