import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, ScrollView, ActivityIndicator, TextInput, 
  StyleSheet, TouchableOpacity, KeyboardAvoidingView, 
  Platform, Modal, Animated, Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- DESIGN SYSTEM ---
import AuthLayout from '../../../components/AuthLayout';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { doctorService } from '../../../services/doctorService';
import { COLORS, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../../constants/theme';

export default function DoctorReviewDetail() {
  const { caseId, mode } = useLocalSearchParams(); 
  const router = useRouter();
  const isApprovalMode = mode === 'approve';
  
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // States for data handling
  const [specialistVerdict, setSpecialistVerdict] = useState(''); // Read-only reference for CMO
  const [specialistSummary, setSpecialistSummary] = useState(''); // Read-only reference for CMO
  const [diagnosis, setDiagnosis] = useState(''); // Editable field
  const [summary, setSummary] = useState('');     // Editable field
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status-based logic
  const isReadOnly = caseData?.status === 'published' || caseData?.status === 'completed';
  
  // Logic: Show button only if the role matches the current pending state
  const canShowSubmit = !isReadOnly && (
    (isApprovalMode && caseData?.status === 'PENDING_CMO_APPROVAL') ||
    (!isApprovalMode && caseData?.status === 'PENDING_DOCTOR')
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '', message: '', type: 'success' as 'success' | 'error', onConfirm: () => {}
  });

  const scaleValue = useRef(new Animated.Value(0)).current;

  // Optimized Fetch to prevent flicker
  useEffect(() => { 
    if (caseId) fetchDetail(); 
  }, [caseId]);

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [modalVisible]);

  const fetchDetail = async () => {
    try {
      setLoading(true); // Ensure loading is explicit
      const id = Array.isArray(caseId) ? caseId[0] : caseId;
      const res = await doctorService.getCaseDetails(id as string); 
      
      if (res.success) {
        // Step 1: Set case data
        setCaseData(res.data);
        
        // Step 2: Extract and set opinion states before ending loading
        if (res.data.doctorOpinion) {
          const docDiagnosis = res.data.doctorOpinion.diagnosis || res.data.doctorOpinion.finalVerdict || '';
          const docSummary = res.data.doctorOpinion.summary || res.data.doctorOpinion.recommendations || '';
          
          setSpecialistVerdict(docDiagnosis); 
          setSpecialistSummary(docSummary);
          setDiagnosis(docDiagnosis);
          setSummary(docSummary);
        }
      }
    } catch (error) {
      showAppAlert("Error", "Could not load case details.");
    } finally {
      // Small delay ensures state is fully applied to the UI tree before spinner hides
      setTimeout(() => setLoading(false), 100);
    }
  };

  const showAppAlert = (title: string, message: string, type: 'success' | 'error' = 'error', onConfirm?: () => void) => {
    setModalConfig({
      title, message, type,
      onConfirm: () => {
        setModalVisible(false);
        if (onConfirm) onConfirm();
      }
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    Keyboard.dismiss(); // Prevent keyboard-related UI glitches during submission
    if (!diagnosis.trim() || !summary.trim()) {
      return showAppAlert("Required", "Please fill in all clinical fields.");
    }

    setIsSubmitting(true);
    try {
      const id = Array.isArray(caseId) ? caseId[0] : caseId;
      let res;
      
      if (isApprovalMode) {
        res = await doctorService.cmoApproveCase(id as string, {
          updatedVerdict: diagnosis,
          updatedRecommendations: summary,
          cmoPrivateNote: "Verified and published by CMO"
        });
      } else {
        res = await doctorService.submitAnalysis(id as string, {
          diagnosis,
          summary
        });
      }

      if (res.success) {
        showAppAlert(
          "Success", 
          isApprovalMode ? "Report published to patient." : "Analysis sent to CMO.", 
          'success',
          () => router.replace('/(tabs)/doctor/doctor-home')
        );
      }
    } catch (error) {
      showAppAlert("Error", "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: '#64748B' }}>Loading Case Data...</Text>
      </View>
    );
  }

  return (
    <AuthLayout 
      title={isApprovalMode ? "CMO Final Approval" : "Specialist Review"}
      subtitle={`Case: ${caseData?.patientId?.name || '...'}`}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* BANNER STATUS */}
          {isReadOnly ? (
            <View style={[styles.approvalBanner, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
              <Ionicons name="checkmark-done-circle" size={20} color="#047857" />
              <Text style={[styles.approvalBannerText, { color: '#047857' }]}>
                This case has been published to the patient.
              </Text>
            </View>
          ) : isApprovalMode && (
            <View style={styles.approvalBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#4338CA" />
              <Text style={styles.approvalBannerText}>
                Reviewing Specialist's draft. You can refine or add your own notes below.
              </Text>
            </View>
          )}

          {/* PATIENT ATTACHMENTS */}
          <View style={styles.attachmentSection}>
            <Text style={styles.sectionLabel}>PATIENT ATTACHMENTS</Text>
            {caseData?.recordIds?.map((record: any, index: number) => (
              <TouchableOpacity 
                key={record._id || index} 
                style={styles.fileButton} 
                onPress={() => router.push({
                   pathname: '/view/DocumentViewScreen', 
                   params: { docId: record._id, fileName: caseData?.patientId?.name, contentType: record.contentType, role: 'doctor' }
                } as any)}
              >
                <Ionicons name={record.contentType?.includes('pdf') ? "document-text" : "image"} size={20} color={COLORS.primary} />
                <View style={styles.fileButtonTextContainer}>
                  <Text style={styles.fileButtonText}>View Record #{index + 1}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} opacity={0.5} />
              </TouchableOpacity>
            ))}
          </View>

          {/* AI ANALYSIS SECTION */}
          <View style={styles.glassCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>AI PRELIMINARY INSIGHTS</Text>
            </View>
            <Text style={[TYPOGRAPHY.body, styles.aiBodyText]}>
              {caseData?.aiAnalysis?.summary || "AI processing results not available."}
            </Text>
          </View>

          {/* INPUT SECTION */}
          <View style={styles.inputSection}>
            
            {/* 🟦 SPECIALIST REFERENCE (Visible only to CMO during Approval) */}
            {isApprovalMode && specialistVerdict !== '' && (
              <View style={styles.specialistRefBox}>
                <Text style={styles.refLabel}>SPECIALIST'S OPINION (READ-ONLY)</Text>
                <Text style={styles.refText}>{specialistVerdict}</Text>
                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 }} />
                <Text style={styles.refText}>{specialistSummary}</Text>
              </View>
            )}

            <Text style={[TYPOGRAPHY.boldText, styles.label]}>
              {isApprovalMode ? "FINAL VERDICT / CMO ADD-ONS" : "DIAGNOSIS / CLINICAL VERDICT"}
            </Text>
            
            {isReadOnly ? (
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>{diagnosis || "No verdict."}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Enter clinical diagnosis..."
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                placeholderTextColor="#94A3B8"
              />
            )}

            <Text style={[TYPOGRAPHY.boldText, styles.label]}>
              {isApprovalMode ? "FINAL RECOMMENDATIONS" : "RECOMMENDED NEXT STEPS"}
            </Text>
            
            {isReadOnly ? (
              <View style={[styles.readOnlyBox, styles.textAreaReadOnly]}>
                <Text style={styles.readOnlyText}>{summary || "No recommendations."}</Text>
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter steps for patient..."
                multiline
                value={summary}
                onChangeText={setSummary}
                placeholderTextColor="#94A3B8"
              />
            )}

            {canShowSubmit ? (
              <PrimaryButton 
                title={isApprovalMode ? "Approve & Publish Report" : "Submit Analysis to CMO"}
                onPress={handleSubmit}
                loading={isSubmitting}
                style={{ backgroundColor: isApprovalMode ? "#4F46E5" : COLORS.primary }}
              />
            ) : isReadOnly && (
              <View style={styles.statusBadge}>
                <Ionicons name="lock-closed" size={16} color="#64748B" />
                <Text style={styles.statusBadgeText}>Record Published & Locked</Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ALERT MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleValue }] }]}>
            <Ionicons 
                name={modalConfig.type === 'success' ? "checkmark-circle" : "alert-circle"} 
                size={50} 
                color={modalConfig.type === 'success' ? "#10B981" : '#EF4444'} 
            />
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalSubtitle}>{modalConfig.message}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: modalConfig.type === 'success' ? COLORS.primary : '#EF4444' }]} 
              onPress={modalConfig.onConfirm}
            >
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  approvalBanner: { 
    flexDirection: 'row', 
    backgroundColor: '#E0E7FF', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  approvalBannerText: { flex: 1, marginLeft: 10, fontSize: 12, color: '#4338CA', fontWeight: '600', lineHeight: 18 },
  attachmentSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 10 },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...SHADOWS.soft
  },
  fileButtonTextContainer: { flex: 1, marginLeft: 12 },
  fileButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  glassCard: {
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 10, color: COLORS.primary, fontWeight: '800', letterSpacing: 1 },
  aiBodyText: { color: '#334155', lineHeight: 22 },
  inputSection: { marginTop: 25 },
  label: { color: COLORS.primary, fontSize: 11, marginBottom: 8, letterSpacing: 1, fontWeight: '800' },
  specialistRefBox: {
    backgroundColor: '#F1F5F9',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 20
  },
  refLabel: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 5 },
  refText: { fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 18 },
  input: { backgroundColor: '#FFF', borderRadius: BORDER_RADIUS.md, padding: 15, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 20, color: '#1E293B' },
  textArea: { height: 120, textAlignVertical: 'top' },
  readOnlyBox: { backgroundColor: '#F8FAFC', borderRadius: BORDER_RADIUS.md, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  readOnlyText: { color: '#475569', fontSize: 14, lineHeight: 20 },
  textAreaReadOnly: { minHeight: 100 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#F1F5F9', borderRadius: 12 },
  statusBadgeText: { marginLeft: 6, color: '#64748B', fontWeight: '700', fontSize: 13 },
  cancelLink: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: '#64748B', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 24, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 15 },
  modalSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginVertical: 15 },
  modalButton: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold' }
});