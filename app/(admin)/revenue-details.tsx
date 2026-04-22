// app/(admin)/revenue-details.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import adminService, { TransactionData } from '../../services/adminService';
import { COLORS } from '../../constants/theme';

export default function RevenueDetailsScreen() {
  const [data, setData] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getTransactionHistory().then(res => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Financial Transactions</Text>
      {loading ? <ActivityIndicator color={COLORS.primary} /> : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.patientName}</Text>
                <Text style={styles.amount}>₹{item.amount}</Text>
              </View>
              <Text style={styles.meta}>
                Method: {item.paymentMethod} • {new Date(item.createdAt).toLocaleDateString('en-IN')}
              </Text>
              <Text style={[styles.status, { color: item.status === 'success' ? '#10B981' : '#F59E0B' }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, borderRightWidth: 4, borderRightColor: '#10B981' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: 'bold', fontSize: 15 },
  amount: { fontWeight: 'bold', color: '#0F172A' },
  meta: { color: '#64748B', fontSize: 12, marginTop: 4 },
  status: { fontSize: 10, fontWeight: 'bold', marginTop: 8 }
});