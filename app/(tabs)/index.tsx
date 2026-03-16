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

        // 🛡️ THE FIX: Wrap the navigation in a small timeout.
        // This ensures the Root Layout Stack is fully mounted before we move.
        setTimeout(() => {
          if (token) {
            if (role === 'doctor') {
              router.replace('/(tabs)/doctor/doctor-home');
            } else if (role === 'admin') {
              router.replace('/(tabs)/admin-home');
            } else {
              router.replace('/(tabs)/patient' as any);
            }
          } else {
            router.replace('/auth/login');
          }
        }, 10); // A 10ms delay is invisible to users but fixes the crash.

      } catch (error) {
        console.error("Home Redirect Error:", error);
        router.replace('/auth/login');
      }
    };

    checkUserAndRedirect();
  }, []);

  return (
    <View style={styles.container}>
      {/* Branded loader for a smooth transition */}
      <ActivityIndicator size="large" color={COLORS.secondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.bgScreen || '#FFFFFF' 
  },
});