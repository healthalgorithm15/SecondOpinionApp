import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function ActiveTrackerView({ caseData, onRefresh }: any) {
  // Logic to determine status step
  const isAIComplete = caseData.status !== 'AI_PROCESSING' && caseData.status !== 'PENDING';
  
  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Case Analysis in Progress</Text>
          <Text style={styles.id}>ID: {caseData._id?.substring(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.dotContainer}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <View style={[styles.line, isAIComplete && { backgroundColor: COLORS.primary }]} />
            <View style={[styles.dot, { backgroundColor: isAIComplete ? COLORS.primary : '#DDD' }]} />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Uploaded</Text>
            <Text style={styles.label}>AI Analysis</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={onRefresh} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color={COLORS.white} />
          <Text style={styles.btnText}>Check for Updates</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={{ marginBottom: 8 }} />
        <Text style={styles.infoText}>
          Our medical AI and clinical experts are reviewing your records. You will receive a push notification the moment your verdict is ready.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.soft,
    elevation: 5
  },
  header: { marginBottom: 25 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.secondary, letterSpacing: -0.5 },
  id: { fontSize: 12, color: COLORS.textSub, marginTop: 4, fontWeight: '600' },
  statusRow: { marginBottom: 35, paddingHorizontal: 10 },
  dotContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 120, height: 3, backgroundColor: '#EEE', marginHorizontal: -2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', width: 160, alignSelf: 'center' },
  label: { fontSize: 11, color: COLORS.textSub, fontWeight: '700', textTransform: 'uppercase' },
  btn: { 
    backgroundColor: COLORS.primary, 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8 
  },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  infoBox: { marginTop: 25, padding: 20, backgroundColor: '#F0F9F8', borderRadius: 20, alignItems: 'center' },
  infoText: { fontSize: 13, color: COLORS.secondary, lineHeight: 20, textAlign: 'center', fontWeight: '500' }
});