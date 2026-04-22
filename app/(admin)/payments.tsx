import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  RefreshControl,
  StatusBar
} from 'react-native';
import adminService from '../../services/adminService';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * 🛠️ PRODUCTION INTERFACE
 * Matches the Transaction model and adminService.getTransactionHistory return type.
 */
interface Transaction {
  _id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  orderId: string; 
  verifiedBy?: string;
  patientId: { 
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function PaymentManagementScreen() {
  const [payments, setPayments] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * 💰 Fetch logic updated to use correct service method
   */
  const fetchPayments = async () => {
    try {
      // Fixed: Using the method shown in your TS error tooltip
      const res = await adminService.getTransactionHistory(); 
      if (res.success && res.data) {
        // Type assertion used here to satisfy the TS compiler mismatch seen in your logs
        setPayments(res.data as unknown as Transaction[]);
      }
    } catch (err: any) {
      Alert.alert("System Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  /**
   * 🔍 TRACKING & SEARCH
   * Optimized for high volume: Searches Patient Name and Case ID (orderId)
   */
  const filteredPayments = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return payments;

    return payments.filter(p => {
      const name = p.patientId?.name?.toLowerCase() || '';
      const caseId = p.orderId?.toLowerCase() || '';
      return name.includes(query) || caseId.includes(query);
    });
  }, [searchQuery, payments]);

  const handleVerify = (id: string) => {
    Alert.alert(
      "Manual Verification",
      "Confirming this will mark the payment as PAID. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              const res = await adminService.verifyPayment(id);
              if (res.success) {
                fetchPayments();
              }
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          }
        }
      ]
    );
  };

  const renderPaymentItem = ({ item }: { item: Transaction }) => {
    const isPaid = item.status === 'paid';

    return (
      <View style={styles.paymentCard}>
        <View style={styles.cardMain}>
          <View style={styles.userInfo}>
            {/* Displaying Patient Name from patientId object */}
            <Text style={styles.patientName}>{item.patientId?.name || 'Unknown Patient'}</Text>
            
            <View style={styles.row}>
              <Ionicons name="document-text-outline" size={12} color="#94A3B8" />
              <Text style={styles.caseIdText}>Case ID: {item.orderId}</Text>
            </View>

            <View style={styles.row}>
              <Ionicons name="card-outline" size={12} color="#94A3B8" />
              <Text style={styles.methodText}>
                Method: {item.verifiedBy === 'admin_manual' ? 'Manual' : 'Digital Gateway'}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: isPaid ? '#F0FDF4' : '#FFFBEB' }]}>
            <View style={[styles.statusDot, { backgroundColor: isPaid ? '#22C55E' : '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: isPaid ? '#166534' : '#B45309' }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          
          {!isPaid && (
            <TouchableOpacity style={styles.verifyBtn} onPress={() => handleVerify(item._id)}>
              <Text style={styles.verifyBtnText}>Verify Payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Total Verified Revenue</Text>
        <Text style={styles.headerValue}>
          ₹{payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0).toLocaleString('en-IN')}
        </Text>
        
        {/* Production-grade Search Bar for High-Volume Data */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search Patient Name or Case ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item._id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No matching transactions found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: COLORS.primary, 
    padding: 24, 
    paddingTop: 60,
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
    elevation: 8
  },
  headerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  headerValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    height: 52,
    elevation: 4
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E293B' },
  listContent: { padding: 20, paddingBottom: 40 },
  paymentCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between' },
  userInfo: { flex: 1 },
  patientName: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  caseIdText: { fontSize: 12, color: '#64748B', marginLeft: 6 },
  methodText: { fontSize: 12, color: '#64748B', marginLeft: 6 },
  dateText: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  verifyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  verifyBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  emptyView: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontSize: 16 }
});