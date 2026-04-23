// app/(admin)/doctors-list.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import adminService from '../../services/adminService';
import { COLORS } from '../../constants/theme';

export default function DoctorsListScreen() {
  // 🛡️ FIX: Added <any[]> to allow the doctors data to be stored
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await adminService.getAllDoctors();
        if (res.success && res.data) {
          setDoctors(res.data);
        }
      } catch (error) {
        console.error("Failed to load doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Onboarded Doctors</Text>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
  const isCmo = item.role?.toLowerCase() === 'cmo';
  
  return (
    <View style={[styles.docCard, { borderLeftColor: isCmo ? '#4F46E5' : '#1E4D48' }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.docName}>Dr. {item.name}</Text>
        
        {/* ROLE BADGE */}
        <View style={[
          styles.badge, 
          { backgroundColor: isCmo ? '#EEF2FF' : '#F0FDFA' }
        ]}>
          <Text style={[styles.badgeText, { color: isCmo ? '#4F46E5' : '#1E4D48' }]}>
            {isCmo ? 'CMO' : 'Specialist'}
          </Text>
        </View>
      </View>

      <Text style={styles.docSpec}>{item.specialization || 'Hospital Leadership'}</Text>
      <Text style={styles.docMci}>MCI: {item.mciNumber || 'N/A'}</Text>
    </View>
  );
}}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#0F172A' },
  docCard: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderLeftWidth: 4, 
    borderLeftColor: '#1E4D48',
    elevation: 2 
  },
  badge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
},
badgeText: {
  fontSize: 10,
  fontWeight: '800',
},
  docName: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  docSpec: { color: '#64748B', marginTop: 2 },
  docMci: { fontSize: 12, color: '#94A3B8', marginTop: 4 }
});