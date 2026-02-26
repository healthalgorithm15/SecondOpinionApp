import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { patientService } from '../../../services/patientService';

export default function PatientHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [completedCases, setCompletedCases] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
       
        const res = await patientService.getReviewHistory(); 
        console.log("histroy screen xxxxx", res)
        if (res.success && Array.isArray(res.data)) {
        
          const finalized = res.data.filter((c: any) => 
            c.status?.toString().trim().toUpperCase() === "COMPLETED"
          );
           console.log("histroy screen xxxxx finalized", finalized)
          setCompletedCases(finalized);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Medical History</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={completedCases}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.card}
                onPress={() => router.push({
  pathname: "/patient/case-summary", 
  params: { caseId: item._id }
})}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  {/* Access aiAnalysis.summary as defined in your DB */}
                  <Text style={styles.summary} numberOfLines={1}>
                    {item.aiAnalysis?.summary || "Report Finalized"}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.riskLevel || 'Review Complete'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No finalized medical reports found.</Text>
            }
          />
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary, marginBottom: 20 },
  card: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: BORDER_RADIUS.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12,
    elevation: 2, // Add slight shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  date: { fontSize: 11, color: COLORS.textSub, marginBottom: 4 },
  summary: { ...TYPOGRAPHY.boldText, fontSize: 15, color: COLORS.textMain, marginBottom: 6 },
  badge: { 
    backgroundColor: 'rgba(30, 125, 117, 0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    alignSelf: 'flex-start' 
  },
  badgeText: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: COLORS.textSub },
});