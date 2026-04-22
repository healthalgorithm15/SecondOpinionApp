import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../components/AuthLayout';
import AddDoctorForm from '../../components/admin/AddDoctorForm';
import { STRINGS } from '../../constants/Strings';
import { BORDER_RADIUS, COLORS } from '../../constants/theme';

export default function AddDoctorPage() {
  const router = useRouter();

  return (
    <View style={styles.screenWrapper}>
      {/* ⬅️ BACK BUTTON: Positioned absolutely to sit over the layout */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <AuthLayout 
        title={STRINGS.admin.registerDoctor.replace('+ ', '')} 
        subtitle="Register a verified medical professional"
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.glassCard}>
            {/* CRITICAL: Ensure your AddDoctorForm component uses 
               router.replace('/(admin)/') inside its success callback 
            */}
            <AddDoctorForm />
          </View>
        </ScrollView>
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { 
    flex: 1, 
    backgroundColor: COLORS.bgScreen 
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Adjusts for Status Bar
    left: 20,
    zIndex: 99, // Ensures it stays above the AuthLayout
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for the button
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scrollContent: { 
    paddingBottom: 40, 
    alignItems: 'center', 
    width: '100%' 
  },
  glassCard: {
    width: '94%',
    backgroundColor: COLORS.glassBg || 'rgba(255, 255, 255, 0.8)',
    borderRadius: BORDER_RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder || 'rgba(255, 255, 255, 0.3)',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});