import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Your Components & Logic
import AuthLayout from '../../../components/AuthLayout';
import { doctorService } from '../../../services/doctorService';
import { COLORS } from '../../../constants/theme';

export default function DoctorReviewDetail() {
  const { caseId } = useLocalSearchParams();
  const router = useRouter();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 📝 Form States for the Doctor's Verdict
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
        }
      } catch (error) {
        console.error("Error fetching case for doctor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [caseId]);

  const handleSubmit = async () => {
    if (!diagnosis || !summary) {
      return Alert.alert("Required", "Please fill in both the diagnosis and clinical notes.");
    }

    setIsSubmitting(true);
    try {
      // Sends diagnosis and summary to match updated backend controller
      const res = await doctorService.submitAnalysis(caseId as string, {
        diagnosis,
        summary
      });

      if (res.success) {
        Alert.alert("Success", "Verdict submitted. Case is now closed.", [
          { text: "OK", onPress: () => router.replace('/(tabs)/doctor-home') }
        ]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{marginTop: 50}} color={COLORS.primary} />;

  return (
    <AuthLayout>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* 🔙 Navigation Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backText}>Back to Worklist</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Case Review: {caseId?.toString().slice(-6).toUpperCase()}
        </Text>

        {/* 👤 Patient Info Section (Data from your .populate call) */}
        <View style={styles.infoCard}>
          <Text style={styles.label}>Patient Details:</Text>
          <Text style={styles.infoText}>
            {caseData?.patientId?.name || "N/A"} • {caseData?.patientId?.age || "?"}y • {caseData?.patientId?.gender || "?"}
          </Text>
        </View>

        {/* 🤖 AI Results Section */}
        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>AI Preliminary Summary:</Text>
          <Text style={styles.aiBody}>{caseData?.aiAnalysis?.summary || "No AI summary available."}</Text>
          
          <Text style={[styles.aiLabel, { marginTop: 15 }]}>Detected Markers:</Text>
          {caseData?.aiAnalysis?.extractedMarkers?.map((m: string, i: number) => (
            <Text key={i} style={styles.markerText}>• {m}</Text>
          ))}
        </View>

        {/* 🏥 Doctor Input Form */}
        <View style={{ marginTop: 25 }}>
          <Text style={styles.formLabel}>Clinical Verdict</Text>
          <TextInput
            placeholder="Final Diagnosis"
            style={styles.input}
            value={diagnosis}
            onChangeText={setDiagnosis}
          />
          <TextInput
            placeholder="Clinical recommendations and notes for the patient..."
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            multiline
            value={summary}
            onChangeText={setSummary}
          />

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Finalize & Send to Patient</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backText: { color: COLORS.primary, marginLeft: 5, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textMain },
  infoCard: { marginTop: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15 },
  label: { fontSize: 14, color: COLORS.textSub, marginBottom: 4 },
  infoText: { fontSize: 18, fontWeight: '600', color: COLORS.textMain },
  aiCard: { marginTop: 20, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  aiLabel: { fontWeight: 'bold', color: COLORS.secondary, fontSize: 14 },
  aiBody: { marginTop: 5, color: COLORS.textMain, lineHeight: 20 },
  markerText: { color: COLORS.textMain, marginTop: 2 },
  formLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 15 },
  submitBtn: { backgroundColor: COLORS.secondary, padding: 18, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});