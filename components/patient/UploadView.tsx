import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Modal, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ExistingUserDashboard from './ExistingUserDashboard';
import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

export default function UploadView({ name, drafts, onUpdate, onFinalSubmit, canUpload, onRestrictedAccess }: any) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    console.log("inside handleuplod", canUpload)
    // 🟢 SYNCED LOGIC: Uses the exact same check as the 'Start Analysis' button.
    if (canUpload || (drafts && drafts.length > 0)) {
      return triggerFilePicker();
    }

    // Fallback: If no payment or drafts, show the alert.
    Alert.alert(
      "Payment Required",
      "You need an active credit to start an analysis.",
      [
        { text: "Later", style: "cancel" },
        { text: "Get Credit", onPress: onRestrictedAccess }
      ]
    );
  };

  const triggerFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const file = result.assets[0];

        await patientService.uploadRecord(
          file.uri, 
          file.name, 
          file.mimeType || 'application/pdf'
        );
        
        // Refresh parent to update the list and flags
        await onUpdate(true); 
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Record", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            setIsUploading(true);
            await patientService.deleteRecord(id);
            await onUpdate(true); 
          } catch (e) { 
            Alert.alert("Error", "Delete failed"); 
          } finally {
            setIsUploading(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.viewWrapper}>
      {/* 🔄 Upload/Delete Status Overlay */}
      <Modal transparent visible={isUploading} animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loaderText}>Updating Records...</Text>
          </View>
        </View>
      </Modal>

      <ExistingUserDashboard 
        name={name}
        reports={drafts} 
        onContinue={onFinalSubmit}
        onAddMore={handleUpload}
        onDeleteReport={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({ 
  viewWrapper: { flex: 1 },
  loaderOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(17, 24, 39, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loaderBox: { 
    padding: 30, 
    backgroundColor: '#1F2937', 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151'
  },
  loaderText: { color: '#FFF', marginTop: 15, fontSize: 16, fontWeight: '600' }
});