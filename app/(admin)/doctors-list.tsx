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
        renderItem={({ item }) => (
          <View style={styles.docCard}>
            <Text style={styles.docName}>Dr. {item.name}</Text>
            <Text style={styles.docSpec}>{item.specialization}</Text>
            <Text style={styles.docMci}>MCI: {item.mciNumber}</Text>
          </View>
        )}
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
  docName: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  docSpec: { color: '#64748B', marginTop: 2 },
  docMci: { fontSize: 12, color: '#94A3B8', marginTop: 4 }
});