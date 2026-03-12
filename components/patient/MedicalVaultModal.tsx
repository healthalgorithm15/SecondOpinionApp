import React, { useEffect, useState } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { patientService } from '../../services/patientService';
import { COLORS } from '../../constants/theme';

export const MedicalVaultModal = ({ visible, onClose, currentReports, onRefreshDashboard }: any) => {
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (visible) loadVault(); }, [visible]);

  const loadVault = async () => {
    setLoading(true);
    try {
      const res = await patientService.getReviewHistory();
      if (res.success) {
        const allDocs = res.data.filter((c: any) => c.status === 'COMPLETED').flatMap((c: any) => c.recordIds || []);
        const uniqueDocs = Array.from(new Map(allDocs.map((item: any) => [item._id, item])).values());
        setHistoryDocs(uniqueDocs);
      }
    } finally { setLoading(false); }
  };

  const handleAdd = async (id: string) => {
    await patientService.reuseRecord(id);
    onRefreshDashboard();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Medical Vault</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} /></TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator color={COLORS.primary} size="large" /> : (
            <FlatList
              data={historyDocs}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isAdded = currentReports.some((r:any) => r.fileName === item.fileName);
                return (
                  <TouchableOpacity style={styles.item} onPress={() => !isAdded && handleAdd(item._id)} disabled={isAdded}>
                    <MaterialCommunityIcons name="file-pdf-box" size={24} color={COLORS.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '700' }}>{item.fileName}</Text>
                    </View>
                    <Ionicons name={isAdded ? "checkmark-circle" : "add-circle"} size={26} color={isAdded ? "#10B981" : COLORS.primary} />
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
  content: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, height: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 12 }
});