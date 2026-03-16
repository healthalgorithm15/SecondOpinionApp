import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  ActivityIndicator, TouchableOpacity, Alert,
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Design System
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../../constants/theme';

// Logic
import { patientService } from '../../../services/patientService';

export default function CaseSummary() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const caseId = Array.isArray(params.caseId) ? params.caseId[0] : params.caseId;

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'ai' | 'doctor' | null>(null);
  const [caseData, setCaseData] = useState<any>(null);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    fetchFullResults();
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
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (type: 'ai' | 'doctor') => {
    if (!caseId) return;
    const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
    
    router.push({
      pathname: '/view/DocumentViewScreen' as any,
      params: { 
        docId: `${endpoint}/${caseId}`, 
        fileName: `${type.toUpperCase()} Report.pdf`,
        contentType: 'application/pdf',
        role: 'patient'
      }
    });
  };

  const handleDownloadPDF = async (type: 'ai' | 'doctor') => {
    if (!caseId) return;
    setDownloading(type);

    try {
      const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
      const remoteUrl = patientService.getRecordFileUrl(`${endpoint}/${caseId}`);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) throw new Error("Authentication token missing.");

      if (Platform.OS === 'web') {
        const response = await fetch(remoteUrl, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${caseId.slice(-6)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      // --- MOBILE LOGIC ---
      // ✅ FIX: Cast FileSystem as any to bypass the 'cacheDirectory' type error
      const fs: any = FileSystem;
      const baseDir = fs.cacheDirectory || fs.documentDirectory;
      const filename = `${type}_report_${caseId.slice(-6)}.pdf`;
      const fileUri = `${baseDir}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(remoteUrl, fileUri, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (downloadResult.status !== 200) {
        throw new Error("PDF generation in progress.");
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Praman AI: ${type.toUpperCase()} Report`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (error: any) {
      Alert.alert("Notice", error.message || "Could not retrieve the PDF.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <AuthLayout title="Report Summary" subtitle="Clinical Verdict">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/patient' as any)} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Summary</Text>
          <TouchableOpacity onPress={fetchFullResults} style={styles.refreshBtn}>
             <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.verdictCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}><Ionicons name="medkit" size={20} color="#FFF" /></View>
            <Text style={styles.cardTitle}>Expert Conclusion</Text>
          </View>
          
          <Text style={styles.mainVerdict}>
            {caseData?.doctorOpinion?.finalVerdict || "Clinical review in progress..."}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Recommendations</Text>
          <Text style={styles.bodyText}>
            {caseData?.doctorOpinion?.recommendations || "Your specialist is finalizing your medical roadmap."}
          </Text>
          
          {caseData?.doctorOpinion?.finalVerdict && (
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.previewBtn} onPress={() => handlePreview('doctor')}>
                <Text style={styles.previewBtnText}>In-App Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.downloadBtn} 
                onPress={() => handleDownloadPDF('doctor')}
                disabled={!!downloading}
              >
                {downloading === 'doctor' ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="share-social-outline" size={18} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.downloadBtnText}>Save or Share PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.aiReferenceCard}>
          <Text style={styles.aiTitle}>AI Preliminary Context</Text>
          <Text style={styles.aiBody}>
            {caseData?.aiAnalysis?.summary || "AI automated screening complete."}
          </Text>
          
          <View style={styles.aiButtonGroup}>
            <TouchableOpacity onPress={() => handlePreview('ai')}>
              <Text style={styles.aiActionText}>View AI PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDownloadPDF('ai')} disabled={!!downloading}>
               {downloading === 'ai' ? <ActivityIndicator size="small" color={COLORS.secondary} /> : <Text style={styles.aiActionText}>Save AI PDF</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  closeBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0F9F8', justifyContent: 'center', alignItems: 'center' },
  verdictCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontWeight: '700', fontSize: 16, color: COLORS.secondary },
  mainVerdict: { fontWeight: '700', fontSize: 18, color: COLORS.primary, lineHeight: 24 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  label: { fontWeight: '700', fontSize: 12, color: COLORS.textSub, marginBottom: 8, textTransform: 'uppercase' },
  bodyText: { fontSize: 15, color: '#334155', lineHeight: 22 },
  buttonGroup: { marginTop: 25, gap: 12 },
  previewBtn: { padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center' },
  previewBtnText: { color: COLORS.primary, fontWeight: '700' },
  downloadBtn: { padding: 16, borderRadius: 16, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  downloadBtnText: { color: '#FFF', fontWeight: '700' },
  aiReferenceCard: { marginTop: 24, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  aiTitle: { fontWeight: '700', fontSize: 11, color: '#64748B', textTransform: 'uppercase' },
  aiBody: { fontSize: 14, color: '#475569', marginVertical: 12, lineHeight: 20 },
  aiButtonGroup: { flexDirection: 'row', gap: 24, marginTop: 8 },
  aiActionText: { color: COLORS.secondary, fontWeight: '700', fontSize: 14 }
});