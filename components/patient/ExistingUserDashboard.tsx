import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { ReportItem } from './ReportItem';
import { COLORS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import { useRouter } from 'expo-router';

export default function ExistingUserDashboard({ name, reports, onContinue, onAddMore, onDeleteReport }: any) {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handlePress = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onContinue();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReport = (item: any) => {
    router.push({
      pathname: '/view/DocumentViewScreen',
      params: { 
        docId: item._id,           
        fileName: item.title,      
        contentType: item.contentType, 
        role: 'patient'            
      }
    } as any); 
  };

  const confirmDelete = (reportId: string) => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to permanently remove this medical record?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => onDeleteReport(reportId) 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>{STRINGS.patient.greeting}, {name}</Text>
      
      <BlurView intensity={30} tint="light" style={styles.glassCard}>
        <Text style={styles.listTitle}>{STRINGS.patient.recentReports}</Text>
        
        {reports && reports.length > 0 ? (
          reports.map((item: any, index: number) => (
            <ReportItem 
              key={item._id || index} 
              title={item.title} 
              date={item.reportDate}
              contentType={item.contentType} 
              onPress={() => handleViewReport(item)} 
              onDelete={() => confirmDelete(item._id)} 
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No reports uploaded yet.</Text>
        )}

        <TouchableOpacity style={styles.addMoreBtn} onPress={onAddMore}>
          <Text style={styles.addMoreText}>{STRINGS.patient.addMore}</Text>
        </TouchableOpacity>
      </BlurView>

      {/* UPDATED: Button logic to match new flow labels */}
      <TouchableOpacity 
        style={[styles.primaryButton, isProcessing && { opacity: 0.8 }]} 
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>
            {/* If reports exist, we move to payment/review */}
            {reports && reports.length > 0 
              ? STRINGS.patient.continuePayment 
              : STRINGS.patient.continueUpload}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.securityNote}>{STRINGS.common.securityNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 15, marginTop: 10 },
  welcome: { fontSize: 25, fontWeight: '500', color: COLORS.textMain, marginBottom: 25, letterSpacing: -1.5 },
  glassCard: { 
    padding: 24, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 255, 255, 0.4)', 
    overflow: 'hidden' 
  },
  listTitle: { fontSize: 20, fontWeight: '600', color: COLORS.primary, marginBottom: 20 },
  emptyText: { textAlign: 'center', color: COLORS.textSub, marginVertical: 20, fontStyle: 'italic' },
  addMoreBtn: { marginTop: 15, alignSelf: 'center', padding: 10 },
  addMoreText: { color: '#3182CE', fontWeight: '700', fontSize: 15 },
  primaryButton: { 
    backgroundColor: '#1E5659', 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 35, 
    minHeight: 62, 
    justifyContent: 'center' 
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  securityNote: { textAlign: 'center', fontSize: 12, color: COLORS.textSub, marginTop: 25, opacity: 0.8 },
});