import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '@/constants/theme';

interface Props {
  userEmail: string;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const AccountSettingsUI = ({ userEmail, onLogout, onChangePassword }: Props) => {
  return (
    <View style={styles.mainContainer}>
      <Text style={styles.headerTitle}>Account Settings</Text>

      {/* ⚪ THE GLASS CARD */}
      <View style={styles.glassCard}>
        
        {/* Email Display Section */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>Logged in as</Text>
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        <View style={styles.separator} />

        {/* Change Password Action */}
        <TouchableOpacity style={styles.menuItem} onPress={onChangePassword}>
          <View style={styles.menuLeft}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.menuText}>Update Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Support Action */}
        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.menuText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Logout Action (Destructive) */}
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomWidth: 0 }]} 
          onPress={onLogout}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.versionText}>Praman AI v1.0.4 (Beta)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { 
    width: '100%', 
    alignItems: 'center', 
    paddingTop: 10 
  },
  headerTitle: { 
    ...TYPOGRAPHY.header, 
    color: COLORS.primary, 
    marginBottom: 20 
  },
  glassCard: {
    width: '94%',
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    // Soft shadow to match the buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  infoSection: { 
    marginBottom: 15, 
    paddingHorizontal: 5 
  },
  label: { 
    fontFamily: 'Inter-Medium', 
    fontSize: 12, 
    color: COLORS.textSub, 
    marginBottom: 4 
  },
  emailText: { 
    fontFamily: 'Inter-SemiBold', 
    fontSize: 16, 
    color: COLORS.textMain 
  },
  separator: { 
    height: 1, 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    marginVertical: 10 
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  menuLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  menuText: { 
    fontFamily: 'Inter-Medium', 
    fontSize: 15, 
    color: COLORS.textMain 
  },
  versionText: { 
    ...TYPOGRAPHY.disclaimer, 
    marginTop: 20, 
    color: COLORS.textSub 
  }
});