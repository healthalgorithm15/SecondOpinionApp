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
import AuthLayout from '../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';

// Logic
import { patientService } from '../../services/patientService';

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
   * 📄 PDF Download & Share Logic
   */
  const handleDownloadPDF = async (type: 'ai' | 'doctor') => {
    setDownloading(type);

    try {
      const id = Array.isArray(caseId) ? caseId[0] : caseId;
      const endpoint = type === 'ai' ? 'pdf-ai' : 'pdf-doctor';
      const remoteUrl = `${process.env.EXPO_PUBLIC_API_URL}/patient/case/${endpoint}/${id}`;
      const token = await AsyncStorage.getItem('userToken');

      // 🌐 WEB BROWSER PATH
      if (Platform.OS === 'web') {
        const response = await fetch(remoteUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 200) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${type}_report_${id.slice(-6)}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return;
        } else {
          const errData = await response.json();
          throw new Error(errData.message || "Report pending or unavailable.");
        }
      }

      // 📱 MOBILE PATH (iOS/Android)
      const fs = FileSystem as any;
      // We prioritize cacheDirectory for better compatibility in Expo Go / Android
      const baseDir = fs.cacheDirectory || fs.documentDirectory;
      
      if (!baseDir) {
        throw new Error("Local storage directory not found.");
      }

      // Ensure directory exists
      const folderPath = `${baseDir}Reports/`;
      const folderInfo = await FileSystem.getInfoAsync(folderPath);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
      }

      const localUri = `${folderPath}${type}_report_${id.slice(-6)}.pdf`;

      // Execute Authenticated Download
      const downloadRes = await FileSystem.downloadAsync(remoteUrl, localUri, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (downloadRes.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Medical Report - ${type.toUpperCase()}`,
          });
        } else {
          Alert.alert("Saved", "PDF has been saved to your device cache.");
        }
      } else if (downloadRes.status === 400) {
        Alert.alert("Report Pending", "The specialist has not finalized this report yet.");
      } else {
        throw new Error(`Server error: ${downloadRes.status}`);
      }

    } catch (error: any) {
      console.error("❌ Download error:", error);
      Alert.alert("Download Failed", error.message || "An unexpected error occurred.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Building your report...</Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/patienthome')} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Summary</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <View style={styles.verdictCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}><Ionicons name="medkit" size={20} color={COLORS.white} /></View>
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

          <TouchableOpacity 
            style={[styles.downloadBtn, downloading === 'doctor' && { opacity: 0.7 }]} 
            onPress={() => handleDownloadPDF('doctor')}
            disabled={downloading !== null}
          >
            {downloading === 'doctor' ? <ActivityIndicator size="small" color={COLORS.white} /> : (
              <><Ionicons name="document-text" size={18} color={COLORS.white} /><Text style={styles.downloadBtnText}>Download Specialist PDF</Text></>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.aiReferenceCard}>
          <View style={styles.aiHeader}>
            <Ionicons name="hardware-chip-outline" size={16} color={COLORS.secondary} /><Text style={styles.aiTitle}>AI Preliminary Context</Text>
          </View>
          <Text style={styles.aiBody}>{caseData?.aiAnalysis?.summary || "AI analysis data unavailable."}</Text>
          <TouchableOpacity style={styles.aiDownloadBtn} onPress={() => handleDownloadPDF('ai')} disabled={downloading !== null}>
            {downloading === 'ai' ? <ActivityIndicator size="small" color={COLORS.secondary} /> : (
              <><Ionicons name="download-outline" size={16} color={COLORS.secondary} /><Text style={styles.aiDownloadText}>Download AI Report PDF</Text></>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textSub} />
          <Text style={styles.disclaimerText}>This is a clinical second opinion report. Always cross-reference these findings with your primary healthcare provider.</Text>
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...TYPOGRAPHY.body, color: COLORS.textSub, marginTop: 10 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  headerTitle: { ...TYPOGRAPHY.header, color: COLORS.primary },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  verdictCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.card, padding: 24, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: COLORS.textMain },
  mainVerdict: { fontWeight: '600', fontSize: 17, color: COLORS.primary, lineHeight: 26 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20, opacity: 0.5 },
  label: { fontWeight: 'bold', fontSize: 13, color: COLORS.secondary, textTransform: 'uppercase', marginBottom: 8 },
  bodyText: { fontSize: 15, color: COLORS.textMain, lineHeight: 22 },
  downloadBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginTop: 20, gap: 10 },
  downloadBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  aiReferenceCard: { marginTop: 20, backgroundColor: '#F8FAFB', borderRadius: BORDER_RADIUS.md, padding: 16, borderWidth: 1, borderColor: '#E1E8ED' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  aiTitle: { fontWeight: 'bold', fontSize: 12, color: COLORS.textSub },
  aiBody: { fontSize: 13, color: COLORS.textSub, lineHeight: 18 },
  aiDownloadBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 5, paddingVertical: 5 },
  aiDownloadText: { color: COLORS.secondary, fontWeight: '600', fontSize: 12 },
  disclaimerBox: { marginTop: 30, flexDirection: 'row', paddingHorizontal: 15, gap: 10, alignItems: 'center' },
  disclaimerText: { flex: 1, fontSize: 11, color: COLORS.textSub, lineHeight: 16 }
});