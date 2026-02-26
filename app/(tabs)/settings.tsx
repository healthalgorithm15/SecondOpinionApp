import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import { AccountSettingsUI } from '@/components/patient/AccountSettingsUI';
import { authService } from '@/services/authService';
import AuthLayout from '@/components/AuthLayout';
import { COLORS } from '@/constants/theme';
import { STRINGS } from '@/constants/Strings';

export default function SettingsScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await authService.getProfile();
        // Check if response exists and has the email
        if (response && response.success) {
          setUserEmail(response.data.email || response.data.mobile || "");
        }
      } catch (error) {
        console.error("Failed to load user email:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${STRINGS.settings.logout}\n\n${STRINGS.settings.confirmLogout}`);
      if (confirmed) performLogout();
    } else {
      Alert.alert(STRINGS.settings.logout, STRINGS.settings.confirmLogout, [
        { text: STRINGS.common.cancel, style: 'cancel' },
        { text: STRINGS.settings.logout, style: 'destructive', onPress: performLogout }
      ]);
    }
  };

  const performLogout = async () => {
    await authService.logout(); // The router.replace is already inside your authService.logout
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <AuthLayout title={STRINGS.settings.title} subtitle={STRINGS.settings.version}>
        <AccountSettingsUI 
          userEmail={userEmail} // 🟢 Now dynamic!
          onLogout={handleLogout} 
          onChangePassword={() => router.push(`../(auth)/change-password` as any)}
        />
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: COLORS.bgScreen },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgScreen }
});