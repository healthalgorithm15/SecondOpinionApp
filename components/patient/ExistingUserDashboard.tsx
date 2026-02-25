import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { ReportItem } from './ReportItem';
import { COLORS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';

export default function ExistingUserDashboard({ name, reports, onContinue, onAddMore }: any) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await onContinue();
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>{STRINGS.patient.greeting}, {name}</Text>
      
      <BlurView intensity={30} tint="light" style={styles.glassCard}>
        <Text style={styles.listTitle}>{STRINGS.patient.recentReports}</Text>
        {reports.map((item: any, index: number) => (
          <ReportItem 
            key={item._id || index} 
            title={item.title} 
            date={item.reportDate} 
          />
        ))}
       <TouchableOpacity style={styles.addMoreBtn} onPress={onAddMore}>
        <Text style={styles.addMoreText}>{STRINGS.patient.addMore}</Text>
      </TouchableOpacity>
      </BlurView>

      <TouchableOpacity 
        style={[styles.primaryButton, isProcessing && { opacity: 0.8 }]} 
        onPress={handlePress}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>{STRINGS.patient.continueReview}</Text>
        )}
      </TouchableOpacity>

      {/* 🚀 KEEP: This is unique to the dashboard */}
      <Text style={styles.securityNote}>{STRINGS.common.securityNote}</Text>

      {/* 🛑 REMOVED: aiDisclaimerMid removed to prevent duplication */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 15, marginTop: 10 },
  welcome: { fontSize: 25, fontWeight: '500', color: COLORS.textMain, marginBottom: 25, letterSpacing: -1.5 },
  glassCard: { padding: 24, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.4)', overflow: 'hidden' },
  listTitle: { fontSize: 22, fontWeight: '500', color: COLORS.primary, marginBottom: 20 },
  addMoreBtn: { marginTop: 15, alignSelf: 'center' },
  addMoreText: { color: '#3182CE', fontWeight: '700', fontSize: 16 },
  primaryButton: { backgroundColor: '#1E5659', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 35, minHeight: 62, justifyContent: 'center' },
  buttonText: { color: '#ffffffa8', fontSize: 20, fontWeight: '500' },
  securityNote: { textAlign: 'center', fontSize: 14, color: COLORS.textSub, marginTop: 25, opacity: 0.9 },
});