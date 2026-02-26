import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

// --- YOUR DESIGN SYSTEM & COMPONENTS ---
import AuthLayout from '../../../components/AuthLayout';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { doctorService } from '../../../services/doctorService';
import { COLORS, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../../constants/theme';
import { STRINGS } from '../../../constants/Strings';

export default function DoctorReviewDetail() {
  const { caseId } = useLocalSearchParams();
  const router = useRouter();
  
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const id = Array.isArray(caseId) ? caseId[0] : caseId;
        const res = await doctorService.getCaseDetails(id as string); 
        if (res.success) {
          setCaseData(res.data);
          if (res.data.clinicalVerdict) {
            setDiagnosis(res.data.clinicalVerdict.diagnosis || '');
            setSummary(res.data.clinicalVerdict.notes || '');
          }
        }
      } catch (error) {
        Alert.alert(STRINGS.common.appName, STRINGS.validation.networkError);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [caseId]);

  const handleViewFile = async () => {
    const recordId = caseData?.recordId?._id || caseData?.recordId;
    if (!recordId) return Alert.alert(STRINGS.common.appName, "No file found.");
    
    const url = `${process.env.EXPO_PUBLIC_API_URL}/api/patient/record/view/${recordId}`;
    await WebBrowser.openBrowserAsync(url);
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim() || !summary.trim()) {
      return Alert.alert(STRINGS.common.appName, STRINGS.doctor.caseStats(0).includes('urgent') ? "Required fields missing" : "Please fill all fields");
    }

    setIsSubmitting(true);
    try {
      const res = await doctorService.submitAnalysis(caseId as string, {
        diagnosis,
        summary
      });

      if (res.success) {
        // 🏁 LANDING LOGIC: Back to Doctor Home after Success
        Alert.alert(
          STRINGS.common.appName, 
          STRINGS.doctor.caseClosed, 
          [{ text: "OK", onPress: () => router.replace('/(tabs)/doctor/doctor-home') }]
        );
      }
    } catch (error) {
      Alert.alert(STRINGS.common.appName, STRINGS.validation.networkError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[TYPOGRAPHY.body, { marginTop: 10 }]}>{STRINGS.common.loading}</Text>
      </View>
    );
  }

  return (
    <AuthLayout 
      title={`${STRINGS.status.caseSummary}: ${caseId?.toString().slice(-6).toUpperCase()}`}
      subtitle={caseData?.patientId?.name}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.fileButton} onPress={handleViewFile}>
            <Ionicons name="document-attach-outline" size={20} color={COLORS.primary} />
            <Text style={styles.fileButtonText}>{STRINGS.common.viewReport}</Text>
          </TouchableOpacity>

          <View style={styles.glassCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{STRINGS.doctor.aiInsights}</Text>
            </View>
            
            <Text style={[TYPOGRAPHY.body, styles.aiBodyText]}>
              {caseData?.aiAnalysis?.summary || STRINGS.doctor.emptySummary}
            </Text>

            <View style={styles.markerList}>
              {caseData?.aiAnalysis?.extractedMarkers?.map((marker: string, idx: number) => (
                <View key={idx} style={styles.markerChip}>
                  <Text style={styles.markerText}>{marker}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={[TYPOGRAPHY.boldText, styles.label]}>{STRINGS.doctor.diagnosisLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.doctor.diagnosisPlaceholder}
              placeholderTextColor="#94A3B8"
              value={diagnosis}
              onChangeText={setDiagnosis}
            />

            <Text style={[TYPOGRAPHY.boldText, styles.label]}>{STRINGS.doctor.notesLabel}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={STRINGS.doctor.notesPlaceholder}
              placeholderTextColor="#94A3B8"
              multiline
              value={summary}
              onChangeText={setSummary}
            />

            <PrimaryButton 
              title={STRINGS.doctor.submitVerdict}
              onPress={handleSubmit}
              loading={isSubmitting}
            />
            
            <TouchableOpacity 
              style={styles.cancelLink} 
              onPress={() => router.back()}
            >
              <Text style={styles.cancelText}>{STRINGS.common.cancel}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgScreen },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 93, 87, 0.08)',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(30, 93, 87, 0.2)',
    marginBottom: 20
  },
  fileButtonText: { color: COLORS.primary, fontFamily: 'Inter-SemiBold', marginLeft: 8 },
  glassCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.soft
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontWeight: '800' },
  aiBodyText: { color: COLORS.textMain, lineHeight: 22 },
  markerList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15 },
  markerChip: { backgroundColor: 'rgba(30, 93, 87, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  markerText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  inputSection: { marginTop: 25 },
  label: { color: COLORS.primary, fontSize: 11, marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: 'top' },
  cancelLink: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: COLORS.textSub, fontSize: 14 }
});