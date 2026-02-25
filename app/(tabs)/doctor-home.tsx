import React, { useEffect, useState, useCallback } from 'react';
import { 
  Alert, View, Text, StyleSheet, FlatList, 
  TouchableOpacity, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Design System
import AuthLayout from '../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';

// Logic
import { doctorService } from '../../services/doctorService';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cases, setCases] = useState<any[]>([]);

  /**
   * 🔄 Fetch Live Worklist (PENDING_DOCTOR status)
   */
  const fetchWorklist = useCallback(async () => {
    try {
      const res = await doctorService.getPendingCases();
      if (res.success) {
        setCases(res.data);
      } else {
        console.error("Fetch failed:", res.message);
      }
    } catch (error) {
      console.error("❌ Worklist error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorklist();
    // One-time welcome alert (Optional: remove if it's annoying)
    // Alert.alert(STRINGS.doctor.welcomeTitle, STRINGS.doctor.activationMsg);
  }, [fetchWorklist]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorklist();
  };

  /**
   * 🎨 Render Individual Case Card
   */
  const renderCaseItem = ({ item }: { item: any }) => {
    // 🟢 UPDATED: Priority is now determined by AI Risk Assessment
    const isUrgent = item.aiAnalysis?.riskLevel === 'High';
    
    return (
      <TouchableOpacity 
        style={styles.caseCard}
        activeOpacity={0.8}
        onPress={() => router.push({
          // 🔗 Navigation now points to the dynamic [caseId] template
          pathname: '/(tabs)/doctor-review/[caseId]',
          params: { caseId: item._id }
        } as any)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: isUrgent ? '#FEE2E2' : '#E0F2FE' }]}>
            <Ionicons 
              name={item.type === 'ECG' ? 'heart' : 'document-text'} 
              size={20} 
              color={isUrgent ? '#EF4444' : COLORS.secondary} 
            />
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.caseId}>Case #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.patientName}>{item.patientId?.name || 'Anonymous Patient'}</Text>
          </View>
        </View>
        
        <View style={[
          styles.badge, 
          { backgroundColor: isUrgent ? '#FEE2E2' : '#F1F5F9' }
        ]}>
          <Text style={[
            styles.badgeText, 
            { color: isUrgent ? '#B91C1C' : '#475569' }
          ]}>
            {isUrgent ? 'Urgent' : 'Pending'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <AuthLayout>
        <View style={styles.mainContainer}>
          <View style={styles.headerInfo}>
            <Text style={styles.welcome}>{STRINGS.doctor.portal}</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Updating queue...' : STRINGS.doctor.caseStats(cases.length)}
            </Text>
          </View>

          <View style={styles.glassCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{STRINGS.doctor.assignedCases}</Text>
              {loading && <ActivityIndicator size="small" color={COLORS.secondary} />}
            </View>
            
            <FlatList
              data={cases}
              renderItem={renderCaseItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false} // AuthLayout usually handles the main scroll
              ListEmptyComponent={
                !loading ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="cafe-outline" size={48} color={COLORS.border} />
                    <Text style={styles.emptyText}>All caught up! No pending cases.</Text>
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh} 
                  tintColor={COLORS.secondary} 
                />
              }
            />
          </View>
        </View>
      </AuthLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: COLORS.bgScreen },
  mainContainer: { width: '100%', alignItems: 'center', paddingTop: 10 },
  headerInfo: { alignItems: 'center', marginBottom: 20 },
  welcome: { ...TYPOGRAPHY.header, color: COLORS.primary },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSub, marginTop: 4 },
  
  glassCard: {
    width: '94%', 
    backgroundColor: COLORS.glassBg, 
    borderRadius: BORDER_RADIUS.card,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 100, 
    minHeight: 300,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  sectionTitle: { 
    fontFamily: 'Inter-Bold',
    fontSize: 16, 
    color: COLORS.textMain, 
  },
  caseCard: { 
    backgroundColor: COLORS.white, 
    padding: 14, 
    borderRadius: BORDER_RADIUS.inner, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoColumn: { flex: 1 },
  caseId: { fontFamily: 'Inter-Bold', fontSize: 14, color: COLORS.textMain },
  patientName: { fontFamily: 'Inter-Medium', fontSize: 12, color: COLORS.textSub, marginTop: 1 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontFamily: 'Inter-Bold', fontSize: 10 },
  
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { 
    fontFamily: 'Inter-Medium', 
    color: COLORS.textSub, 
    marginTop: 10,
    fontSize: 14 
  }
});