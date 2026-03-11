import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActivityIndicator, 
  View, 
  Alert, 
  Text, 
  StyleSheet, 
  Modal,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Import Custom UI Components
import { 
  PatientNewUI, 
  PatientExistingUI, 
  PatientLandingUI, 
  DoctorProfileDetail, 
  PaymentLearnMore 
} from '../../../components/patient'; 
import { patientService } from '../../../services/patientService';
import { COLORS, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../../constants/theme';

export default function PatientHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [hasError, setHasError] = useState(false);

  // 🚦 VIEW STATE: landing | upload | doctor | payment
  const [viewMode, setViewMode] = useState<'landing' | 'upload' | 'doctor' | 'payment'>('landing');
  
  // 📁 MEDICAL VAULT (HISTORY PICKER) STATE
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);

  /**
   * 🔄 Core Data Fetcher
   * Handles dashboard data and populates the medical vault
   */
  const fetchDashboard = useCallback(async () => {
    try {
      setHasError(false);
      setLoading(true);
      const res = await patientService.getDashboard();
      
      if (res?.success) {
        setData(res.data);
        
        // Auto-switch to upload view if there is an active review in progress
        if (res.data.activeCase) {
          setViewMode('upload');
        }

        // Fetch History for the Medical Vault Picker
        const historyRes = await patientService.getReviewHistory();
        if (historyRes.success) {
          // Extract individual reports from past completed cases
          const allDocs = historyRes.data
            .filter((c: any) => c.status === 'COMPLETED')
            .flatMap((caseItem: any) => caseItem.recordIds || []);
          setHistoryDocs(allDocs);
        }
      } else {
        setHasError(true);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setHasError(true);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // --- LOGIC HANDLERS ---

  const handleUploadPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      
      if (!result.canceled) {
        setUploading(true);
        const asset = result.assets[0];
        const res = await patientService.uploadRecord(
          asset.uri, 
          asset.name, 
          asset.mimeType || 'application/pdf'
        );
        if (res.success) fetchDashboard(); 
      }
    } catch (error) {
      setUploading(false);
      Alert.alert("Upload Error", "Could not upload the document.");
    }
  };

  const handleScanPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Denied", "Camera access needed.");
      
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled) {
        setUploading(true);
        const res = await patientService.uploadRecord(
          result.assets[0].uri, 
          'scan.jpg', 
          'image/jpeg'
        );
        if (res.success) fetchDashboard();
      }
    } catch (error) {
      setUploading(false);
    }
  };

  /**
   * 🟢 SCENARIO 4: REUSE FROM VAULT
   * Clones an old document into the current workspace
   */
  const handleReuseFromHistory = async (reportId: string) => {
    try {
      setIsHistoryModalOpen(false); 
      setUploading(true); 
      
      const res = await patientService.reuseRecord(reportId);
      
      if (res.success) {
        // Refreshing the dashboard will automatically trigger Scenario 2 (ExistingUI)
        await fetchDashboard(); 
      }
    } catch (error) {
      Alert.alert("Error", "Could not attach historical document.");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!data?.reports || data.reports.length === 0) return;
    const reportIds = data.reports.map((r: any) => r._id);
    const reportNames = data.reports.map((r: any) => r.fileName || "Medical Report");

    setUploading(true);
    try {
      const res = await patientService.submitForReview(reportIds);
      if (res.success) {
        router.push({
          pathname: '/(tabs)/patient/submission-confirmation',
          params: { caseId: res.caseId, reportNames: JSON.stringify(reportNames) }
        });
      }
    } catch (error) {
      Alert.alert("Error", "Could not start AI analysis.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      setUploading(true);
      const res = await patientService.deleteRecord(reportId);
      if (res.success) {
        await fetchDashboard();
        Alert.alert("Removed", "Draft deleted.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not delete draft.");
    } finally {
      setUploading(false);
    }
  };

  // --- UI COMPONENTS ---

  const StatusStepper = ({ currentCase }: { currentCase: any }) => (
    <View style={styles.statusCard}>
      <Text style={styles.statusHeader}>Case Active</Text>
      <Text style={styles.statusSub}>ID: {currentCase._id.slice(-6).toUpperCase()}</Text>
      
      <View style={styles.stepperContainer}>
        <StepItem icon="file-upload" label="Uploaded" completed />
        <StepItem icon="robot-outline" label="AI Check" active={currentCase.status === 'AI_PROCESSING'} completed={currentCase.status !== 'AI_PROCESSING'} />
        <StepItem icon="doctor" label="Expert" active={currentCase.status === 'PENDING_DOCTOR'} />
        <StepItem icon="check-circle-outline" label="Final" />
      </View>

      <TouchableOpacity style={styles.detailsBtn} onPress={() => router.push('/(tabs)/patient/history')}>
        <Text style={styles.detailsBtnText}>View My History</Text>
      </TouchableOpacity>
    </View>
  );

  const StepItem = ({ icon, label, completed, active }: any) => (
    <View style={styles.stepItem}>
      <View style={[styles.stepCircle, (completed || active) && { backgroundColor: COLORS.primary }]}>
        <MaterialCommunityIcons name={icon} size={20} color="white" />
      </View>
      <Text style={[styles.stepLabel, active && { color: COLORS.primary, fontWeight: '700' }]}>{label}</Text>
    </View>
  );

  if (loading && !uploading) {
    return (
      <View style={styles.centerMode}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      
      {/* 1. DISCOVERY VIEW */}
      {viewMode === 'landing' && (
        <PatientLandingUI 
          name={data?.name || "Patient"} 
          onStart={() => setViewMode('upload')}
          onViewDoctor={() => setViewMode('doctor')}
          onViewPayment={() => setViewMode('payment')}
        />
      )}

      {/* 2. FUNCTIONAL UPLOAD VIEW */}
      {viewMode === 'upload' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.inlineBack} onPress={() => setViewMode('landing')}>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.inlineBackText}>Back to Info</Text>
          </TouchableOpacity>

          {data?.activeCase ? (
            <StatusStepper currentCase={data.activeCase} />
          ) : (
            <>
              {data?.reports?.length > 0 ? (
                <PatientExistingUI 
                  name={data.name || "Patient"} 
                  reports={data.reports}
                  onContinue={handleContinue}
                  onUploadPDF={handleUploadPDF} 
                  onScanPhoto={handleScanPhoto}
                  onDeleteReport={handleDeleteReport}
                  onAddMore={handleUploadPDF} 
                />
              ) : (
                <View style={{ flex: 1 }}>
                  <PatientNewUI 
                    onUploadPDF={handleUploadPDF} 
                    onScanPhoto={handleScanPhoto} 
                  />
                  
                  {/* MEDICAL VAULT TRIGGER */}
                  <TouchableOpacity 
                    style={styles.historyTrigger}
                    onPress={() => setIsHistoryModalOpen(true)}
                  >
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.historyTriggerText}>Add from Medical Vault</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* DOCTOR & PAYMENT VIEWS */}
      {viewMode === 'doctor' && <DoctorProfileDetail onBack={() => setViewMode('landing')} />}
      {viewMode === 'payment' && <PaymentLearnMore onBack={() => setViewMode('landing')} />}

      {/* MEDICAL VAULT MODAL */}
      <Modal visible={isHistoryModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medical Vault</Text>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={historyDocs}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={<Text style={styles.emptyText}>No historical records found.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.historyItem} onPress={() => handleReuseFromHistory(item._id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName} numberOfLines={1}>{item.fileName}</Text>
                    <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* GLOBAL PROCESSING LOADER */}
      <Modal transparent visible={uploading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.overlayText}>Processing Securely...</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  inlineBack: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F8FAFC', gap: 5 },
  inlineBackText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderCard: { backgroundColor: 'white', padding: 30, borderRadius: 24, alignItems: 'center', width: '80%' },
  overlayText: { marginTop: 15, fontWeight: '600', fontSize: 16, color: '#1e293b' },
  
  statusCard: { backgroundColor: 'white', margin: 20, padding: 24, borderRadius: 24, ...SHADOWS.soft },
  statusHeader: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statusSub: { fontSize: 14, color: '#64748b', marginBottom: 25 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  stepLabel: { fontSize: 10, marginTop: 8, color: '#64748b', textAlign: 'center' },
  detailsBtn: { backgroundColor: COLORS.primary, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  detailsBtnText: { color: 'white', fontWeight: '700' },

  historyTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  historyTriggerText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyName: { fontWeight: '700', color: '#334155', fontSize: 15 },
  historyDate: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40 }
});