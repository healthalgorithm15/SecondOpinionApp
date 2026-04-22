import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, ScrollView, ActivityIndicator, TextInput, 
  StyleSheet, TouchableOpacity, KeyboardAvoidingView, 
  Platform, Modal, Animated, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- DESIGN SYSTEM ---
import AuthLayout from '../../../components/AuthLayout';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { doctorService } from '../../../services/doctorService';
import { storage } from '@/utils/storage';
import { COLORS, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../../constants/theme';
import { STRINGS } from '../../../constants/Strings';

export default function DoctorReviewDetail() {
  const { caseId, mode } = useLocalSearchParams(); // 'mode' is 'approve' for CMOs
  const router = useRouter();
  const isApprovalMode = mode === 'approve';
  
  // --- DATA & UI STATES ---
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Unified Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'success' as 'success' | 'error',
    onConfirm: () => {}
  });

  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      const role = await storage.getItem('userRole');
      setUserRole(role?.toLowerCase() || null);
      fetchDetail();
    };
    init();
  }, [caseId]);

  const fetchDetail = async () => {
    try {
      const id = Array.isArray(caseId) ? caseId[0] : caseId;
      const res = await doctorService.getCaseDetails(id as string); 
      if (res.success) {
        setCaseData(res.data);
        // Pre-fill if findings exist (essential for CMO to edit specialist's notes)
        if (res.data.doctorOpinion) {
          setDiagnosis(res.data.doctorOpinion.finalVerdict || '');
          setSummary(res.data.doctorOpinion.recommendations || '');
        }
      }
    } catch (error) {
      showAppAlert(STRINGS.common.appName, "Could not load case details.");
    } finally {
      setLoading(false);
    }
  };

  const showAppAlert = (title: string, message: string, type: 'success' | 'error' = 'error', onConfirm?: () => void) => {
    setModalConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setModalVisible(false))
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim() || !summary.trim()) {
      return showAppAlert(STRINGS.common.appName, "All clinical fields are required.");
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isApprovalMode) {
        // 🏁 CMO APPROVAL FLOW
        res = await doctorService.cmoApproveCase(caseId as string, {
          updatedVerdict: diagnosis,
          updatedRecommendations: summary,
          cmoPrivateNote: "Approved via Mobile Command"
        });
      } else {
        // 🧪 SPECIALIST SUBMISSION FLOW
        res = await doctorService.submitAnalysis(caseId as string, {
          diagnosis,
          summary
        });
      }

      if (res.success) {
        showAppAlert(
          STRINGS.common.appName, 
          isApprovalMode ? "Report finalized and published." : "Analysis submitted to CMO.", 
          'success',
          () => router.replace('/(tabs)/doctor/doctor-home')
        );
      }
    } catch (error) {
      showAppAlert(STRINGS.common.appName, "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AuthLayout 
      title={isApprovalMode ? "Final Approval" : "Specialist Review"}
      subtitle={`Case: ${caseData?.patientId?.name || '...'}`}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* 🔍 STATUS BANNER (CMO ONLY) */}
          {isApprovalMode && (
            <View style={styles.approvalBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#4338CA" />
              <Text style={styles.approvalBannerText}>
                You are reviewing the Specialist's draft. You can edit before publishing.
              </Text>
            </View>
          )}

          {/* 📎 ATTACHMENTS LIST */}
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
                  <Text style={styles.fileTypeText}>{record.contentType?.includes('pdf') ? 'Medical PDF' : 'Imaging/Scan'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} opacity={0.5} />
              </TouchableOpacity>
            ))}
          </View>

          {/* AI INSIGHTS */}
          <View style={styles.glassCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>PRELIMINARY AI ANALYSIS</Text>
            </View>
            <Text style={[TYPOGRAPHY.body, styles.aiBodyText]}>
              {caseData?.aiAnalysis?.summary || "No AI summary available."}
            </Text>
          </View>

          {/* CLINICAL INPUTS */}
          <View style={styles.inputSection}>
            <Text style={[TYPOGRAPHY.boldText, styles.label]}>
              {isApprovalMode ? "FINAL VERDICT" : "DIAGNOSIS / CLINICAL VERDICT"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter final diagnosis..."
              value={diagnosis}
              onChangeText={setDiagnosis}
            />

            <Text style={[TYPOGRAPHY.boldText, styles.label]}>
              {isApprovalMode ? "FINAL RECOMMENDATIONS" : "RECOMMENDED NEXT STEPS"}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter recommendations for the patient..."
              multiline
              value={summary}
              onChangeText={setSummary}
            />

            <PrimaryButton 
              title={isApprovalMode ? "Approve & Publish Report" : "Submit to CMO"}
              onPress={handleSubmit}
              loading={isSubmitting}
              style={{ backgroundColor: isApprovalMode ? "#4F46E5" : COLORS.primary }}
            />
            
            <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL SYSTEM (Inherited from your original design) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleValue }] }]}>
            <Ionicons 
               name={modalConfig.type === 'success' ? "checkmark-circle" : "alert-circle"} 
               size={50} 
               color={modalConfig.type === 'success' ? COLORS.secondary : '#EF4444'} 
            />
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalSubtitle}>{modalConfig.message}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: modalConfig.type === 'success' ? COLORS.primary : '#EF4444' }]} 
              onPress={() => { setModalVisible(false); modalConfig.onConfirm(); }}
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
  fileTypeText: { color: '#64748B', fontSize: 11, marginTop: 2 },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
  input: { backgroundColor: '#FFF', borderRadius: BORDER_RADIUS.md, padding: 15, borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 20 },
  textArea: { height: 120, textAlignVertical: 'top' },
  cancelLink: { marginTop: 15, alignItems: 'center' },
  cancelText: { color: '#64748B', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: 'white', borderRadius: 24, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 15 },
  modalSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginVertical: 15 },
  modalButton: { paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold' }
});