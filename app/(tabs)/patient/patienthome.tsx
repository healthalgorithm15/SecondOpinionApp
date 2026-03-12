import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ActivityIndicator, View, Text, StyleSheet, Modal,
  TouchableOpacity, SafeAreaView, ScrollView, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

import { 
  PatientNewUI, PatientExistingUI, PatientLandingUI, 
  DoctorProfileDetail, PaymentLearnMore 
} from '../../../components/patient'; 
import { CaseStatusStepper } from '../../../components/patient/CaseStatusStepper';
import { MedicalVaultModal } from '../../../components/patient/MedicalVaultModal';
import { patientService } from '../../../services/patientService';
import { COLORS, SHADOWS } from '../../../constants/theme';

export default function PatientHome() {
  const router = useRouter();
  const hasInitialized = useRef(false);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'upload' | 'doctor' | 'payment'>('landing');
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await patientService.getDashboard();
      if (res?.success) {
        setData(res.data);
        if (res.data.activeCase || (res.data.reports && res.data.reports.length > 0)) {
          setViewMode('upload');
        }
      }
    } catch (error) {
      console.error("PramanAI Sync Error:", error);
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

  const handleUpload = async () => {
    try {
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
    } catch (err) {
      Alert.alert("Upload Failed", "Please try again.");
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
          params: { caseId: res.caseId, mode: 'submission' } 
        } as any);
      }
    } catch (err) {
      Alert.alert("Error", "Could not submit case.");
    } finally { setUploading(false); }
  };

  if (loading && !data) {
    return (
      <View style={styles.centerMode}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {viewMode === 'landing' ? (
        <PatientLandingUI 
          name={data?.name || "Patient"} 
          onStart={() => setViewMode('upload')}
          onViewDoctor={() => setViewMode('doctor')}
          onViewPayment={() => setViewMode('payment')}
          activeCaseStatus={data?.activeCase?.status || null}
        />
      ) : viewMode === 'upload' ? (
        <View style={{ flex: 1 }}>
          <SafeAreaView style={styles.headerSafe}>
            <View style={styles.brandedHeader}>
              <TouchableOpacity onPress={() => setViewMode('landing')} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.brandedHeaderTitle}>PramanAI Dashboard</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>

          <ScrollView 
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchDashboard(true)} tintColor="#FFF" />} 
            style={styles.whiteSheet}
            contentContainerStyle={styles.scrollContent}
          >
            {data?.activeCase ? (
              <CaseStatusStepper currentCase={data.activeCase} />
            ) : (
              <View style={{ paddingHorizontal: 10 }}>
                {data?.reports?.length > 0 ? (
                  <PatientExistingUI 
                    name={data.name} 
                    reports={data.reports} 
                    onContinue={handleContinue} 
                    onUploadPDF={handleUpload}
                    onScanPhoto={() => {}} 
                    onDeleteReport={async (id: string) => {
                      await patientService.deleteRecord(id);
                      fetchDashboard(true);
                    }}
                    onAddMore={handleUpload}
                  />
                ) : (
                  <PatientNewUI onUploadPDF={handleUpload} onScanPhoto={() => {}} />
                )}
                
                <TouchableOpacity style={styles.vaultTrigger} onPress={() => setIsVaultOpen(true)}>
                  <Ionicons name="time-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.vaultText}>Add from Medical Vault</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      ) : viewMode === 'doctor' ? (
        <DoctorProfileDetail onBack={() => setViewMode('landing')} />
      ) : (
        <PaymentLearnMore onBack={() => setViewMode('landing')} />
      )}

      <MedicalVaultModal 
        visible={isVaultOpen} 
        onClose={() => setIsVaultOpen(false)} 
        currentReports={data?.reports || []}
        onRefreshDashboard={() => fetchDashboard(true)}
      />

      <Modal transparent visible={uploading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.overlayText}>Processing...</Text>
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
  brandedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 4 },
  brandedHeaderTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  whiteSheet: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: 10 },
  scrollContent: { paddingTop: 25, paddingBottom: 100 },
  vaultTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10, marginTop: 20, backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1.5, borderColor: COLORS.primary },
  vaultText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  loaderCard: { backgroundColor: 'white', padding: 30, borderRadius: 25, alignItems: 'center', ...SHADOWS.soft },
  overlayText: { marginTop: 15, fontWeight: '700', color: '#1e293b' }
});