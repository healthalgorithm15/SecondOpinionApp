import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../../components/AuthLayout';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../../constants/theme';
import { doctorService } from '../../../services/doctorService'; // 🟢 Updated to use the service

export default function DoctorHistory() {
  const router = useRouter();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch Data Function
  const fetchHistory = async (pageNumber: number, shouldAppend: boolean = false) => {
    try {
      if (pageNumber === 1) setLoading(true);
      
      const res = await doctorService.getDoctorHistory(pageNumber, 10);
      
      if (res.success) {
        const newData = res.data;
        setHistory(prev => shouldAppend ? [...prev, ...newData] : newData);
        
        // Check if there are more pages based on backend pagination metadata
        // If your backend returns total pages, use: pageNumber < res.pagination.pages
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

  // Initial Load
  useEffect(() => {
    fetchHistory(1);
  }, []);

  // Pull to Refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchHistory(1);
  }, []);

  // Infinite Scroll: Load More
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage, true);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return <ActivityIndicator style={{ marginVertical: 20 }} color={COLORS.secondary} />;
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Review History</Text>
          <Ionicons name="archive-outline" size={24} color={COLORS.primary} />
        </View>

        {loading && page === 1 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item._id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.secondary]} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: "/doctor-review/[caseId]",
                  params: { caseId: item._id }
                })}
              >
                <View style={styles.cardContent}>
                  <View style={styles.infoSection}>
                    <Text style={styles.patientName}>
                      {item.patientId?.name || 'Unknown Patient'}
                    </Text>
                    <Text style={styles.date}>
                      Completed: {new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={60} color={COLORS.textSub} style={{ opacity: 0.5 }} />
                <Text style={styles.empty}>No completed reviews found.</Text>
              </View>
            }
          />
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { ...TYPOGRAPHY.header, color: COLORS.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    backgroundColor: COLORS.secondary + '15', // 15% opacity of secondary color
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