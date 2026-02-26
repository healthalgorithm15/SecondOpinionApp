import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Design System
import AuthLayout from '../../../components/AuthLayout';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { STRINGS } from '../../../constants/Strings';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';

export default function SubmissionConfirmation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log("case id in submission confirmation ", params.caseId);
  
  // Logic Preserved: Parse filenames passed from PatientHome
  const reportNames = params.reportNames ? JSON.parse(params.reportNames as string) : [];

  return (
    <AuthLayout>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header matching Dashboard style */}
        <View style={styles.headerSection}>
          <Text style={styles.appName}>{STRINGS.common.appName}</Text>
          
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
            <Text style={styles.title}>{STRINGS.confirmation.title}</Text>
          </View>
        </View>

        {/* Main Glass Card */}
        <View style={styles.glassCard}>
          <Text style={styles.subtext}>
            {STRINGS.confirmation.subtext}
          </Text>

          {/* Dynamic list of submitted files */}
          <View style={styles.fileList}>
             {reportNames.map((name: string, index: number) => (
               <View key={index} style={styles.filePill}>
                 <Ionicons name="document-text" size={16} color={COLORS.secondary} />
                 <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
               </View>
             ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsTitle}>{STRINGS.confirmation.nextStepsTitle}</Text>
            
            <View style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>{STRINGS.confirmation.step1}</Text>
            </View>
            
            <View style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>{STRINGS.confirmation.step2}</Text>
            </View>
            
            <View style={styles.stepRow}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>{STRINGS.confirmation.step3}</Text>
            </View>
          </View>

          <PrimaryButton 
            title={STRINGS.confirmation.backToDashboard}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/patient/case-status' as any,
                params: { caseId: params.caseId }
              });
            }}
          />
        </View>

        <View style={styles.securityFooter}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.textSub} />
          <Text style={styles.securityNote}>{STRINGS.common.securityNote}</Text>
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { 
    paddingBottom: 100 
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  appName: { 
    ...TYPOGRAPHY.brand,
    fontSize: 22, 
    color: COLORS.primary, 
    marginBottom: 15 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    elevation: 2,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  title: { 
    ...TYPOGRAPHY.header,
    fontSize: 18, 
    color: COLORS.textMain 
  },
  glassCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginHorizontal: 15,
  },
  subtext: { 
    ...TYPOGRAPHY.body,
    textAlign: 'center', 
    color: COLORS.textSub, 
    lineHeight: 22, 
    marginBottom: 25, 
  },
  fileList: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginBottom: 25,
    justifyContent: 'center'
  },
  filePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileName: { 
    fontFamily: 'Inter-SemiBold',
    fontSize: 13, 
    color: COLORS.textMain, 
    maxWidth: 150
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    width: '100%',
    marginBottom: 25,
    opacity: 0.3
  },
  nextStepsSection: { 
    width: '100%', 
    marginBottom: 35 
  },
  nextStepsTitle: { 
    ...TYPOGRAPHY.header,
    fontSize: 18, 
    color: COLORS.primary, 
    marginBottom: 15,
    textAlign: 'left'
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginTop: 8
  },
  stepText: { 
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.textMain, 
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 25
  },
  securityNote: {
    ...TYPOGRAPHY.disclaimer,
    color: COLORS.textSub,
  }
});