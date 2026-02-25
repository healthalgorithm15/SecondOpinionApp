import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import AuthLayout from '../../components/AuthLayout';
import AddDoctorForm from '../../components/admin/AddDoctorForm';
import { STRINGS } from '../../constants/Strings';
import { BORDER_RADIUS, COLORS } from '../../constants/theme';

export default function AddDoctorPage() {
  return (
    <View style={styles.screenWrapper}>
      <AuthLayout 
        title={STRINGS.admin.registerDoctor.replace('+ ', '')} 
        subtitle={STRINGS.admin.subtitle}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ⚪ THE GLASS CARD CONTAINER */}
          <View style={styles.glassCard}>
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
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%'
  },
  glassCard: {
    width: '94%',
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginTop: 10,
    // Matching the shadow depth of the Admin Dashboard stats
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
});