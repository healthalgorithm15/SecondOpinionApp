import React, { useEffect, useState, useCallback } from 'react';
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

  /**
   * 🔄 Fetch Full Case Data on Mount
   */
  useEffect(() => {
    const fetchFullResults = async () => {
      try {
        const id = Array.isArray(caseId) ? caseId[0] : caseId;
        const res = await patientService.getCaseStatus(id);
        if (res.success) {
          setCaseData(res.data);
        } else {
          Alert.alert("Error", "Could not fetch report data.");
        }
      } catch (error) {
        console.error("❌ Error loading results:", error);
        Alert.alert("Error", "Could not load the final report.");
      } finally {
        setLoading(false);
      }
    };
    fetchFullResults();
  }, [caseId]);

  /**
   * 👁️ Internal Preview Logic
   * Navigates to DocumentViewScreen with explicit 'patient' role context.
   */
  const handlePreview = (type: 'ai' | 'doctor') => {
    const id = Array.isArray(caseId) ? caseId[0] : caseId;
    const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
    
    router.push({
      pathname: '/view/DocumentViewScreen',
      params: {
        docId: `${endpoint}/${id}`, 
        fileName: `${type.toUpperCase()} Report`,
        contentType: 'application/pdf',
        role: 'patient' // Explicitly set for patient file
      }
    } as any);
  };

  /**
   * 📄 PDF Download & Share Logic
   * Uses the correct /api/patient/ endpoint for the download request.
   */
  const handleDownloadPDF = async (type: 'ai' | 'doctor') => {
    setDownloading(type);

    try {
      const id = Array.isArray(caseId) ? caseId[0] : caseId;
      const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
      
      // ✅ Ensure this matches the patient-specific API path
      const remoteUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/patient/case/${endpoint}/${id}`;
      const token = await AsyncStorage.getItem('userToken');

      if (!token) throw new Error("Session expired. Please log in again.");

      // --- 🌐 WEB PATH ---
      if (Platform.OS === 'web') {
        const response = await fetch(remoteUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.body.appendChild(document.createElement('a'));
          link.href = url;
          link.download = `${type}_report_${id.slice(-6)}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
          return;
        }
        throw new Error("Report not ready.");
      }

      // --- 📱 MOBILE PATH (iOS/Android) ---
      const fs = FileSystem as any;
      const baseDir = fs.cacheDirectory || fs.documentDirectory;
      
      if (!baseDir) throw new Error("Storage directory unavailable.");

      const filename = `${type}_report_${id.slice(-6)}.pdf`;
      const localUri = `${baseDir}${filename}`;

      const downloadRes = await FileSystem.downloadAsync(remoteUrl, localUri, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/pdf',
            UTI: 'com.adobe.pdf',
            dialogTitle: `Medical Report - ${type.toUpperCase()}`,
          });
        }
      } else {
        throw new Error("Access denied or report generation in progress.");
      }

    } catch (error: any) {
      Alert.alert("Download Failed", error.message);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Building your report...</Text>
      </View>
    );
  }

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

        {/* Doctor Review Section */}
        <View style={styles.verdictCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="medkit" size={20} color={COLORS.white} />
            </View>
            <Text style={styles.cardTitle}>Specialist Conclusion</Text>
          </View>

          <Text style={styles.mainVerdict}>
            {caseData?.doctorOpinion?.finalVerdict || "Verdict pending specialist review."}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Clinical Recommendations</Text>
          <Text style={styles.bodyText}>
            {caseData?.doctorOpinion?.recommendations || "No specific recommendations provided."}
          </Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.previewBtn} onPress={() => handlePreview('doctor')}>
              <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
              <Text style={styles.previewBtnText}>View Full Report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.downloadBtn, downloading === 'doctor' && { opacity: 0.7 }]} 
              onPress={() => handleDownloadPDF('doctor')}
              disabled={downloading !== null}
            >
              {downloading === 'doctor' ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color={COLORS.white} />
                  <Text style={styles.downloadBtnText}>Share PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Analysis Section */}
        <View style={styles.aiReferenceCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="hardware-chip-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.aiTitle}>AI Preliminary Context</Text>
          </View>
          <Text style={styles.aiBody}>
            {caseData?.aiAnalysis?.summary || "AI analysis data unavailable."}
          </Text>
          
          <View style={styles.aiButtonGroup}>
             <TouchableOpacity style={styles.aiActionBtn} onPress={() => handlePreview('ai')}>
               <Ionicons name="eye-outline" size={16} color={COLORS.secondary} />
               <Text style={styles.aiActionText}>View</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               style={styles.aiActionBtn} 
               onPress={() => handleDownloadPDF('ai')}
               disabled={downloading !== null}
             >
               {downloading === 'ai' ? (
                 <ActivityIndicator size="small" color={COLORS.secondary} />
               ) : (
                 <>
                   <Ionicons name="download-outline" size={16} color={COLORS.secondary} />
                   <Text style={styles.aiActionText}>Download</Text>
                 </>
               )}
             </TouchableOpacity>
          </View>
        </View>

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSub} />
          <Text style={styles.disclaimerText}>
            This is a clinical second opinion. Always consult your primary doctor.
          </Text>
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSub, marginTop: 10 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  headerTitle: { ...TYPOGRAPHY.header, color: COLORS.primary },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  verdictCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.card, padding: 24, ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: COLORS.textMain },
  mainVerdict: { fontWeight: '600', fontSize: 17, color: COLORS.primary, lineHeight: 26 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20, opacity: 0.5 },
  label: { fontWeight: 'bold', fontSize: 13, color: COLORS.secondary, textTransform: 'uppercase', marginBottom: 8 },
  bodyText: { fontSize: 15, color: COLORS.textMain, lineHeight: 22 },
  buttonGroup: { marginTop: 20, gap: 10 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, gap: 10 },
  previewBtnText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  downloadBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 10 },
  downloadBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  aiReferenceCard: { marginTop: 20, backgroundColor: '#F8FAFB', borderRadius: BORDER_RADIUS.md, padding: 16, borderWidth: 1, borderColor: '#E1E8ED' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { fontWeight: 'bold', fontSize: 12, color: COLORS.textSub },
  aiBody: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
  aiButtonGroup: { flexDirection: 'row', gap: 20, marginTop: 12 },
  aiActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5 },
  aiActionText: { color: COLORS.secondary, fontWeight: '600', fontSize: 12 },
  disclaimerBox: { marginTop: 30, flexDirection: 'row', paddingHorizontal: 15, gap: 10, alignItems: 'center' },
  disclaimerText: { flex: 1, fontSize: 11, color: COLORS.textSub, lineHeight: 16 }
});