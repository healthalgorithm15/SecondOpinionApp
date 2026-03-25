import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface ReportItemProps {
  title: string;
  date: string;
  contentType: string; 
  onPress: () => void;
  onDelete: () => void;
}

export const ReportItem = ({ title, date, contentType, onPress, onDelete }: ReportItemProps) => {
  // 🟢 Logic: Check MIME type or Extension
  const isImage = contentType?.toLowerCase().includes('image');
  
  const iconName = isImage ? "image" : "document-text";
  const iconColor = isImage ? "#8B5CF6" : COLORS.primary || "#1E7D75";
  const iconBg = isImage ? '#F5F3FF' : '#F0F9F8';

  const displayDate = date ? new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : "Recent";

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.clickableArea} 
        activeOpacity={0.7} 
        onPress={onPress}
      >
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>
            {title || "Untitled Report"}
          </Text>
          <Text style={styles.date}>{displayDate}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionGroup}>
        <TouchableOpacity 
          onPress={onPress} 
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="eye-outline" size={20} color="#64748B" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onDelete} 
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clickableArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  date: { fontSize: 12, color: '#64748B' },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    paddingLeft: 8,
    marginLeft: 8,
  },
  iconBtn: { padding: 8, borderRadius: 8 }
});