import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AuthLayout from '../../components/AuthLayout';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';

export default function AdminHomeScreen() {
  const router = useRouter();

  const adminStats = [
    { label: STRINGS.admin.totalDoctors, value: '12', color: '#0D9488' },
    { label: STRINGS.admin.pendingCases, value: '45', color: '#CA8A04' },
    { label: STRINGS.admin.activeReports, value: '128', color: '#2563EB' },
  ];

  return (
    <View style={styles.screenWrapper}>
      <AuthLayout>
        <View style={styles.mainContainer}>
          <Text style={styles.title}>{STRINGS.admin.title}</Text>
          <Text style={styles.subtitle}>{STRINGS.admin.subtitle}</Text>

          {/* ⚪ THE GLASS CARD  */}
          <View style={styles.glassCard}>
            <View style={styles.statsRow}>
              {adminStats.map((stat, index) => (
                <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionSection}>
              <Text style={styles.sectionTitle}>{STRINGS.admin.quickActions}</Text>
              
              <PrimaryButton 
                title={STRINGS.admin.registerDoctor}
                onPress={() => router.push('../admin/add-doctor')}
                style={{ marginBottom: 15 }}
              />

              <PrimaryButton 
                title={STRINGS.admin.viewPending}
                onPress={() => console.log("Navigate to pending")}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { 
    flex: 1, 
    backgroundColor: COLORS.bgScreen 
  },
  mainContainer: { 
    width: '100%', 
    alignItems: 'center', 
    paddingTop: 10 
  },
  title: { 
    ...TYPOGRAPHY.header,
    color: COLORS.primary, 
    textAlign: 'center'
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSub,
    textAlign: 'center',
    marginBottom: 20
  },
  glassCard: {
    width: '94%', 
    backgroundColor: COLORS.glassBg, 
    borderRadius: BORDER_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 100, 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 25
  },
  statCard: { 
    backgroundColor: COLORS.white, 
    width: '31%', 
    padding: 12, 
    borderRadius: BORDER_RADIUS.inner, 
    borderLeftWidth: 4, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5
  },
  statValue: { 
    fontFamily: 'Inter-Bold',
    fontSize: 18, 
    color: COLORS.textMain 
  },
  statLabel: { 
    fontFamily: 'Inter-Medium',
    fontSize: 9, 
    color: COLORS.textSub, 
    marginTop: 4,
    textTransform: 'uppercase'
  },
  actionSection: { 
    width: '100%',
    marginTop: 10 
  },
  sectionTitle: { 
    ...TYPOGRAPHY.boldText,
    marginBottom: 15, 
    color: COLORS.textMain,
    fontSize: 16
  }
});