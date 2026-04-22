import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  ActivityIndicator, TouchableOpacity, Alert, Dimensions, Platform, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import adminService, { DashboardStats } from '../../services/adminService';
import { COLORS } from '../../constants/theme';
import { storage } from '../../utils/storage';

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

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
          await storage.removeItem('userToken');
          await storage.removeItem('userRole');
          router.replace('/auth/login'); 
      }}
    ]);
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>CONSOLE</Text>
            <Text style={styles.title}>System Overview</Text>
          </View>
          <TouchableOpacity style={styles.logoutCircle} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* 📊 REVENUE CARD - Clickable */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(admin)/revenue-details')}>
          <View style={styles.revenueCard}>
            <View>
              <Text style={styles.revenueLabel}>Platform Revenue</Text>
              <Text style={styles.revenueValue}>₹{stats?.finance?.[0]?.total?.toLocaleString('en-IN') || '0'}</Text>
            </View>
            <View style={styles.revenueIconBg}><Ionicons name="stats-chart" size={24} color="#FFF" /></View>
          </View>
        </TouchableOpacity>

        {/* 👥 STATS GRID - Clickable */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(admin)/doctors-list')}>
            <Text style={styles.statBoxLabel}>Total Doctors</Text>
            <Text style={styles.statBoxValue}>{stats?.users?.find(u => u._id === 'doctor')?.count || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.statBox} onPress={() => router.push('/(admin)/patients-list')}>
            <Text style={styles.statBoxLabel}>Total Patients</Text>
            <Text style={styles.statBoxValue}>{stats?.users?.find(u => u._id === 'patient')?.count || 0}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Management Hub</Text>
        <View style={styles.actionGrid}>
          <ActionTile icon="person-add-outline" label="Register Doctor" onPress={() => router.push('/(admin)/add-doctor')} />
          <ActionTile icon="document-text-outline" label="Audit Cases" onPress={() => router.push('/(admin)/cases')} />
          <ActionTile icon="card-outline" label="Payments" onPress={() => router.push('/(admin)/payments')} />
          <ActionTile icon="settings-outline" label="Settings" onPress={() => {}} />
        </View>
      </ScrollView>
    </View>
  );
}

const ActionTile = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.tile} onPress={onPress}>
    <View style={styles.tileIconBg}><Ionicons name={icon} size={22} color={COLORS.primary} /></View>
    <Text style={styles.tileLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFD' },
  contentContainer: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 30 },
  greeting: { fontSize: 12, color: '#94A3B8', letterSpacing: 1.5 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  logoutCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  revenueCard: { backgroundColor: '#1E4D48', padding: 24, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  revenueLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  revenueValue: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  revenueIconBg: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  statBoxLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
  statBoxValue: { fontSize: 26, fontWeight: 'bold', color: '#0F172A' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9' },
  tileIconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F0FDFA', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  tileLabel: { fontSize: 13, color: '#475569', textAlign: 'center' }
});