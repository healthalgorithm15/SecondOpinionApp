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
  RefreshControl
} from 'react-native';
import adminService from '../../services/adminService';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Transaction {
  _id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  userId: {
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

  const fetchPayments = async () => {
    try {
      const res = await adminService.getPayments();
      if (res.success && res.data) {
        setPayments(res.data);
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

  // Filter logic for production use
  const filteredPayments = useMemo(() => {
    return payments.filter(p => 
      p.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, payments]);

  const handleVerify = (id: string) => {
    Alert.alert(
      "Manual Verification",
      "Confirming this will mark the payment as successful and notify the patient. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Payment", 
          onPress: async () => {
            try {
              const res = await adminService.verifyPayment(id);
              if (res.success) {
                Alert.alert("Verified", "Transaction status updated.");
                fetchPayments();
              }
            } catch (err: any) {
              Alert.alert("Action Failed", err.message);
            }
          }
        }
      ]
    );
  };

  const renderPaymentItem = ({ item }: { item: Transaction }) => {
    const isCompleted = item.status === 'completed';

    return (
      <View style={styles.paymentCard}>
        <View style={styles.cardMain}>
          <View style={styles.userInfo}>
            <Text style={styles.patientName}>{item.userId?.name || 'External User'}</Text>
            <Text style={styles.txId}>Ref: {item.transactionId}</Text>
            <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#F0FDF4' : '#FFFBEB' }]}>
            <View style={[styles.statusDot, { backgroundColor: isCompleted ? '#22C55E' : '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: isCompleted ? '#166534' : '#B45309' }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          
          {!isCompleted && (
            <TouchableOpacity 
              style={styles.verifyBtn} 
              onPress={() => handleVerify(item._id)}
            >
               
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
                <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 💰 FINANCIAL HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Total Platform Revenue</Text>
        <Text style={styles.headerValue}>
          ₹{payments.reduce((sum, p) => sum + (p.status === 'completed' ? p.amount : 0), 0).toLocaleString('en-IN')}
        </Text>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or Trans. ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions found</Text>
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
    paddingTop: 50,
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
    elevation: 10
  },
  headerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter-Medium' },
  headerValue: { color: '#FFF', fontSize: 34, fontFamily: 'Inter-Bold', marginTop: 4 },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 20,
    height: 44
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1E293B', fontFamily: 'Inter-Regular' },

  listContent: { padding: 20, paddingBottom: 100 },
  paymentCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10
  },
  cardMain: { flexDirection: 'row', justifyContent: 'space-between' },
  userInfo: { flex: 1 },
  patientName: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#1E293B' },
  txId: { fontSize: 11, color: '#94A3B8', marginTop: 2, letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: '#64748B', marginTop: 4 },
  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontFamily: 'Inter-Bold', color: COLORS.primary },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontFamily: 'Inter-Bold' },
  
  verifyBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FDFA', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1'
  },
  verifyBtnText: { color: COLORS.primary, fontSize: 12, fontFamily: 'Inter-Bold', marginLeft: 4 },
  
  emptyView: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94A3B8', fontFamily: 'Inter-Medium', marginTop: 12 }
});