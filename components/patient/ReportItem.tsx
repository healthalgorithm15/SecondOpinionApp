import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export const ReportItem = ({ title, date, onPress }: any) => (
  <TouchableOpacity style={styles.item} activeOpacity={0.9} onPress={onPress}>
    <View style={styles.iconBox}>
      <Ionicons name="document-text" size={20} color={COLORS.primary} />
    </View>
    <View style={styles.info}>
      <Text numberOfLines={1} style={styles.title}>{title || "Report"}</Text>
      <Text style={styles.date}>{date}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Pops against the glass
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0F9F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: COLORS.textMain },
  date: { fontSize: 11, color: COLORS.textSub },
});