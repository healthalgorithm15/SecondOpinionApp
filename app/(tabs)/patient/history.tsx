import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // 🟢 Added Icons
import { useFocusEffect } from '@react-navigation/native';
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { patientService } from '../../../services/patientService';

export default function PatientHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reusingId, setReusingId] = useState<string | null>(null); // 🟢 Track specific reuse loading state
  const [completedCases, setCompletedCases] = useState<any[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await patientService.getReviewHistory(); 
      if (res.success && Array.isArray(res.data)) {
        const finalized = res.data.filter((c: any) => 
          c.status?.toString().trim().toUpperCase() === "COMPLETED"
        );
        setCompletedCases(finalized);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🟢 REUSE LOGIC
   * Sends the record back to the current drafts workspace
   */
  const handleReuse = async (reportId: string) => {
    try {
      setReusingId(reportId);
      const res = await patientService.reuseRecord(reportId);
      
      if (res.success) {
        Alert.alert(
          "Added to Vault",
          "This document has been added to your current drafts.",
          [
            { text: "View Drafts", onPress: () => router.push('/patient/patienthome') },
            { text: "Keep Browsing", style: "cancel" }
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Could not reuse this document.");
    } finally {
      setReusingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <AuthLayout scrollEnabled={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Medical History</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.historyBox}>
            <FlatList
              data={completedCases}
              keyExtractor={(item) => item._id}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.cardContainer}>
                  <TouchableOpacity 
                    style={styles.card}
                    onPress={() => router.push({
                      pathname: "/patient/case-summary", 
                      params: { caseId: item._id }
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                      <Text style={styles.summary} numberOfLines={1}>
                        {item.aiAnalysis?.summary || "Report Finalized"}
                      </Text>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.riskLevel || 'Review Complete'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
                  </TouchableOpacity>

                  {/* 🟢 REUSE ACTION BUTTON */}
                  <TouchableOpacity 
                    style={styles.reuseButton}
                    onPress={() => handleReuse(item.recordIds[0]?._id || item.recordIds[0])}
                    disabled={reusingId !== null}
                  >
                    {reusingId === (item.recordIds[0]?._id || item.recordIds[0]) ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="file-restore-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.reuseText}>Reuse Document</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No finalized medical reports found.</Text>
              }
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          </View>
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, marginBottom: 20 },
  historyBox: { flex: 1, width: '100%' },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  card: { 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  reuseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    gap: 6
  },
  reuseText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  date: { fontSize: 11, color: COLORS.textSub, marginBottom: 4 },
  summary: { ...TYPOGRAPHY.boldText, fontSize: 15, color: COLORS.textMain, marginBottom: 6 },
  badge: { backgroundColor: 'rgba(30, 125, 117, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: COLORS.textSub, fontStyle: 'italic' },
});