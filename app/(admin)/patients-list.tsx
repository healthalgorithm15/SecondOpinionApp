// app/(admin)/patients-list.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import adminService, { PatientRecord } from '../../services/adminService';
import { COLORS } from '../../constants/theme';

export default function PatientsListScreen() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAllPatients().then(res => {
      if (res.success && res.data) setPatients(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Patient Records</Text>
      <FlatList
        data={patients}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.patientName}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: item.paymentStatus === 'Paid' ? '#DCFCE7' : '#FEE2E2' }]}>
                <Text style={styles.badgeText}>{item.paymentStatus}</Text>
              </View>
            </View>
            <Text style={styles.caseId}>Case ID: #{item.caseId?.toUpperCase() || 'NOT_FOUND'}</Text>
            <View style={styles.divider} />
            <Text style={styles.assigned}>
              Assigned To: <Text style={{ fontWeight: 'bold' }}>{item.assignedDoctor || 'Pending Assignment'}</Text>
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 15, marginBottom: 12, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  patientName: { fontSize: 16, fontWeight: 'bold' },
  caseId: { color: '#64748B', fontSize: 13, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  assigned: { fontSize: 13, color: '#475569' }
});