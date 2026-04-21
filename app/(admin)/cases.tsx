import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import adminService, { CaseData } from '../../services/adminService';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CaseAuditScreen() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reassignment States
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchCases = async () => {
    try {
      const res = await adminService.getAllCases();
      if (res.success && res.data) {
        setCases(res.data);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // --- Reassignment Logic ---
  const openReassignModal = async (caseId: string) => {
    setSelectedCase(caseId);
    setModalVisible(true);
    setModalLoading(true);
    try {
      const res = await adminService.getAvailableDoctors();
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not load doctor list");
    } finally {
      setModalLoading(false);
    }
  };

  const confirmReassignment = async (doctorId: string) => {
    if (!selectedCase) return;

    try {
      const res = await adminService.reassignDoctor(selectedCase, doctorId);
      if (res.success) {
        Alert.alert("Success", "Case reassigned successfully");
        setModalVisible(false);
        fetchCases(); // Refresh list to show new doctor
      }
    } catch (err: any) {
      Alert.alert("Failed", err.message);
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'pending': return { color: '#CA8A04', label: 'Pending Assignment' };
      case 'assigned': return { color: '#2563EB', label: 'Under Review' };
      case 'completed': return { color: '#0D9488', label: 'Report Ready' };
      default: return { color: '#64748B', label: status };
    }
  };

  const renderCaseItem = ({ item }: { item: CaseData }) => {
    const status = getStatusDetails(item.status);

    return (
      <View style={styles.caseCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.caseId}>CASE #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="person" size={14} color="#94A3B8" />
            <Text style={styles.infoLabel}>Patient:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.patientId?.name || 'N/A'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="medical" size={14} color="#94A3B8" />
            <Text style={styles.infoLabel}>Doctor:</Text>
            <Text 
              style={[
                styles.infoValue, 
                !item.doctorId && { color: '#EF4444', fontFamily: 'Inter-SemiBold' }
              ]} 
              numberOfLines={1}
            >
              {item.doctorId?.name || 'Unassigned'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => openReassignModal(item._id)}
          >
            <Text style={styles.actionBtnText}>Update Assignment</Text>
            <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cases}
        keyExtractor={(item) => item._id}
        renderItem={renderCaseItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchCases(); }} 
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No cases found</Text>
            <Text style={styles.emptySub}>Medical requests will appear here once submitted.</Text>
          </View>
        }
      />

      {/* 🩺 REASSIGNMENT MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reassign Specialist</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Select a doctor to handle this case:</Text>
            
            {modalLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 40 }} />
            ) : (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {doctors.map((doc) => (
                  <TouchableOpacity 
                    key={doc._id} 
                    style={styles.doctorItem}
                    onPress={() => confirmReassignment(doc._id)}
                  >
                    <View style={styles.doctorInfo}>
                      <Text style={styles.docName}>Dr. {doc.name}</Text>
                      <Text style={styles.docSpec}>{doc.specialization || 'General Physician'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 16, paddingBottom: 40 },
  caseCard: {
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 16 
  },
  caseId: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 12, 
    color: '#64748B', 
    letterSpacing: 0.5 
  },
  dateText: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 11, 
    color: '#94A3B8', 
    marginTop: 2 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { 
    fontFamily: 'Inter-SemiBold', 
    fontSize: 11, 
    textTransform: 'capitalize' 
  },
  infoGrid: { gap: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 13, 
    color: '#64748B', 
    marginLeft: 8, 
    width: 60 
  },
  infoValue: { 
    flex: 1, 
    fontFamily: 'Inter-Medium', 
    fontSize: 13, 
    color: COLORS.textMain 
  },
  footer: { 
    marginTop: 16, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  actionBtnText: { 
    fontFamily: 'Inter-SemiBold', 
    fontSize: 13, 
    color: COLORS.primary 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 100, 
    paddingHorizontal: 40 
  },
  emptyTitle: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 18, 
    color: COLORS.textMain, 
    marginTop: 16 
  },
  emptySub: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 14, 
    color: '#94A3B8', 
    textAlign: 'center', 
    marginTop: 8, 
    lineHeight: 20 
  },
  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingBottom: 40 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalTitle: { 
    fontFamily: 'Inter-Bold', 
    fontSize: 20, 
    color: COLORS.textMain 
  },
  modalSub: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 14, 
    color: '#64748B', 
    marginBottom: 20 
  },
  doctorItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  doctorInfo: { flex: 1 },
  docName: { 
    fontFamily: 'Inter-SemiBold', 
    fontSize: 15, 
    color: COLORS.textMain 
  },
  docSpec: { 
    fontFamily: 'Inter-Medium', 
    fontSize: 12, 
    color: COLORS.primary, 
    marginTop: 2 
  }
});