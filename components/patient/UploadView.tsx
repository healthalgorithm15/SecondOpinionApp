import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ExistingUserDashboard from './ExistingUserDashboard';
import * as DocumentPicker from 'expo-document-picker';
import { patientService } from '../../services/patientService';

export default function UploadView({ name, drafts, onUpdate, onFinalSubmit, canUpload, onRestrictedAccess }: any) {
  
  const handleUpload = async () => {
    if (!canUpload) {
      onRestrictedAccess();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: ['application/pdf', 'image/jpeg', 'image/png'] 
      });

      if (!result.canceled) {
        const file = result.assets[0];
        await patientService.uploadRecord(file.uri, file.name, file.mimeType || 'application/pdf');
        onUpdate();
      }
    } catch (error) {
      Alert.alert("Upload Failed", "Could not process document.");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Record", "Are you sure you want to remove this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await patientService.deleteRecord(id);
          onUpdate();
        }
      }
    ]);
  };

  return (
    <View style={styles.viewWrapper}>
      <ExistingUserDashboard 
        name={name}
        reports={drafts}
        onContinue={async () => await onFinalSubmit()} // Matches Promise type
        onAddMore={handleUpload}
        onDeleteReport={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({ viewWrapper: { flex: 1 } });