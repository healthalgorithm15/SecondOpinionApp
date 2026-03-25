import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ReportItem } from './ReportItem';
import { COLORS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';

interface ExistingUserDashboardProps {
  name: string;
  reports: any[];
  onContinue: () => void | Promise<void>; 
  onAddMore: () => void | Promise<void>;
  onDeleteReport: (id: string) => void | Promise<void>; 
}

export default function ExistingUserDashboard({ 
  name, reports, onContinue, onAddMore, onDeleteReport 
}: ExistingUserDashboardProps) {
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
    // 🟢 SYNCED: Matches the DocumentViewScreen params precisely
    router.push({
      pathname: '/view/DocumentViewScreen' as any, // Ensure this path matches your file structure
      params: { 
        docId: item._id, 
        fileName: item.fileName || item.title || "Medical Record", 
         contentType: item.contentType,
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>{STRINGS.patient.greeting}, {name}</Text>
      
      <BlurView intensity={30} tint="light" style={styles.glassCard}>
        <Text style={styles.listTitle}>{STRINGS.patient.recentReports}</Text>
        
        {reports && reports.length > 0 ? (
          reports.map((item: any) => (
            <ReportItem 
              key={item._id} 
              // 🟢 FIX: Passing fileName as title to the ReportItem
              title={item.fileName || item.title || "Medical Record"} 
              date={item.createdAt} 
              contentType={item.contentType} 
              onPress={() => handleViewReport(item)}
              onDelete={() => onDeleteReport(item._id)} 
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No reports uploaded yet.</Text>
        )}

        <TouchableOpacity 
          style={styles.addMoreBtn} 
          onPress={onAddMore}
          activeOpacity={0.6}
        >
          <Text style={styles.addMoreText}>+ {STRINGS.patient.addMore}</Text>
        </TouchableOpacity>
      </BlurView>

      <TouchableOpacity 
        style={[
          styles.primaryButton, 
          (isProcessing || !reports || reports.length === 0) && { opacity: 0.6 }
        ]} 
        onPress={handlePress}
        disabled={isProcessing || !reports || reports.length === 0}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>
            {reports && reports.length > 0 ? STRINGS.patient.submitAnalysis : STRINGS.patient.continueUpload}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', paddingHorizontal: 15, marginTop: 10 },
  welcome: { 
    fontSize: 25, 
    fontWeight: '500', 
    color: COLORS.textMain, 
    marginBottom: 25, 
    letterSpacing: -0.5 
  },
  glassCard: { 
    padding: 24, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 255, 255, 0.4)', 
    overflow: 'hidden' 
  },
  listTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: COLORS.primary, 
    marginBottom: 20 
  },
  emptyText: { 
    textAlign: 'center', 
    color: COLORS.textSub, 
    marginVertical: 20, 
    fontStyle: 'italic' 
  },
  addMoreBtn: { 
    marginTop: 15, 
    alignSelf: 'center', 
    padding: 10 
  },
  addMoreText: { 
    color: COLORS.primary, 
    fontWeight: '700', 
    fontSize: 16 
  },
  primaryButton: { 
    backgroundColor: COLORS.primary, 
    paddingVertical: 18, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginTop: 35,
    // Add shadow for "MedTech" feel
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 18, 
    fontWeight: '600' 
  },
});