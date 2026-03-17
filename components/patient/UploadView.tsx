import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Modal, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ExistingUserDashboard from './ExistingUserDashboard';
import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

export default function UploadView({ name, drafts, onUpdate, onFinalSubmit, canUpload, onRestrictedAccess }: any) {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 🟢 PRODUCTION UPLOAD LOGIC
   * Includes file size validation and loading state management.
   */
  const handleUpload = async () => {
    if (!canUpload) {
      onRestrictedAccess();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        const file = result.assets[0];

        // 🛡️ Guard: File Size (e.g., 10MB limit)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert("File Too Large", "Please select a document smaller than 10MB.");
          return;
        }

        setIsUploading(true);
        
        // Pass the uri and necessary metadata to service
        const uploadResponse = await patientService.uploadRecord(
          file.uri, 
          file.name, 
          file.mimeType || 'application/pdf'
        );

        if (uploadResponse) {
          // Refresh the parent state to show new draft
          onUpdate();
        }
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      Alert.alert("Upload Failed", "Could not process document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Record", "Are you sure you want to remove this draft?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await patientService.deleteRecord(id);
            onUpdate();
          } catch (error) {
            Alert.alert("Error", "Could not delete the record.");
          }
        } 
      }
    ]);
  };

  return (
    <View style={styles.viewWrapper}>
      {/* 🟢 Upload Overlay Loader */}
      <Modal transparent visible={isUploading} animationType="fade">
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>Processing Document...</Text>
        </View>
      </Modal>

      <ExistingUserDashboard 
        name={name}
        reports={drafts}
        onContinue={async () => {
          try {
            await onFinalSubmit();
          } catch (e) {
            console.error("Final Submit Error:", e);
          }
        }}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loaderText: {
    color: '#FFF',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600'
  }
});