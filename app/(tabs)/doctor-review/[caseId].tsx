import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// --- DESIGN SYSTEM ---
import AuthLayout from '../../../components/AuthLayout';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { doctorService } from '../../../services/doctorService';
import { COLORS, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../../constants/theme';
import { STRINGS } from '../../../constants/Strings';

export default function DoctorReviewDetail() {
  const { caseId } = useLocalSearchParams();
  const router = useRouter();
  
  // Data States
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (modalVisible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [modalVisible]);

  const showAppAlert = (title: string, message: string, type: 'success' | 'error' = 'error', onConfirm?: () => void) => {
    setModalConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setModalVisible(false))
    });
    setModalVisible(true);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const id = Array.isArray(caseId) ? caseId[0] : caseId;
        const res = await doctorService.getCaseDetails(id as string); 
        if (res.success) {
          setCaseData(res.data);
          // If already has doctor findings (history view)
          if (res.data.doctorOpinion) {
            setDiagnosis(res.data.doctorOpinion.finalVerdict || '');
            setSummary(res.data.doctorOpinion.recommendations || '');
          }
        }
      } catch (error) {
        showAppAlert(STRINGS.common.appName, STRINGS.validation.networkError);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [caseId]);

  /**
   * 👁️ Updated: Handle Viewing individual attachments internally
   */
  const handleViewSpecificFile = (record: any) => {
    const recordId = record?._id || record;
    const contentType = record?.contentType || 'application/pdf';

    if (!recordId) {
      return showAppAlert(STRINGS.common.appName, "No medical record ID found.");
    }

    // Navigating to the shared DocumentViewScreen
    router.push({
      pathname: '/view/DocumentViewScreen', 
      params: { 
        docId: recordId, 
        fileName: caseData?.patientId?.name || 'Medical Record',
        contentType: contentType, // 🚀 Prevents the "Corrupted" error
        role: 'doctor' 
      }
    } as any);
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim() || !summary.trim()) {
      return showAppAlert(STRINGS.common.appName, "Clinical findings and diagnosis are required.");
    }

    setIsSubmitting(true);
    try {
      const res = await doctorService.submitAnalysis(caseId as string, {
        diagnosis,
        summary
      });

      if (res.success) {
        showAppAlert(
          STRINGS.common.appName, 
          STRINGS.doctor.caseClosed, 
          'success',
          () => router.replace('/(tabs)/doctor/doctor-home')
        );
      }
    } catch (error) {
      showAppAlert(STRINGS.common.appName, "Failed to submit review.");
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
      title={`Review: ${caseId?.toString().slice(-6).toUpperCase()}`}
      subtitle={caseData?.patientId?.name}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* 📎 ATTACHMENTS LIST */}
          <View style={styles.attachmentSection}>
            <Text style={styles.sectionLabel}>PATIENT ATTACHMENTS</Text>
            {caseData?.recordIds && caseData.recordIds.length > 0 ? (
              caseData.recordIds.map((record: any, index: number) => (
                <TouchableOpacity 
                  key={record._id || index} 
                  style={styles.fileButton} 
                  onPress={() => handleViewSpecificFile(record)}
                >
                  <Ionicons 
                    name={record.contentType?.includes('pdf') ? "document-text" : "image"} 
                    size={20} 
                    color={COLORS.primary} 
                  />
                  <View style={styles.fileButtonTextContainer}>
                    <Text style={styles.fileButtonText}>
                      View Attachment {caseData.recordIds.length > 1 ? `#${index + 1}` : ''}
                    </Text>
                    <Text style={styles.fileTypeText}>
                      {record.contentType?.includes('pdf') ? 'PDF Document' : 'Image File'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.primary} opacity={0.5} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noFilesText}>No attachments found for this case.</Text>
            )}
          </View>

          {/* AI INSIGHTS CARD */}
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

          {/* DOCTOR INPUTS */}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* DYNAMIC APP MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleValue }] }]}>
            <View style={[styles.iconCircle, { backgroundColor: modalConfig.type === 'success' ? 'rgba(30, 125, 117, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <Ionicons 
                name={modalConfig.type === 'success' ? "checkmark-done" : "warning-outline"} 
                size={40} 
                color={modalConfig.type === 'success' ? COLORS.secondary : '#EF4444'} 
              />
            </View>
            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalSubtitle}>{modalConfig.message}</Text>
            
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: modalConfig.type === 'success' ? COLORS.primary : '#EF4444' }]} 
              onPress={() => {
                setModalVisible(false);
                modalConfig.onConfirm();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgScreen },
  
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
  noFilesText: { color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: 10 },

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
  cancelText: { color: COLORS.textSub, fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 25, alignItems: 'center', ...SHADOWS.soft },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...TYPOGRAPHY.header, color: COLORS.primary, fontSize: 20, marginBottom: 10 },
  modalSubtitle: { ...TYPOGRAPHY.body, color: COLORS.textSub, textAlign: 'center', marginBottom: 25 },
  modalButton: { paddingVertical: 14, borderRadius: BORDER_RADIUS.md, width: '100%', alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});