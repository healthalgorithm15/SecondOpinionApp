import React, { useEffect, useState, useCallback } from 'react';
import { 
  Alert, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, RefreshControl, Modal 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// --- DESIGN SYSTEM ---
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, SHADOWS } from '../../../constants/theme';

// --- LOGIC ---
import { doctorService } from '../../../services/doctorService';
import { storage } from '@/utils/storage';

export default function DoctorHomeScreen() {
  const router = useRouter();
  
  // --- UI & DATA STATE ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'APPROVAL'>('NEW');

  // --- IDENTITY & ASSIGNMENT STATE ---
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  const isCMO = userRole?.toLowerCase() === 'cmo';

  /**
   * 🆔 Load User Identity
   */
  useEffect(() => {
    const loadIdentity = async () => {
      const role = await storage.getItem('userRole');
      const name = await storage.getItem('userName');
      setUserRole(role);
      setUserName(name || '');
    };
    loadIdentity();
  }, []);

  /**
   * 🔄 Fetch Live Worklist
   */
  const fetchWorklist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await doctorService.getPendingCases();
      if (res.success) {
        setCases(res.data || []);
      }
    } catch (error) {
      console.error("Worklist Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWorklist();
    }, [fetchWorklist])
  );

  /**
   * 🏷️ Filter Logic
   * Doctors see all assigned cases. CMO sees tab-specific cases.
   */
  const filteredCases = cases.filter(item => {
    if (!isCMO) return true; // Specialists see their full assigned data from backend

    if (activeTab === 'NEW') return item.status === 'UNASSIGNED';
    if (activeTab === 'ACTIVE') return item.status === 'PENDING_DOCTOR';
    if (activeTab === 'APPROVAL') return item.status === 'PENDING_CMO_APPROVAL';
    return true;
  });

  /**
   * 🤝 Assignment Actions (CMO Only)
   */
  const handleOpenAssign = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setShowAssignModal(true);
    try {
      const res = await doctorService.getAllSpecialists();
      if (res.success) setSpecialists(res.data);
    } catch (err) {
      Alert.alert("Error", "Could not load specialist list.");
    }
  };

  const confirmAssignment = async (specialistId: string) => {
    if (!selectedCaseId) return;
    try {
      const res = await doctorService.assignSpecialist(selectedCaseId, specialistId);
      if (res.success) {
        setShowAssignModal(false);
        fetchWorklist(); // Immediate refresh to remove from "NEW" tab
        Alert.alert("Success", "Case assigned successfully.");
      }
    } catch (err) {
      Alert.alert("Error", "Assignment failed.");
    }
  };

  /**
   * 👁️ Handle Viewing specific attachments
   */
 const handleViewFile = (record: any, patientName: string) => {
  // ✅ FIX: Determine if record is the ID itself or an object containing the ID
  const recordId = typeof record === 'object' ? (record._id || record.id) : record;
  
  // ✅ FIX: Logic to determine if it's an image or PDF based on object data or default
  const contentType = record?.contentType || 'image/jpeg'; 

  if (!recordId) {
    console.error("No record ID found for:", record);
    return;
  }

  router.push({
    pathname: '/view/DocumentViewScreen', 
    params: { 
      docId: recordId, 
      fileName: `${patientName}'s Record`,
      contentType: contentType,
      role: userRole || 'doctor' 
    }
  } as any);
};

  /**
   * 🎨 Render Case Card
   */
  const renderCaseItem = ({ item }: { item: any }) => {
    const isProcessing = item.status === 'AI_PROCESSING';
    const isUrgent = item.aiAnalysis?.riskLevel === 'High';
    const isUnassigned = item.status === 'UNASSIGNED';
    const isApprovalTab = activeTab === 'APPROVAL' && isCMO;
    
    let accentColor = isUrgent ? '#EF4444' : (isProcessing ? '#94A3B8' : '#1E7D75');
    if (isApprovalTab) accentColor = '#34C759'; // Success Green for finalization

    return (
      <View style={styles.caseCard}>
        <View style={[styles.urgencyStrip, { backgroundColor: accentColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.infoSection}>
            <Text style={styles.caseId}>CASE #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientId?.name || 'Anonymous Patient'}
            </Text>
            <View style={[styles.typeBadge, { borderColor: accentColor + '30' }]}>
              <Text style={[styles.typeText, { color: accentColor }]}>
                {isProcessing ? 'AI ANALYZING...' : (isUrgent ? 'PRIORITY' : 'ROUTINE')}
              </Text>
            </View>
          </View>

          <View style={styles.actionSection}>
            <View style={styles.attachmentGrid}>
              {item.recordIds?.map((record: any, index: number) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.attachmentIcon}
                  onPress={() => handleViewFile(record, item.patientId?.name)}
                >
                  <Ionicons name="document-text" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {isCMO && isUnassigned && (
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#FF9500', marginRight: 8 }]}
                  onPress={() => handleOpenAssign(item._id)}
                >
                  <Text style={styles.actionBtnText}>Assign</Text>
                  <Ionicons name="person-add" size={12} color="#FFF" />
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                disabled={isProcessing}
                style={[styles.actionBtn, { backgroundColor: isProcessing ? '#CBD5E1' : accentColor }]} 
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/doctor-review/[caseId]',
                    params: { 
                      caseId: item._id, 
                      mode: isApprovalTab ? 'approve' : 'review' 
                    }
                  } as any);
                }}
              >
                <Text style={styles.actionBtnText}>
                  {isProcessing ? 'Wait' : (isApprovalTab ? 'Approve' : 'Review')}
                </Text>
                <Ionicons name="chevron-forward" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <AuthLayout>
        <View style={styles.mainContainer}>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeGreeting}>{isCMO ? 'Chief Medical Officer' : 'Specialist Worklist'}</Text>
            <Text style={styles.welcomeName}>{isCMO ? userName : `Dr. ${userName}`}</Text>
          </View>

          {/* TAB SWITCHER: ONLY VISIBLE TO CMO */}
          {isCMO && (
            <View style={styles.tabBar}>
              {[
                { id: 'NEW', label: 'ASSIGN' },
                { id: 'ACTIVE', label: 'TRACK' },
                { id: 'APPROVAL', label: 'APPROVE' }
              ].map((tab) => (
                <TouchableOpacity 
                  key={tab.id} 
                  onPress={() => setActiveTab(tab.id as any)}
                  style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <FlatList
            data={filteredCases}
            renderItem={renderCaseItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={fetchWorklist} 
                tintColor={COLORS.primary} 
              />
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cafe-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No cases currently pending.</Text>
                </View>
              ) : <ActivityIndicator style={{marginTop: 50}} color={COLORS.primary} />
            }
          />
        </View>

        {/* ASSIGNMENT MODAL (CMO ONLY) */}
        <Modal visible={showAssignModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Assign Specialist</Text>
              <FlatList
                data={specialists}
                keyExtractor={s => s._id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.specRow} onPress={() => confirmAssignment(item._id)}>
                    <View>
                      <Text style={styles.specName}>{item.name}</Text>
                      <Text style={styles.specRole}>{item.specialization || 'Medical Specialist'}</Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowAssignModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  mainContainer: { flex: 1, width: '100%' },
  headerInfo: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  welcomeGreeting: { fontSize: 12, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
  welcomeName: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 15 },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#E2E8F0' },
  activeTabItem: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  activeTabText: { color: COLORS.primary },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  caseCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', ...SHADOWS.soft },
  urgencyStrip: { width: 6 },
  cardBody: { flex: 1, flexDirection: 'row', padding: 14, alignItems: 'center', justifyContent: 'space-between' },
  infoSection: { flex: 0.55 },
  caseId: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  patientName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, marginTop: 4 },
  typeText: { fontSize: 9, fontWeight: '900' },
  actionSection: { flex: 0.45, alignItems: 'flex-end' },
  attachmentGrid: { flexDirection: 'row', marginBottom: 10 },
  attachmentIcon: { width: 32, height: 32, backgroundColor: '#F1F5F9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  buttonContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, minWidth: 75, justifyContent: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 11, marginRight: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  specName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  specRole: { fontSize: 12, color: '#64748B' },
  modalClose: { marginTop: 20, alignItems: 'center' },
  modalCloseText: { color: '#EF4444', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748B', marginTop: 10 },
});