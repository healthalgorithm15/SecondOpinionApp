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

  /**
   * 🟢 CORE SYNC LOGIC
   * Fetches the latest state. 
   * 'hasActivePayment' is the boolean from the backend indicating an unused credit.
   */
  const fetchDashboardData = async (): Promise<boolean> => {
    try {
      const response = await patientService.getDashboard();
      // Supports standard axios response or direct data
      const data = response?.data?.data || response?.data || response;
      
      if (!data) return false;

      setUserName(data.user?.name || 'User');
      setUserId(data.user?._id || null);
      setActiveStatus(data.activeCase?.status || null);
      
      // STRICT RULE: If they have an active case OR a paid credit, they can proceed.
      const canProceed = !!data.activeCase || !!data.hasActivePayment;
      
      setHasPaidCredit(canProceed);
      return canProceed;
    } catch (error) {
      console.error("Discover Sync Error:", error);
      return false;
    }
  };

  /**
   * 🟢 POLLING HELPER
   * Prevents the "I paid but can't upload" bug. 
   * Retries 5 times (total 10s) to wait for the Razorpay Webhook to hit your DB.
   */
  const pollForPaymentStatus = async (maxAttempts = 5): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      const isPaid = await fetchDashboardData();
      if (isPaid) return true;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    return false;
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

  /**
   * 🟢 START ANALYSIS HANDLER
   * Checks the credit status before allowing navigation to the upload tab.
   */
  const handleStartAnalysis = () => {
    if (hasPaidCredit) {
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

  /**
   * 🟢 PAYMENT PROCESSOR
   * Initiates payment and triggers the verification poll.
   */
  const handlePaymentProcess = async () => {
    setLoading(true); 
    try {
      const [storedId, email, phone] = await Promise.all([
        storage.getItem('userId'),
        storage.getItem('userEmail'),
        storage.getItem('userPhone')
      ]);

      if (!storedId) {
        setLoading(false);
        Alert.alert("Session Expired", "Please log in again.");
        router.replace('/auth/login');
        return;
      }

      const result = await startPaymentFlow('new_scan', storedId, { 
        email: email || '', 
        phone: phone || '', 
        name: userName 
      });
      
      if (result?.success) {
        // Step 1: Force poll the backend to confirm the 'Paid' status
        const isVerified = await pollForPaymentStatus();
        
        // Step 2: Return to main view
        handleNavigate('landing');
        
        if (isVerified) {
          Alert.alert("Success", "Analysis credit added! You can now upload your reports.");
        } else {
          Alert.alert(
            "Payment Processing", 
            "Transaction successful. It might take a moment to reflect. You can refresh the page shortly."
          );
        }
      }
    } catch (error: any) {
      // 🛡️ PRODUCTION GUARD: Handle cases where the backend says a credit already exists (400 error)
      const isDuplicatePayment = error.response?.status === 400 && 
                                  (error.response?.data?.code === 'UNUSED_CREDIT_EXISTS' || 
                                   error.response?.data?.message?.toLowerCase().includes('credit'));

      if (isDuplicatePayment) {
        setHasPaidCredit(true);
        handleNavigate('landing');
        Alert.alert("Credit Available", "You already have an unused credit. Please proceed to upload.");
      } else if (error.code !== 2 && error.code !== 'PAYMENT_CANCELLED') {
        // Log original error for debugging
        console.error("Payment Error Details:", error.response?.data || error.message);
        Alert.alert("Payment Issue", error.response?.data?.message || error.message || "Process failed.");
      }
    } finally {
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Verifying Transaction...</Text>
          <Text style={styles.loaderSub}>Finalizing credit with secure servers</Text>
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
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 20 },
  loaderSub: { color: '#9CA3AF', fontSize: 14, marginTop: 8 }
});