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

  const handlePreview = (type: 'ai' | 'doctor' | 'cmo') => {
    if (!caseId) return;
    let endpoint = 'pdf-ai';
    let fileName = 'PramanAI_Analysis.pdf';

    if (type === 'doctor') {
      endpoint = 'pdf-doctor';
      fileName = 'Specialist_Verdict.pdf';
    } else if (type === 'cmo') {
      endpoint = 'pdf-cmo'; // New endpoint for the signed CMO report
      fileName = 'Final_Clinical_Verdict.pdf';
    }
    
    router.push({
      pathname: '../../view/DocumentViewScreen' as any,
      params: { 
        docId: `case/${endpoint}/${caseId}`, 
        fileName,
        contentType: 'application/pdf',
      }
    });
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 10, color: '#64748B' }}>Syncing Medical Records...</Text>
    </View>
  );

  return (
    <AuthLayout title="Case Report" subtitle="Praman AI Multi-Step Verification">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/patient')} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Verdict</Text>
          <TouchableOpacity onPress={fetchFullResults} style={styles.refreshBtn}>
             <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* 👑 LAYER 1: CMO FINAL VERIFICATION (Highest Authority) */}
        {caseData?.cmoOpinion?.updatedVerdict ? (
          <View style={[styles.verdictCard, styles.cmoCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#4338CA' }]}>
                <Ionicons name="ribbon" size={20} color="#FFF" />
              </View>
              <Text style={[styles.cardTitle, { color: '#4338CA' }]}>Final CMO Verification</Text>
            </View>
            
            <Text style={styles.mainVerdict}>{caseData.cmoOpinion.updatedVerdict}</Text>
            <View style={styles.divider} />
            <Text style={styles.label}>Chief Medical Recommendations</Text>
            <Text style={styles.bodyText}>{caseData.cmoOpinion.updatedRecommendations}</Text>
            
            <TouchableOpacity 
              style={[styles.previewBtn, { marginTop: 20, borderColor: '#4338CA' }]} 
              onPress={() => handlePreview('cmo')}
            >
              <Ionicons name="shield-checkmark" size={18} color="#4338CA" style={{marginRight: 8}} />
              <Text style={[styles.previewBtnText, { color: '#4338CA' }]}>Download Signed Final Report</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pendingCard}>
             <Ionicons name="time-outline" size={20} color="#94A3B8" />
             <Text style={styles.pendingText}>Waiting for Final CMO Sign-off...</Text>
          </View>
        )}

        {/* 👨‍⚕️ LAYER 2: SPECIALIST ANALYSIS */}
        <View style={styles.verdictCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="medical" size={20} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Specialist Analysis</Text>
          </View>
          
          <Text style={styles.mainVerdict}>
            {caseData?.doctorOpinion?.diagnosis || caseData?.doctorOpinion?.finalVerdict || "Processing..."}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Clinical Roadmap</Text>
          <Text style={styles.bodyText}>
            {caseData?.doctorOpinion?.recommendations || "Awaiting specialist notes."}
          </Text>
        </View>

        {/* 🤖 LAYER 3: AI PRELIMINARY INSIGHTS */}
        <View style={styles.aiReferenceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle}>AI Preliminary Context</Text>
          </View>
          
          <Text style={styles.aiBody}>
            {caseData?.aiAnalysis?.summary || "AI analysis not available."}
          </Text>
          
          <TouchableOpacity style={styles.aiActionLink} onPress={() => handlePreview('ai')}>
            <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
            <Text style={styles.aiActionText}>View AI Data Analysis</Text>
          </TouchableOpacity>
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
  
  verdictCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, ...SHADOWS.soft, borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginBottom: 20 },
  cmoCard: { borderLeftColor: '#4338CA', backgroundColor: '#F5F7FF' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontWeight: '800', fontSize: 11, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  mainVerdict: { fontWeight: '700', fontSize: 17, color: '#1E293B', lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15 },
  label: { fontWeight: '700', fontSize: 10, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  bodyText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  
  previewBtn: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  previewBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  
  aiReferenceCard: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  aiBody: { fontSize: 13, color: '#64748B', marginVertical: 8, lineHeight: 20, fontStyle: 'italic' },
  aiActionLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  aiActionText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  
  pendingCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#F1F5F9', borderRadius: 20, marginBottom: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  pendingText: { marginLeft: 10, color: '#94A3B8', fontWeight: '600', fontSize: 13 }
});