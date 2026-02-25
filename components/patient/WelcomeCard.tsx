import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur'; 
import { Ionicons } from '@expo/vector-icons';
// Import matching your theme.ts (COLORS and BORDER_RADIUS)
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

interface WelcomeCardProps {
  name: string;
  onUploadPDF: () => void;
  onScan: () => void;
}

export const WelcomeCard = ({ name, onUploadPDF, onScan }: WelcomeCardProps) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.glassCard}>
        <Text style={styles.welcomeTitle}>Welcome, {name}</Text>
        <Text style={styles.description}>
          You haven't uploaded any medical reports yet. Start your AI analysis today.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={onUploadPDF}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
          <Text style={styles.btnText}>Upload PDF Report</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onScan}>
          <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
          <Text style={styles.secondaryBtnText}>Scan with Camera</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  glassCard: {
    padding: 25,
    // Using your card border radius constant
    borderRadius: BORDER_RADIUS.card, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: COLORS.overlay, // Using your overlay color
  },
  welcomeTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: COLORS.textMain, // Using your theme text color
    marginBottom: 10 
  },
  description: { 
    fontSize: 14, 
    color: COLORS.textSub, // Using your theme sub-text color
    lineHeight: 20, 
    marginBottom: 25 
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, // Fixed reference
    flexDirection: 'row',
    padding: 16,
    borderRadius: BORDER_RADIUS.button, // Using your theme button radius
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  secondaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    padding: 16,
    borderRadius: BORDER_RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.primary, // Fixed reference
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryBtnText: { 
    color: COLORS.primary, // Fixed reference
    fontWeight: 'bold', 
    fontSize: 16 
  },
});