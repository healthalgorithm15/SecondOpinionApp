import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { doctorService } from '../../../services/doctorService';

export default function DoctorHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = async (pageNumber: number, shouldAppend: boolean = false) => {
    try {
      if (pageNumber === 1 && !refreshing) setLoading(true);
      const res = await doctorService.getDoctorHistory(pageNumber, 10);
      if (res.success) {
        const newData = res.data;
        setHistory(prev => shouldAppend ? [...prev, ...newData] : newData);
        setHasMore(newData.length === 10); 
      }
    } catch (err) {
      console.error("Doctor History Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchHistory(1); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchHistory(1);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage, true);
    }
  };

  // 🟢 1. The Header is now a function to be used inside FlatList
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Review History</Text>
        <Ionicons name="archive-outline" size={24} color={COLORS.primary} />
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) return <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.secondary} />;
    return <View style={{ height: 40 }} />;
  };

  return (
    // 🟢 2. Disable the parent ScrollView
    <AuthLayout scrollEnabled={false}>
      {loading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          // 🟢 3. The "Title" section is now part of the list itself
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: "/doctor-review/[caseId]" as any,
                params: { caseId: item._id }
              })}
            >
              <View style={styles.cardContent}>
                <View style={styles.infoSection}>
                  <Text style={styles.patientName}>{item.patientId?.name || 'Unknown Patient'}</Text>
                  <Text style={styles.date}>
                    Completed: {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.verdictBadge}>
                    <Text style={styles.verdictText} numberOfLines={1}>
                      Verdict: {item.doctorOpinion?.finalVerdict || 'Finalized'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSub} />
              </View>
            </TouchableOpacity>
          )}
          // 🟢 4. Infinite scroll & Refresh props
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>No completed reviews found.</Text>
            </View>
          }
          // 🟢 5. This makes the list fill the screen properly
          contentContainerStyle={styles.listContent}
        />
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  // Container logic
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  headerContainer: { paddingTop: 10, paddingBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  
  // UI logic
  title: { ...TYPOGRAPHY.header, color: COLORS.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  card: { 
    backgroundColor: 'white', 
    borderRadius: BORDER_RADIUS.md, 
    marginBottom: 12, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  infoSection: { flex: 1 },
  patientName: { ...TYPOGRAPHY.boldText, fontSize: 16, color: COLORS.textMain },
  date: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },
  verdictBadge: {
    backgroundColor: COLORS.secondary + '15', 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  verdictText: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  empty: { textAlign: 'center', marginTop: 10, color: COLORS.textSub, ...TYPOGRAPHY.boldText }
});