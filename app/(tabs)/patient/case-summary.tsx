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
  const { caseId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<'ai' | 'doctor' | null>(null);
  const [caseData, setCaseData] = useState<any>(null);

  useEffect(() => {
    const fetchFullResults = async () => {
      try {
        const id = Array.isArray(caseId) ? caseId[0] : caseId;
        const res = await patientService.getCaseStatus(id);
        if (res.success) {
          setCaseData(res.data);
        }
      } catch (error) {
        console.error("❌ Error loading results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullResults();
  }, [caseId]);

  /**
   * 📄 NAVIGATION PREVIEW
   * Transitions to the DocumentViewScreen for in-app viewing.
   */
  const handlePreview = (type: 'ai' | 'doctor') => {
    const id = Array.isArray(caseId) ? caseId[0] : caseId;
    const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
    router.push({
      pathname: '/view/DocumentViewScreen',
      params: { docId: `${endpoint}/${id}`, fileName: `${type.toUpperCase()} Report` }
    } as any);
  };

  /**
   * 🚀 PRODUCTION-READY DOWNLOAD & SHARE
   * Fixes "Blank Screen" by downloading locally before opening native viewer.
   */
  const handleDownloadPDF = async (type: 'ai' | 'doctor') => {
    setDownloading(type);
    try {
      const id = Array.isArray(caseId) ? caseId[0] : caseId;
      const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
      
      const remoteUrl = patientService.getRecordFileUrl(`${endpoint}/${id}`);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) throw new Error("Session expired. Please log in again.");

      // --- 🌐 WEB HANDLER ---
      if (Platform.OS === 'web') {
        const response = await fetch(remoteUrl, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!response.ok) throw new Error("Could not fetch the PDF stream.");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.body.appendChild(document.createElement('a'));
        a.href = url;
        a.download = `Report_${type}_${id.slice(-6)}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      // --- 📱 MOBILE HANDLER (iOS/Android) ---
      // Fixes TS2339 by casting FileSystem to bypass inaccurate type definitions
      const fs: any = FileSystem;
      const baseDir = fs.documentDirectory || fs.cacheDirectory;

      if (!baseDir) {
        throw new Error("Local storage is unavailable on this device.");
      }

      const localUri = `${baseDir}${type}_report_${id.slice(-6)}.pdf`;

      const downloadRes = await FileSystem.downloadAsync(remoteUrl, localUri, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (downloadRes.status !== 200) {
        throw new Error("Report is still being generated or is unavailable.");
      }

      // Check if sharing is available and open the native system sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${type.toUpperCase()} Report`,
          UTI: 'com.adobe.pdf', // Critical for iOS QuickLook preview
        });
      } else {
        Alert.alert("Notice", "Sharing is not supported on this device.");
      }
    } catch (error: any) {
      console.error("Download Error:", error);
      Alert.alert("Error", error.message || "Could not retrieve the PDF.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color={COLORS.secondary} />
    </View>
  );

  return (
    <AuthLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/patient/patienthome')} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Summary</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* Specialist Results Section */}
        <View style={styles.verdictCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}><Ionicons name="medkit" size={20} color="#FFF" /></View>
            <Text style={styles.cardTitle}>Specialist Conclusion</Text>
          </View>
          
          <Text style={styles.mainVerdict}>
            {caseData?.doctorOpinion?.finalVerdict || "Expert review in progress"}
          </Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Recommendations</Text>
          <Text style={styles.bodyText}>
            {caseData?.doctorOpinion?.recommendations || "Your specialist is finalizing their advice..."}
          </Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.previewBtn} 
              onPress={() => handlePreview('doctor')}
            >
              <Text style={styles.previewBtnText}>Open In-App Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => handleDownloadPDF('doctor')}
              disabled={downloading !== null}
            >
              {downloading === 'doctor' ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color="#FFF" style={{marginRight: 8}} />
                  <Text style={styles.downloadBtnText}>Save or Share PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Analysis Section */}
        <View style={styles.aiReferenceCard}>
          <Text style={styles.aiTitle}>AI Preliminary Context</Text>
          <Text style={styles.aiBody}>
            {caseData?.aiAnalysis?.summary || "Initial AI processing complete."}
          </Text>
          
          <View style={styles.aiButtonGroup}>
            <TouchableOpacity onPress={() => handlePreview('ai')}>
              <Text style={styles.aiActionText}>View AI PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleDownloadPDF('ai')}>
              {downloading === 'ai' ? (
                 <ActivityIndicator size="small" color={COLORS.secondary} />
              ) : (
                <Text style={styles.aiActionText}>Save AI PDF</Text>
              )}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { ...TYPOGRAPHY.header, color: COLORS.primary },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft },
  verdictCard: { backgroundColor: '#FFF', borderRadius: BORDER_RADIUS.card, padding: 20, ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  mainVerdict: { fontWeight: '600', fontSize: 17, color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  label: { fontWeight: 'bold', fontSize: 12, color: COLORS.secondary, marginBottom: 5 },
  bodyText: { fontSize: 14, color: '#444', lineHeight: 20 },
  buttonGroup: { marginTop: 20, gap: 10 },
  previewBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  previewBtnText: { color: COLORS.primary, fontWeight: 'bold' },
  downloadBtn: { 
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  downloadBtnText: { color: '#FFF', fontWeight: 'bold' },
  aiReferenceCard: { marginTop: 20, backgroundColor: '#F1F5F9', padding: 18, borderRadius: 16 },
  aiTitle: { fontWeight: 'bold', fontSize: 12, color: '#64748B', textTransform: 'uppercase' },
  aiBody: { fontSize: 13, color: '#475569', marginVertical: 10, lineHeight: 18 },
  aiButtonGroup: { flexDirection: 'row', gap: 20, marginTop: 5 },
  aiActionText: { color: COLORS.secondary, fontWeight: '800', fontSize: 13 }
});