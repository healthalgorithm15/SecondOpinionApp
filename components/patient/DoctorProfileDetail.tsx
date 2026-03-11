import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { STRINGS } from '../../constants/Strings';
import AuthLayout from '../AuthLayout';

export const DoctorProfileDetail = ({ onBack }: { onBack: () => void }) => {
  const doc = STRINGS.patient.doctorProfile;

  return (
    <AuthLayout 
      title="Specialist Profile" 
      subtitle="Verified Expert Consultation"
    >
      <TouchableOpacity onPress={onBack} style={styles.floatingBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Profile Hero */}
      <View style={styles.heroCard}>
        <View style={styles.avatarLarge}>
          <FontAwesome5 name="user-md" size={60} color="#cbd5e1" />
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="check-decagram" size={24} color="#4CAF50" />
          </View>
        </View>
        <Text style={[styles.docName, TYPOGRAPHY.header]}>{doc.name}</Text>
        <Text style={[styles.docCredentials, TYPOGRAPHY.body, { color: COLORS.textSub }]}>
          {doc.credentials}
        </Text>
        <View style={styles.expBadge}>
          <Text style={[TYPOGRAPHY.caption, { color: COLORS.primary, fontWeight: '700' }]}>
    {doc.experience}
  </Text>
        </View>
      </View>

      {/* Expertise Section */}
      <Text style={[styles.sectionLabel, TYPOGRAPHY.boldText]}>{doc.expertiseTitle}</Text>
      <View style={styles.grid}>
        {doc.expertiseList.map((item, i) => (
          <View key={i} style={styles.expertiseChip}>
            <Ionicons name="medical" size={14} color={COLORS.primary} />
            <Text style={[styles.chipText, TYPOGRAPHY.body, { fontSize: 13 }]}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Bio Section */}
      <Text style={[styles.sectionLabel, TYPOGRAPHY.boldText]}>{doc.bioTitle}</Text>
      <View style={styles.infoCard}>
        <Text style={[styles.bioText, TYPOGRAPHY.body]}>{doc.bioContent}</Text>
      </View>

      {/* Fee Note */}
      <View style={styles.feeContainer}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.textSub} />
        <Text style={[styles.feeNote, TYPOGRAPHY.caption, { fontStyle: 'italic' }]}>{doc.feeNote}</Text>
      </View>

      <TouchableOpacity style={styles.ctaButton} onPress={onBack}>
        <Text style={[styles.ctaText, TYPOGRAPHY.button]}>{doc.cta}</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  floatingBack: { position: 'absolute', top: -10, left: 0, padding: 10, zIndex: 10 },
  heroCard: { 
    alignItems: 'center', 
    backgroundColor: COLORS.glassBg, 
    borderRadius: BORDER_RADIUS.card, 
    padding: 30, 
    marginTop: 10,
    ...SHADOWS.soft 
  },
  avatarLarge: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.bgScreen, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: 'white', borderRadius: 12 },
  docName: { marginTop: 15, color: COLORS.textMain },
  docCredentials: { marginTop: 4 },
  expBadge: { backgroundColor: '#E8F3F1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  sectionLabel: { color: COLORS.textMain, marginBottom: 12, marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  expertiseChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BORDER_RADIUS.inner, borderWidth: 1, borderColor: COLORS.border },
  chipText: { marginLeft: 8, color: COLORS.textSub },
  infoCard: { backgroundColor: COLORS.white, padding: 16, borderRadius: BORDER_RADIUS.md, ...SHADOWS.soft },
  bioText: { color: COLORS.textSub, lineHeight: 22 },
  feeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 25, gap: 10 },
  feeNote: { flex: 1 },
  ctaButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: BORDER_RADIUS.button, alignItems: 'center', marginTop: 30, ...SHADOWS.button },
  ctaText: { color: 'white' }
});