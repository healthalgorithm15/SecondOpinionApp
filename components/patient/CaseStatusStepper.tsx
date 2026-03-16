import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useRouter } from 'expo-router';

export const CaseStatusStepper = ({ currentCase }: { currentCase: any }) => {
  const router = useRouter();
  if (!currentCase || !currentCase._id) return null;

  const status = currentCase.status;
  const isCompleted = status === 'COMPLETED';

  const handleNavigation = () => {
    router.push({
      pathname: '/(tabs)/patient/case-status',
      params: { 
        caseId: currentCase._id,
        mode: isCompleted ? 'results' : 'tracking' 
      }
    });
  };

  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusHeader}>
        {isCompleted ? "Analysis Complete" : "Active Case"}
      </Text>
      <Text style={styles.statusSub}>
        ID: {currentCase._id.toString().slice(-6).toUpperCase()}
      </Text>
      
      <View style={styles.stepperContainer}>
        {/* Step 1: Upload (Always Completed if the case exists) */}
        <StepItem icon="file-upload" label="Upload" completed />

        {/* Step 2: AI Processing */}
        <StepItem 
          icon="robot-outline" 
          label="AI" 
          active={status === 'AI_PROCESSING'} 
          completed={status !== 'AI_PROCESSING'} 
        />

        {/* Step 3: Expert Review */}
        <StepItem 
          icon="account-doctor" // Fixed icon name
          label="Expert" 
          active={status === 'PENDING_DOCTOR'} 
          completed={isCompleted} 
        />

        {/* Step 4: Final Results */}
        <StepItem 
          icon="check-circle-outline" 
          label="Final" 
          active={isCompleted} 
          completed={isCompleted} 
        />
      </View>

      <TouchableOpacity 
        style={[styles.detailsBtn, isCompleted && { backgroundColor: '#10B981' }]} 
        onPress={handleNavigation}
        activeOpacity={0.8}
      >
        <Text style={styles.detailsBtnText}>
          {isCompleted ? "View Results" : "Track Progress"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const StepItem = ({ icon, label, completed, active }: any) => (
  <View style={styles.stepItem}>
    <View style={[
      styles.stepCircle, 
      (completed || active) && { backgroundColor: COLORS.primary }
    ]}>
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color={completed || active ? "white" : "#94A3B8"} 
      />
    </View>
    <Text style={[
      styles.stepLabel, 
      (active || completed) && { color: COLORS.primary, fontWeight: '700' }
    ]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  statusCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    padding: 24, 
    borderRadius: 28, 
    ...SHADOWS.soft, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 20 
  },
  statusHeader: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statusSub: { fontSize: 13, color: '#64748b', marginBottom: 25 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  stepLabel: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },
  detailsBtn: { 
    backgroundColor: COLORS.primary, 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  detailsBtnText: { color: 'white', fontWeight: '800', fontSize: 16 }
});