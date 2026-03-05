import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActivityIndicator, 
  View, 
  Alert, 
  Text, 
  StyleSheet, 
  Modal,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { PatientNewUI, PatientExistingUI } from '../../../components/patient'; 
import { patientService } from '../../../services/patientService';
import { COLORS } from '../../../constants/theme';

export default function PatientHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const [data, setData] = useState<any>(null);
  const [hasError, setHasError] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setHasError(false);
      setLoading(true);
      const res = await patientService.getDashboard();
      if (res?.success) {
        setData(res.data);
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
        
        if (res.success) {
          Alert.alert("Success", "Report added to your secure vault.");
          fetchDashboard(); 
        }
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      const msg = error.response?.data?.message || "Please check your internet connection and try again.";
      Alert.alert("Upload Issue", msg);
      setUploading(false);
    }
  };

  const handleScanPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Permission Required", "We need camera access to scan your reports.");
      
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled) {
        setUploading(true);
        const res = await patientService.uploadRecord(
          result.assets[0].uri, 
          'scan.jpg', 
          'image/jpeg'
        );
        
        if (res.success) {
          Alert.alert("Success", "Scan uploaded successfully.");
          fetchDashboard();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Could not complete the scan.");
      setUploading(false);
    }
  };

  const handleContinue = async () => {
    if (!data?.reports || data.reports.length === 0) {
      return Alert.alert("No Reports", "Please upload a document first.");
    }
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
      Alert.alert("Analysis Error", "We couldn't start the AI analysis right now.");
    } finally {
      setUploading(false);
    }
  };
const handleDeleteReport = async (reportId: string) => {
    try {
      setUploading(true);
      const res = await patientService.deleteRecord(reportId); // Ensure this exists in patientService
      if (res.success) {
        // Optimistically update UI without a full reload
        setData((prev: any) => ({
          ...prev,
          reports: prev.reports.filter((r: any) => r._id !== reportId)
        }));
        Alert.alert("Success", "Report removed successfully.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not delete the report.");
    } finally {
      setUploading(false);
    }
  };
  // 🏥 PREMIUM LOADING STATE
  if (loading) {
    return (
      <View style={styles.centerMode}>
        <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        <Text style={styles.loadingTitle}>Welcome Back</Text>
        <Text style={styles.loadingSubtitle}>Preparing your secure medical dashboard...</Text>
      </View>
    );
  }

  // ⚠️ ROBUST ERROR STATE (Replaces Blank Screen on Network Error)
  if (hasError || !data) {
    return (
      <View style={styles.centerMode}>
        <Ionicons name="cloud-offline-outline" size={80} color="#cbd5e1" />
        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorSubtitle}>
          We're having trouble reaching the clinical server. Please check your internet connection.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboard}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {data?.reports?.length > 0 ? (
        <PatientExistingUI 
          name={data.name || "Patient"} 
          reports={data.reports}
          onContinue={handleContinue}
          onUploadPDF={handleUploadPDF} 
          onScanPhoto={handleScanPhoto}
          onDeleteReport={handleDeleteReport}
        />
      ) : (
        <PatientNewUI 
          onUploadPDF={handleUploadPDF} 
          onScanPhoto={handleScanPhoto} 
        />
      )}
      
      <Modal transparent visible={uploading} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.overlayText}>Securing your document...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerMode: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40
  },
  loadingTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20
  },
  errorTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b'
  },
  errorSubtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    elevation: 2
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10
  },
  overlayText: {
    marginTop: 15,
    fontWeight: '600',
    fontSize: 16,
    color: '#1e293b'
  }
});