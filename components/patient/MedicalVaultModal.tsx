import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

export const MedicalVaultModal = ({ visible, onClose, currentReports, onRefreshDashboard }: any) => {
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => { 
    if (visible) loadVault(); 
  }, [visible]);

  const loadVault = async () => {
    setLoading(true);
    try {
      const res = await patientService.getReviewHistory();
      if (res.success) {
        // Only show documents from successfully completed past reviews
        const allDocs = res.data
          .filter((c: any) => c.status === 'COMPLETED' || c.status === 'REVIEWED')
          .flatMap((c: any) => c.recordIds || []);
        
        // Remove duplicates by ID to ensure a clean list
        const uniqueDocs = Array.from(new Map(allDocs.map((item: any) => [item._id, item])).values());
        setHistoryDocs(uniqueDocs);
      }
    } catch (e) {
      console.error("Vault Load Error:", e);
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdd = async (id: string) => {
    setAddingId(id);
    try {
      const res = await patientService.reuseRecord(id);
      if (res.success) {
        // PRODUCTION FIX: Ensure the main dashboard is fully refreshed before closing
        // This prevents the 'stale data' issue where the report doesn't appear immediately.
        await onRefreshDashboard(); 
        onClose();
      } else {
        Alert.alert("Error", "Could not add report from vault.");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred while adding the record.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Medical Vault</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Select previous records to reuse in your new case.</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : historyDocs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No historical records found.</Text>
            </View>
          ) : (
            <FlatList
              data={historyDocs}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => {
                // Check if already in the current staged reports list
                const isAdded = currentReports.some((r: any) => r._id === item._id);
                const isProcessing = addingId === item._id;

                return (
                  <TouchableOpacity 
                    style={[styles.item, isAdded && styles.itemDisabled]} 
                    onPress={() => !isAdded && handleAdd(item._id)} 
                    disabled={isAdded || !!addingId}
                  >
                    <MaterialCommunityIcons 
                      name="file-pdf-box" 
                      size={32} 
                      color={isAdded ? "#94A3B8" : COLORS.primary} 
                    />
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={[styles.fileName, isAdded && { color: '#94A3B8' }]}>
                        {item.title || item.fileName || "Medical Record"}
                      </Text>
                      <Text style={styles.fileDate}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Previous Report'}
                      </Text>
                    </View>
                    {isProcessing ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons 
                        name={isAdded ? "checkmark-circle" : "add-circle"} 
                        size={28} 
                        color={isAdded ? "#10B981" : COLORS.primary} 
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  content: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { color: '#64748B', marginBottom: 20, fontSize: 14 },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    backgroundColor: '#F8FAFC', 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  itemDisabled: { backgroundColor: '#F1F5F9', borderColor: 'transparent' },
  fileName: { fontWeight: '700', fontSize: 16, color: '#1E293B' },
  fileDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 16 }
});