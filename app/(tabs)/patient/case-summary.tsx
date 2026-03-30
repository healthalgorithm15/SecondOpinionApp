import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// 🟢 Internal Imports
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, SHADOWS } from '../../../constants/theme';
import { patientService } from '../../../services/patientService';

export default function CaseSummary() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Ensure we have a string caseId
  const caseId = Array.isArray(params.caseId) ? params.caseId[0] : params.caseId;

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);

  useEffect(() => {
    if (caseId) fetchFullResults();
  }, [caseId]);

  const fetchFullResults = async () => {
    try {
      setLoading(true);
      const res = await patientService.getCaseStatus(caseId);
      if (res.success) {
        setCaseData(res.data);
      }
    } catch (error) {
      console.error("❌ Error loading results:", error);
      Alert.alert("Error", "Could not refresh case data.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 👁️ OPEN UNIVERSAL PREVIEW
   * This sends the user to the DocumentViewScreen which now handles 
   * both Viewing AND Saving/Sharing.
   */
  const handlePreview = (type: 'ai' | 'doctor') => {
    if (!caseId) return;
    const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
    
    router.push({
      pathname: '../../view/DocumentViewScreen' as any,
      params: { 
        docId: `case/${endpoint}/${caseId}`, 
        fileName: type === 'ai' ? 'PramanAI_Analysis.pdf' : 'Clinical_Verdict.pdf',
        contentType: 'application/pdf',
      }
    });
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 10, color: '#64748B' }}>Fetching Clinical Data...</Text>
    </View>
  );

  return (
    <AuthLayout title="Report Summary" subtitle="Praman AI Clinical Verdict">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/patient')} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Details</Text>
          <TouchableOpacity onPress={fetchFullResults} style={styles.refreshBtn}>
             <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 👨‍⚕️ SPECIALIST VERDICT CARD */}
        <View style={styles.verdictCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={20} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Specialist Conclusion</Text>
          </View>
          
          <Text style={styles.mainVerdict}>
            {caseData?.doctorOpinion?.finalVerdict || "Your specialist is currently reviewing your records."}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Medical Roadmap</Text>
          <Text style={styles.bodyText}>
            {caseData?.doctorOpinion?.recommendations || "Detailed recommendations will appear here once the review is finalized."}
          </Text>
          
          {caseData?.doctorOpinion?.finalVerdict && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.previewBtn} onPress={() => handlePreview('doctor')}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.primary} style={{marginRight: 8}} />
                <Text style={styles.previewBtnText}>View & Download Verdict</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 🤖 AI PRELIMINARY CARD */}
        <View style={styles.aiReferenceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="analytics-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>AI Preliminary Context</Text>
          </View>
          
          <Text style={styles.aiBody}>
            {caseData?.aiAnalysis?.summary || "AI analysis is being generated..."}
          </Text>
          
          <View style={styles.aiButtonGroup}>
            <TouchableOpacity 
                style={styles.aiActionLink} 
                onPress={() => handlePreview('ai')}
            >
              <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
              <Text style={styles.aiActionText}>View AI PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  closeBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center' },
  verdictCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, ...SHADOWS.soft, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontWeight: '700', fontSize: 13, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  mainVerdict: { fontWeight: '700', fontSize: 18, color: '#1E293B', lineHeight: 26 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  label: { fontWeight: '700', fontSize: 11, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  bodyText: { fontSize: 15, color: '#475569', lineHeight: 24 },
  buttonGroup: { marginTop: 25 },
  previewBtn: { 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1.5, 
    borderColor: COLORS.primary, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  previewBtnText: { color: COLORS.primary, fontWeight: '700' },
  aiReferenceCard: { marginTop: 24, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  aiBody: { fontSize: 14, color: '#475569', marginVertical: 8, lineHeight: 22 },
  aiButtonGroup: { flexDirection: 'row', gap: 24, marginTop: 12 },
  aiActionLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiActionText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 }
});