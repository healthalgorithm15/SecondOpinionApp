import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '../../utils/storage';
import { COLORS } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const token = await storage.getItem('userToken');
        const rawRole = await storage.getItem('userRole');
        const role = rawRole ? rawRole.toLowerCase() : null;

        if (token) {
          // Deterministic routing based on role
          if (role === 'doctor') {
            router.replace('/(tabs)/doctor-home');
          } else if (role === 'admin') {
            router.replace('/(tabs)/admin-home');
          } else {
            // Default to Patient Home as per your mockup flow
            router.replace('/(tabs)/patienthome');
          }
        } else {
          // No token? Back to the Welcome/Login screen
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error("Home Redirect Error:", error);
        router.replace('/auth/login');
      }
    };

    checkUserAndRedirect();
  }, []);

  // Use a clean, branded loading state while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.bgScreen // Matches your medical theme background
  },
});