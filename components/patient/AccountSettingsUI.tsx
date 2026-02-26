import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { STRINGS } from '@/constants/Strings';

interface Props {
  userEmail: string;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const AccountSettingsUI = ({ userEmail, onLogout, onChangePassword }: Props) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {/* Header from Strings.ts */}
        <Text style={styles.headerTitle}>{STRINGS.settings.title}</Text>

        {/* ⚪ THE GLASS CARD - Matches your mockup style */}
        <View style={styles.glassCard}>
          
          {/* Email Display Section */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>{STRINGS.common.loggedInAs}</Text>
            <Text style={styles.emailText}>{userEmail}</Text>
          </View>

          <View style={styles.separator} />

          {/* Update Password Action */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={onChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.secondary} />
              <Text style={styles.menuText}>{STRINGS.settings.updatePassword}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
          </TouchableOpacity>

          {/* Help & Support Action */}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color={COLORS.secondary} />
              <Text style={styles.menuText}>{STRINGS.status.needHelp}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
          </TouchableOpacity>

          {/* Logout Action */}
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomWidth: 0 }]} 
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={[styles.menuText, { color: COLORS.error }]}>{STRINGS.settings.logout}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Version Number from Strings.ts */}
        <Text style={styles.versionText}>{STRINGS.settings.version}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // Let the background image show through
  },
  mainContainer: { 
    flex: 1,
    width: '100%', 
    alignItems: 'center', 
    paddingTop: 40 
  },
  headerTitle: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.primary, 
    marginBottom: 30,
    textAlign: 'center'
  },
  glassCard: {
    width: '90%',
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.soft, // Using your centralized shadow
  },
  infoSection: { 
    marginBottom: 10, 
    paddingHorizontal: 5 
  },
  label: { 
    ...TYPOGRAPHY.caption,
    color: COLORS.textSub, 
    marginBottom: 4,
    fontSize: 13
  },
  emailText: { 
    ...TYPOGRAPHY.boldText,
    fontSize: 18, 
    color: COLORS.textMain 
  },
  separator: { 
    height: 1, 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    marginVertical: 15 
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 5,
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  menuText: { 
    ...TYPOGRAPHY.body,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: COLORS.textMain 
  },
  versionText: { 
    ...TYPOGRAPHY.disclaimer, 
    marginTop: 40, 
    color: COLORS.textSub,
    opacity: 0.7
  }
});