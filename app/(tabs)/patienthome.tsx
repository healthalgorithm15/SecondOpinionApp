import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// 🟢 Your Patient UI Components
import { PatientNewUI, PatientExistingUI } from '../../components/patient'; 

// 🔴 REMOVED BottomNav import - Layout handles this now

import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

export default function PatientHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const [data, setData] = useState<any>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await patientService.getDashboard();
      if (res?.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
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
        const res = await patientService.uploadRecord(
          result.assets[0].uri, 
          result.assets[0].name, 
          'application/pdf'
        );
        
        if (res.success) {
          fetchDashboard(); 
        }
      }
    } catch (error) {
      Alert.alert("Error", "Upload failed");
      setUploading(false);
    }
  };

  const handleScanPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return Alert.alert("Denied", "Camera access needed");
      
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled) {
        setUploading(true);
        const res = await patientService.uploadRecord(result.assets[0].uri, 'scan.jpg', 'image/jpeg');
        
        if (res.success) {
          fetchDashboard();
        }
      }
    } catch (error) {
      Alert.alert("Error", "Scan failed");
      setUploading(false);
    }
  };

 
  const handleContinue = async () => {
  // 1. Get the IDs of the reports you want to review. 
  // If you want to submit all existing reports:
  const reportIds = data.reports.map((r: any) => r._id);
  const reportNames = data.reports.map((r: any) => r.type || "Medical Report");

  if (reportIds.length === 0) {
    return Alert.alert("No Reports", "Please upload a document first.");
  }

  setUploading(true); // Show a loader while the backend works

  try {
    // 🚀 2. CALL THE BACKEND: Create the ReviewCase & Trigger AI
    const res = await patientService.submitForReview(reportIds);

    if (res.success) {
      // 🎉 3. SUCCESS: Now go to confirmation with the real caseId from the DB
      router.push({
        pathname: '/(tabs)/submission-confirmation',
        params: { 
          caseId: res.caseId, 
          reportNames: JSON.stringify(reportNames) 
        }
      });
    } else {
      Alert.alert("Error", res.message || "Failed to start review.");
    }
  } catch (error) {
    console.error("Submit Review Error:", error);
    Alert.alert("Error", "Something went wrong. Please try again.");
  } finally {
    setUploading(false);
  }
};

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {data?.reports?.length > 0 ? (
        <PatientExistingUI 
          name={data.name || "Patient"} 
          reports={data.reports.map((r: any) => ({
            title: r.fileName || "Medical Report",
            date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            _id: r._id
          }))} 
          onContinue={handleContinue}
          onUploadPDF={handleUploadPDF} 
          onScanPhoto={handleScanPhoto}
        />
      ) : (
        <PatientNewUI 
          onUploadPDF={handleUploadPDF} 
          onScanPhoto={handleScanPhoto} 
        />
      )}
      
      {uploading && (
        <View style={{ position: 'absolute', top: 50, right: 20 }}>
          <ActivityIndicator color={COLORS.secondary} />
        </View>
      )}

      {/* 🔴 REMOVED <BottomNav /> - It's now in app/(tabs)/_layout.tsx */}
    </View>
  );
}