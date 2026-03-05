import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STRINGS } from '../../constants/Strings';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import ExistingUserDashboard from '../../components/patient/ExistingUserDashboard';

const { width, height } = Dimensions.get('window');

/**
 * 🧱 LAYOUT COMPONENT
 * Provides the consistent medical background for all patient views.
 */
export const BackgroundLayout = ({ children }: { children: React.ReactNode }) => (
  <ImageBackground source={require('@/assets/images/medical-bg.png')} style={styles.fullScreen} resizeMode="cover">
    <StatusBar barStyle="dark-content" />
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContent}>{children}</View>
    </SafeAreaView>
  </ImageBackground>
);

/**
 * 🆕 SCENARIO 1 & 2: NEW PATIENT
 * Displayed when the user has zero medical records.
 */
export const PatientNewUI = ({ onUploadPDF, onScanPhoto }: any) => (
  <BackgroundLayout>
    <View style={styles.topHeader}><Text style={styles.brandTitle}>{STRINGS.common.appName}</Text></View>
    <View style={styles.centerSection}>
      <Text style={styles.sectionHeading}>{STRINGS.patient.healthboardTitle}</Text>
      <Text style={styles.description}>{STRINGS.patient.newUserDesc}</Text>
      
      <TouchableOpacity style={styles.glassTile} onPress={onUploadPDF}>
        <View style={styles.iconBox}><Ionicons name="document-text" size={22} color={COLORS.primary} /></View>
        <View style={styles.rowText}><Text style={styles.tileMainText}>{STRINGS.patient.uploadPdf}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.glassTile} onPress={onScanPhoto}>
        <View style={styles.iconBox}><Ionicons name="camera" size={22} color={COLORS.primary} /></View>
        <View style={styles.rowText}><Text style={styles.tileMainText}>{STRINGS.patient.scanPhoto}</Text></View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  </BackgroundLayout>
);

/**
 * 📁 SCENARIO 3: EXISTING PATIENT
 * Displayed when user has reports. Handles "Add More" and dashboard logic.
 */
export const PatientExistingUI = ({ 
  reports, 
  name, 
  onContinue, 
  onUploadPDF, 
  onScanPhoto,
  onDeleteReport
}: { 
  reports: any[]; 
  name: string; 
  onContinue: () => void; 
  onUploadPDF: () => void; 
  onScanPhoto: () => void; 
  onDeleteReport: (id: string) => void;
}) => (
  <BackgroundLayout>
    <View style={styles.topHeader}><Text style={styles.brandTitle}>{STRINGS.common.appName}</Text></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <ExistingUserDashboard 
        name={name} 
        reports={reports} 
        onContinue={onContinue} 
        onAddMore={onUploadPDF} 
        onDeleteReport={onDeleteReport}
      />
    </ScrollView>
  </BackgroundLayout>
);

/**
 * ⚙️ SETTINGS UI
 * Integrated your high-fidelity Glass Card design.
 */
interface SettingsProps {
  userEmail: string;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const AccountSettingsUI = ({ userEmail, onLogout, onChangePassword }: SettingsProps) => (
  <BackgroundLayout>
    <View style={styles.topHeader}>
      <Text style={styles.brandTitle}>{STRINGS.common.appName}</Text>
    </View>
    
    <View style={styles.settingsMain}> 
      <Text style={styles.sectionHeading}>Account Settings</Text>

      <View style={styles.glassCard}>
        {/* Email Info */}
        <View style={styles.infoSection}>
          <Text style={styles.label}>Logged in as</Text>
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        <View style={styles.separator} />

        {/* Update Password */}
        <TouchableOpacity style={styles.menuItem} onPress={onChangePassword}>
          <View style={styles.menuLeft}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.menuText}>Update Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Support */}
        <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.menuText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={onLogout}>
          <View style={styles.menuLeft}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>Praman AI v1.0.4 (Beta)</Text>
    </View>
  </BackgroundLayout>
);

const styles = StyleSheet.create({
  fullScreen: { width, height },
  safeArea: { flex: 1 },
  mainContent: { flex: 1, paddingHorizontal: 25 },
  topHeader: { height: 60, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  brandTitle: { color: COLORS.primary, fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  centerSection: { flex: 1, justifyContent: 'center' },
  settingsMain: { flex: 1, paddingTop: 20, alignItems: 'center' },
  sectionHeading: { fontSize: 20, fontWeight: '700', color: COLORS.textMain, marginBottom: 12, alignSelf: 'flex-start' },
  description: { color: COLORS.textSub, fontSize: 15, lineHeight: 22, marginBottom: 30 },
  
  // Generic Glass Tile for New Patient View
  glassTile: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.glassBg, 
    padding: 20, 
    borderRadius: BORDER_RADIUS.card, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: COLORS.glassBorder || 'rgba(255, 255, 255, 0.3)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    width: '100%'
  },

  // Refined Glass Card for Settings
  glassCard: {
    width: '100%',
    backgroundColor: COLORS.glassBg,
    borderRadius: BORDER_RADIUS.card,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  
  iconBox: { width: 48, height: 48, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1, marginLeft: 15 },
  tileMainText: { fontWeight: '700', fontSize: 17, color: COLORS.textMain },
  tileSubText: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  
  // Settings Specific Styles
  infoSection: { marginBottom: 15, paddingHorizontal: 5 },
  label: { fontSize: 12, color: COLORS.textSub, marginBottom: 4, fontFamily: 'Inter-Medium' },
  emailText: { fontSize: 16, color: COLORS.textMain, fontFamily: 'Inter-SemiBold' },
  separator: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 5 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 15, color: COLORS.textMain, fontFamily: 'Inter-Medium' },
  versionText: { marginTop: 20, color: COLORS.textSub, fontSize: 11, textAlign: 'center' },
});