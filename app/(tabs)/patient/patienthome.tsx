import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ActivityIndicator, View, Alert, Text, StyleSheet, Modal,
  TouchableOpacity, SafeAreaView, FlatList, ScrollView, RefreshControl
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Custom Components
import { 
  PatientNewUI, PatientExistingUI, PatientLandingUI, 
  DoctorProfileDetail, PaymentLearnMore 
} from '../../../components/patient'; 
import { patientService } from '../../../services/patientService';
import { COLORS, SHADOWS } from '../../../constants/theme';

export default function PatientHome() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasInitialized = useRef(false);

  // State Management
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'upload' | 'doctor' | 'payment'>('landing');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);

  /**
   * 🔄 Core Data Fetcher
   * Fetches dashboard data and populates the medical vault
   */
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await patientService.getDashboard();
      if (res?.success) {
        setData(res.data);
        
        // Populate History for the Medical Vault Modal
        const historyRes = await patientService.getReviewHistory();
        if (historyRes.success) {
          const allDocs = historyRes.data
            .filter((c: any) => c.status === 'COMPLETED')
            .flatMap((caseItem: any) => caseItem.recordIds || []);
          setHistoryDocs(allDocs);
        }
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) {
      fetchDashboard();
      hasInitialized.current = true;
    }
  }, [fetchDashboard]);

  // Sync navigation when clicking "Home" from the bottom nav
  useEffect(() => {
    if (params?.tab === 'home') setViewMode('upload');
  }, [params?.tab]);

  // --- Handlers ---

  const handleUploadPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled) {
      setUploading(true);
      const res = await patientService.uploadRecord(
        result.assets[0].uri, 
        result.assets[0].name, 
        result.assets[0].mimeType || 'application/pdf'
      );
      if (res.success) fetchDashboard(true);
    }
  };

  const handleContinue = async () => {
    if (!data?.reports?.length) return;
    setUploading(true);
    try {
      const res = await patientService.submitForReview(data.reports.map((r: any) => r._id));
      if (res.success) {
        router.push({ 
          pathname: '/(tabs)/patient/case-status', 
          params: { caseId: res.caseId } 
        } as any);
      }
    } finally { setUploading(false); }
  };

  const handleDeleteReport = async (reportId: string) => {
    setUploading(true);
    const res = await patientService.deleteRecord(reportId);
    if (res.success) fetchDashboard(true);
  };

  const handleReuseFromHistory = async (reportId: string) => {
    setIsHistoryModalOpen(false); 
    setUploading(true); 
    const res = await patientService.reuseRecord(reportId);
    if (res.success) fetchDashboard(true);
  };

  // --- UI Sub-Components ---

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

  if (loading && !data) {
    return (
      <View style={styles.centerMode}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#002D2D' }}>
      
      {/* 1. Landing View */}
      {viewMode === 'landing' && (
        <PatientLandingUI 
          name={data?.name || "Patient"} 
          onStart={() => setViewMode('upload')}
          onViewDoctor={() => setViewMode('doctor')}
          onViewPayment={() => setViewMode('payment')}
          activeCaseStatus={data?.activeCase ? data.activeCase.status.replace('_', ' ') : null}
        />
      )}

      {/* 2. Functional Dashboard View */}
      {viewMode === 'upload' && (
        <View style={{ flex: 1 }}>
          <View style={styles.brandedHeader}>
            <TouchableOpacity onPress={() => setViewMode('landing')}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.brandedHeaderTitle}>PramanAI Dashboard</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView 
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchDashboard(true)} />} 
            style={styles.whiteSheet}
          >
            {data?.activeCase ? (
              <StatusStepper currentCase={data.activeCase} />
            ) : (
              <>
                {data?.reports?.length > 0 ? (
                  <PatientExistingUI 
                    name={data.name} 
                    reports={data.reports} 
                    onContinue={handleContinue}
                    onUploadPDF={handleUploadPDF}
                    onScanPhoto={() => {}}
                    onDeleteReport={handleDeleteReport}
                    onAddMore={handleUploadPDF}
                  />
                ) : (
                  <View>
                    <PatientNewUI onUploadPDF={handleUploadPDF} onScanPhoto={() => {}} />
                    <TouchableOpacity style={styles.vaultTrigger} onPress={() => setIsHistoryModalOpen(true)}>
                      <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.vaultText}>Add from Medical Vault</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* Auxiliary Views */}
      {viewMode === 'doctor' && <DoctorProfileDetail onBack={() => setViewMode('landing')} />}
      {viewMode === 'payment' && <PaymentLearnMore onBack={() => setViewMode('landing')} />}

      {/* Medical Vault Modal */}
      <Modal visible={isHistoryModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Medical Vault</Text>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={historyDocs}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.historyItem} onPress={() => handleReuseFromHistory(item._id)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{item.fileName}</Text>
                    <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Global Processing Loader */}
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
  centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002D2D' },
  brandedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  brandedHeaderTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  whiteSheet: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  statusCard: { backgroundColor: 'white', margin: 20, padding: 24, borderRadius: 24, ...SHADOWS.soft },
  statusHeader: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  statusSub: { fontSize: 12, color: '#64748b', marginBottom: 20 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  stepLabel: { fontSize: 10, marginTop: 8, color: '#64748b' },
  detailsBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  detailsBtnText: { color: 'white', fontWeight: '700' },
  vaultTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  vaultText: { color: COLORS.primary, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  historyName: { fontWeight: '700', color: '#334155' },
  historyDate: { color: '#94a3b8', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderCard: { backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center' },
  overlayText: { marginTop: 15, fontWeight: '600' }
});