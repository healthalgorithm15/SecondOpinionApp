import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import adminService, { DashboardStats } from '../../services/adminService';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';

export default function AdminHomeScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await adminService.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.screenWrapper}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
      }
    >
      {/* 🏥 HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Console</Text>
          <Text style={styles.title}>System Overview</Text>
        </View>
        <TouchableOpacity style={styles.profileCircle}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 📊 REVENUE HIGHLIGHT (REAL DATA) */}
      <View style={styles.revenueCard}>
        <View>
          <Text style={styles.revenueLabel}>Platform Revenue</Text>
          <Text style={styles.revenueValue}>
            ₹{stats?.finance?.[0]?.total?.toLocaleString('en-IN') || '0'}
          </Text>
        </View>
        <View style={styles.revenueIconBg}>
          <Ionicons name="stats-chart" size={24} color="#FFF" />
        </View>
      </View>

      {/* 👥 USER STATS GRID */}
      <View style={styles.grid}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Total Doctors</Text>
          <Text style={styles.statBoxValue}>
            {stats?.users?.find(u => u._id === 'doctor')?.count || 0}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Total Patients</Text>
          <Text style={styles.statBoxValue}>
            {stats?.users?.find(u => u._id === 'patient')?.count || 0}
          </Text>
        </View>
      </View>

      {/* 🛠️ QUICK ACTIONS SECTION */}
      <Text style={styles.sectionTitle}>Management Hub</Text>
      <View style={styles.actionGrid}>
        <ActionTile 
          icon="person-add-outline" 
          label="Register Doctor" 
          onPress={() => router.push('/(admin)/add-doctor')} 
        />
        <ActionTile 
          icon="document-text-outline" 
          label="Audit Cases" 
          onPress={() => router.push('/(admin)/cases')} 
        />
        <ActionTile 
          icon="card-outline" 
          label="Payments" 
          onPress={() => console.log('Navigate to Payments')} 
        />
        <ActionTile 
          icon="settings-outline" 
          label="Settings" 
          onPress={() => console.log('Settings')} 
        />
      </View>
    </ScrollView>
  );
}

// 📦 Reusable Sub-component for Cleaner Code
const ActionTile = ({ icon, label, onPress }: { icon: any, label: string, onPress: () => void }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress}>
    <View style={styles.tileIconBg}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
    </View>
    <Text style={styles.tileLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: '#FDFDFD' },
  contentContainer: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 40, 
    marginBottom: 30 
  },
  greeting: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontFamily: 'Inter-Bold', fontSize: 26, color: COLORS.textMain, marginTop: 4 },
  profileCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  
  revenueCard: { 
    backgroundColor: COLORS.primary, 
    padding: 24, 
    borderRadius: 24, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 }
  },
  revenueLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter-Medium', fontSize: 13 },
  revenueValue: { color: '#FFF', fontFamily: 'Inter-Bold', fontSize: 32, marginTop: 4 },
  revenueIconBg: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03
  },
  statBoxLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#64748B', marginBottom: 8 },
  statBoxValue: { fontFamily: 'Inter-Bold', fontSize: 24, color: COLORS.textMain },

  sectionTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: COLORS.textMain, marginBottom: 16 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  tileIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  tileLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#475569' }
});