import React from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, View, StyleSheet } from 'react-native';
import { AccountSettingsUI } from '@/components/patient/AccountSettingsUI';
import { authService } from '@/services/authService';
import AuthLayout from '@/components/AuthLayout';
import { COLORS } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();

  const handleLogout = () => {
    const title = "Logout";
    const message = "Are you sure you want to logout?";

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) performLogout();
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: 'cancel' },
        { text: "Logout", style: 'destructive', onPress: performLogout }
      ]);
    }
  };

  const performLogout = async () => {
    try {
      await authService.logout(); 
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <AuthLayout>
        <AccountSettingsUI 
          userEmail="patient@praman.ai" 
          onLogout={handleLogout} 
          onChangePassword={() => router.push('/auth/change-password')} 
        />
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: COLORS.bgScreen }
});