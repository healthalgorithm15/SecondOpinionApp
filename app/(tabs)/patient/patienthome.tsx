import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ActivityIndicator, View, Text, StyleSheet, Modal,
  TouchableOpacity, SafeAreaView, FlatList, ScrollView, RefreshControl,
  Alert, Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

// Custom Components
import { 
  PatientNewUI, PatientExistingUI, PatientLandingUI, 
  DoctorProfileDetail, PaymentLearnMore 
} from '../../../components/patient'; 
import { patientService } from '../../../services/patientService';
import { COLORS, SHADOWS } from '../../../constants/theme';

const { width } = Dimensions.get('window');

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
   */
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await patientService.getDashboard();
      if (res?.success) {
        setData(res.data);
        
        // AUTO-TRANSITION LOGIC: 
        // Stay in 'upload' mode if there is an active process or unfinished drafts
        if (res.data.activeCase || (res.data.reports && res.data.reports.length > 0)) {
          setViewMode('upload');
        }

        // Fetch Vault History
        const historyRes = await patientService.getReviewHistory();
        if (historyRes.success) {
          // Flatten all records from past COMPLETED cases
          const allDocs = historyRes.data
            .filter((c: any) => c.status === 'COMPLETED')
            .flatMap((caseItem: any) => caseItem.recordIds || []);
          
          // Filter out duplicates (if same record used in multiple cases)
          const uniqueDocs = Array.from(new Map(allDocs.map((item: any) => [item._id, item])).values());
          setHistoryDocs(uniqueDocs);
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

  // Handle external tab navigation
  useEffect(() => {
    if (params?.tab === 'home') setViewMode('upload');
  }, [params?.tab]);

  // --- Handlers ---

  const handleUploadPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
      if (!result.canceled) {
        setUploading(true);
        const res = await patientService.uploadRecord(
          result.assets[0].uri, 
          result.assets[0].name, 
          result.assets[0].mimeType || 'application/pdf'
        );
        if (res.success) await fetchDashboard(true);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!data?.reports?.length) return;
    setUploading(true);
    try {
      const res = await patientService.submitForReview(data.reports.map((r: any) => r._id));
      if (res.success) {
        await fetchDashboard(true);
        router.push({ 
          pathname: '/(tabs)/patient/case-status', 
          params: { caseId: res.caseId } 
        } as any);
      }
    } catch (err) {
      Alert.alert("Submission Failed", "Could not submit case for review.");
    } finally { 
      setUploading(false); 
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    setUploading(true);
    try {
      const res = await patientService.deleteRecord(reportId);
      if (res.success) await fetchDashboard(true);
    } finally {
      setUploading(false);
    }
  };

  const handleReuseFromHistory = async (reportId: string) => {
    // Modal stays open to allow multiple selections from vault
    setUploading(true); 
    try {
      const res = await patientService.reuseRecord(reportId);
      if (res.success) {
        await fetchDashboard(true);
      }
    } finally {
      setUploading(false);
    }
  };

  // --- UI Sub-Components ---

  const StatusStepper = ({ currentCase }: { currentCase: any }) => {
    const isCompleted = currentCase.status === 'COMPLETED';
    const isDoctor = currentCase.status === 'PENDING_DOCTOR';
    const isAI = currentCase.status === 'AI_PROCESSING';

    return (
      <View style={styles.statusCard}>
        <Text style={styles.statusHeader}>{isCompleted ? "Analysis Complete" : "Case Active"}</Text>
        <Text style={styles.statusSub}>ID: {currentCase._id.slice(-6).toUpperCase()}</Text>
        
        <View style={styles.stepperContainer}>
          <StepItem icon="file-upload" label="Uploaded" completed />
          
          <StepItem 
            icon="robot-outline" 
            label="AI Check" 
            active={isAI} 
            completed={!isAI} 
          />
          
          <StepItem 
            icon="doctor" 
            label="Expert" 
            active={isDoctor} 
            completed={isCompleted}
          />
          
          <StepItem 
            icon="check-circle-outline" 
            label="Final" 
            completed={isCompleted}
            active={isCompleted}
          />
        </View>

        <TouchableOpacity 
          style={[styles.detailsBtn, isCompleted && { backgroundColor: '#10B981' }]} 
          onPress={() => router.push({ 
            pathname: '/(tabs)/patient/case-status', 
            params: { caseId: currentCase._id } 
          } as any)}
        >
          <Text style={styles.detailsBtnText}>
            {isCompleted ? "View Results" : "Track My Case"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const StepItem = ({ icon, label, completed, active }: any) => (
    <View style={styles.stepItem}>
      <View style={[
        styles.stepCircle, 
        completed && { backgroundColor: COLORS.primary },
        active && { backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#FFF' }
      ]}>
        <MaterialCommunityIcons name={icon} size={20} color={completed || active ? "white" : "#94A3B8"} />
      </View>
      <Text style={[styles.stepLabel, (active || completed) && { color: COLORS.primary, fontWeight: '700' }]}>{label}</Text>
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
    <View style={styles.mainContainer}>
      
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
          <SafeAreaView style={styles.headerSafe}>
            <View style={styles.brandedHeader}>
              <TouchableOpacity onPress={() => setViewMode('landing')} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.brandedHeaderTitle}>PramanAI Dashboard</Text>
              <View style={{ width: 40 }} /> 
            </View>
          </SafeAreaView>
          
          <View style={styles.contentWrapper}>
            <ScrollView 
              refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchDashboard(true)} />} 
              style={styles.whiteSheet}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {data?.activeCase ? (
                <StatusStepper currentCase={data.activeCase} />
              ) : (
                <View style={styles.uploadContainer}>
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
                    <PatientNewUI onUploadPDF={handleUploadPDF} onScanPhoto={() => {}} />
                  )}

                  <TouchableOpacity style={styles.vaultTrigger} onPress={() => setIsHistoryModalOpen(true)}>
                    <Ionicons name="time-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.vaultText}>Add from Medical Vault</Text>
                  </TouchableOpacity>
                </View>
              )}

              {data?.activeCase && (
                 <TouchableOpacity 
                   style={styles.historySecondaryBtn} 
                   onPress={() => router.push('/(tabs)/patient/history')}
                 >
                   <Text style={styles.historySecondaryText}>View Past Reports</Text>
                 </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Auxiliary Views */}
      {viewMode === 'doctor' && <DoctorProfileDetail onBack={() => setViewMode('landing')} />}
      {viewMode === 'payment' && <PaymentLearnMore onBack={() => setViewMode('landing')} />}

      {/* Modals */}
      <Modal visible={isHistoryModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Medical Vault</Text>
                <Text style={styles.modalSub}>Select reports to reuse</Text>
              </View>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={historyDocs}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={
                <View style={styles.emptyVault}>
                  <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyVaultText}>No completed records found yet.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isAlreadyAdded = data?.reports?.some((r: any) => r.fileName === item.fileName);
                return (
                  <TouchableOpacity 
                    style={[styles.historyItem, isAlreadyAdded && { opacity: 0.5 }]} 
                    onPress={() => !isAlreadyAdded && handleReuseFromHistory(item._id)}
                    disabled={isAlreadyAdded}
                  >
                    <View style={styles.historyIconBox}>
                      <MaterialCommunityIcons 
                        name={item.contentType?.includes('pdf') ? "file-pdf-box" : "image"} 
                        size={24} 
                        color={COLORS.primary} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyName} numberOfLines={1}>{item.fileName || item.title}</Text>
                      <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                    {isAlreadyAdded ? (
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    ) : (
                      <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal transparent visible={uploading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.overlayText}>Syncing Vault...</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#002D2D' },
  centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002D2D' },
  headerSafe: { backgroundColor: '#002D2D' },
  brandedHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingVertical: 15 
  },
  backButton: { padding: 4 },
  brandedHeaderTitle: { color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#002D2D',
  },
  whiteSheet: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderTopLeftRadius: 35, 
    borderTopRightRadius: 35,
    marginTop: 10 
  },
  scrollContent: {
    paddingTop: 25,
    paddingBottom: 120 
  },
  uploadContainer: { paddingHorizontal: 10 },
  statusCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    padding: 24, 
    borderRadius: 28, 
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  statusHeader: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  statusSub: { fontSize: 13, color: '#64748b', marginBottom: 25 },
  stepperContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8
  },
  stepLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'center' },
  detailsBtn: { 
    backgroundColor: COLORS.primary, 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 5,
    ...SHADOWS.soft
  },
  detailsBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  historySecondaryBtn: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20
  },
  historySecondaryText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15
  },
  vaultTrigger: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 25, 
    gap: 10,
    marginTop: 10,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: COLORS.primary
  },
  vaultText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,45,45,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 24, 
    height: '80%',
    ...SHADOWS.soft
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25,
    paddingHorizontal: 5
  },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  modalSub: { fontSize: 14, color: '#64748b', marginTop: 2 },
  closeBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 20 },
  historyItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  historyIconBox: {
    width: 45,
    height: 45,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    ...SHADOWS.soft
  },
  historyName: { fontWeight: '700', color: '#334155', fontSize: 15 },
  historyDate: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  emptyVault: { alignItems: 'center', marginTop: 100 },
  emptyVaultText: { color: '#94A3B8', marginTop: 15, fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderCard: { backgroundColor: 'white', padding: 30, borderRadius: 25, alignItems: 'center', ...SHADOWS.soft},
  overlayText: { marginTop: 15, fontWeight: '700', color: '#1e293b' }
});