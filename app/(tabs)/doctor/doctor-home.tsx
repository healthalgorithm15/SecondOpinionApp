import React, { useEffect, useState, useCallback } from 'react';
import { 
  Alert, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, RefreshControl 
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
  
  // --- IDENTITY STATE ---
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

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
      const res = await doctorService.getPendingCases();
      if (res.success) {
        setCases(res.data);
      }
    } catch (error) {
      console.error("❌ Worklist error:", error);
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
   * 👁️ Handle Viewing specific attachments
   */
  const handleViewFile = (record: any, patientName: string) => {
    const isObject = typeof record === 'object' && record !== null;
    const recordId = isObject ? record._id : record;
    let contentType = isObject ? record.contentType : 'application/pdf';
    
    if (!recordId) {
      Alert.alert("Error", "Medical record ID is missing.");
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
    const isUrgent = item.aiAnalysis?.riskLevel === 'High';
    const accentColor = isUrgent ? '#EF4444' : '#1E7D75';

    return (
      <View style={styles.caseCard}>
        {/* Left Status Strip */}
        <View style={[styles.urgencyStrip, { backgroundColor: accentColor }]} />
        
        <View style={styles.cardBody}>
          {/* LEFT SECTION: Patient Details */}
          <View style={styles.infoSection}>
            <Text style={styles.caseId}>CASE #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.patientName} numberOfLines={1}>
              {item.patientId?.name || 'Anonymous Patient'}
            </Text>
            <View style={[styles.typeBadge, { borderColor: accentColor + '30' }]}>
              <Text style={[styles.typeText, { color: accentColor }]}>
                {isUrgent ? 'PRIORITY REVIEW' : 'ROUTINE CHECK'}
              </Text>
            </View>
          </View>

          {/* RIGHT SECTION: Multi-Attachments & Review Button */}
          <View style={styles.actionSection}>
            <View style={styles.attachmentGrid}>
              {item.recordIds?.map((record: any, index: number) => {
                const isPdf = (typeof record === 'object' ? record.contentType : '').includes('pdf');
                
                return (
                  <TouchableOpacity 
                    key={index}
                    style={styles.attachmentIcon}
                    onPress={() => handleViewFile(record, item.patientId?.name)}
                  >
                    <Ionicons 
                      name={isPdf ? "document-text" : "image"} 
                      size={18} 
                      color={COLORS.primary} 
                    />
                    <View style={styles.countBadge}>
                       <Text style={styles.countText}>{index + 1}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={[styles.reviewBtn, { backgroundColor: accentColor }]} 
              onPress={() => router.push({
                pathname: '/(tabs)/doctor/doctor-review/[caseId]',
                params: { caseId: item._id }
              } as any)}
            >
              <Text style={styles.reviewBtnText}>Review</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <AuthLayout>
        <View style={styles.mainContainer}>
          {/* 🟢 DYNAMIC HEADER BASED ON ROLE */}
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeGreeting}>
              {userRole === 'cmo' ? 'Chief Medical Officer' : 'Medical Specialist'}
            </Text>
            <Text style={styles.welcomeName}>
               {userRole === 'cmo' ? userName : `Dr. ${userName}`}
            </Text>
            <Text style={styles.subtitle}>
              {loading ? 'Updating Worklist...' : `${cases.length} pending assignments`}
            </Text>
          </View>

          <FlatList
            data={cases}
            renderItem={renderCaseItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cafe-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>All caught up!</Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={fetchWorklist} 
                tintColor="#1E7D75" 
              />
            }
          />
        </View>
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  mainContainer: { flex: 1, width: '100%' },
  headerInfo: { alignItems: 'center', marginBottom: 24, paddingHorizontal: 20 },
  welcomeGreeting: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  welcomeName: { fontSize: 26, fontWeight: '800', color: '#1E293B', marginTop: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },

  caseCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    marginBottom: 12, 
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.soft
  },
  urgencyStrip: { width: 6 },
  cardBody: { 
    flex: 1, 
    flexDirection: 'row', 
    padding: 14, 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },

  infoSection: { flex: 0.55 },
  caseId: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  patientName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginVertical: 2 },
  typeBadge: { 
    alignSelf: 'flex-start',
    paddingHorizontal: 6, paddingVertical: 2, 
    borderRadius: 4, borderWidth: 1, marginTop: 4 
  },
  typeText: { fontSize: 9, fontWeight: '900' },

  actionSection: { flex: 0.45, alignItems: 'flex-end' },
  attachmentGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-end',
    marginBottom: 8 
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative'
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#1E7D75',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  countText: { color: 'white', fontSize: 8, fontWeight: 'bold' },

  reviewBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 10 
  },
  reviewBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, marginRight: 4 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748B', marginTop: 10, fontSize: 14 }
});