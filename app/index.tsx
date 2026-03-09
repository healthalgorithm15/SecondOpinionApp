
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  StatusBar, 
  Dimensions, 
  Platform,
  TextStyle,
  ViewStyle,
  ImageStyle,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { TYPOGRAPHY, COLORS, BORDER_RADIUS } from '../constants/theme';
import { STRINGS } from '../constants/Strings';
import { storage } from '../utils/storage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  // Inside your WelcomeScreen component, before the return statement:

useEffect(() => {
  const checkAutoLogin = async () => {
    try {
      const token = await storage.getItem('userToken');
      const rawRole = await storage.getItem('userRole');
      const role = rawRole ? rawRole.toLowerCase() : null;

      // If we have a token and a role, send them to their dashboard
      if (token && role) {
        if (role === 'admin') {
          router.replace('/(tabs)/admin-home');
        } else if (role === 'doctor') {
          // Note: We send doctors to home. If they need activation, 
          // your existing login/otp flow handles that specifically.
          router.replace('/(tabs)/doctor/doctor-home');
        } else if (role === 'patient') {
          router.replace('/(tabs)/patient/patienthome');
        }
      }
    } catch (e) {
      console.error("Auto-login check failed", e);
    }
  };

  checkAutoLogin();
}, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <Image 
        source={require('../assets/images/medical-bg.webp')} 
        style={[styles.backgroundImage, { opacity: isLoaded ? 1 : 0 }]}
        onLoad={() => setIsLoaded(true)}
        resizeMode="cover" 
      />

      {/* 🟢 IMPROVED SCRIM: Provides a clear readable area for top text and anchors the buttons at the bottom */}
      <LinearGradient
        colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.2)', 'rgba(15, 47, 44, 0.85)']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.contentLayer}>
        <View style={styles.mainWrapper}>
          
          <View style={styles.headerSection}>
            <Text style={styles.brandName}>{STRINGS.welcome.title}</Text>
            <Text style={styles.tagline}>{STRINGS.welcome.tagline}</Text>
            <Text style={styles.description}>{STRINGS.welcome.description}</Text>
          </View>

          <View style={styles.bulletSection}>
            {/* 🟢 ENHANCED GLASS CARD: Higher contrast and subtle border for a premium feel */}
            <View style={styles.bulletContainer}>
              <BulletItem text={STRINGS.welcome.bullet1} />
              <BulletItem text={STRINGS.welcome.bullet2} />
              <BulletItem text={STRINGS.welcome.bullet3} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title={STRINGS.welcome.getStarted}
              onPress={() => router.push('/auth/signup' as any)}
            />
            
            {/* 🟢 REFINED LOGIN: Outlined style with better visibility against the dark bottom scrim */}
            <TouchableOpacity 
              style={styles.outlineBtn}
              onPress={() => router.push('/auth/login' as any)}
            >
              <Text style={styles.outlineBtnText}>
                {STRINGS.common.alreadyAccount} 
                <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>{STRINGS.common.login}</Text>
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>{STRINGS.welcome.footerNote}</Text>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const BulletItem = ({ text }: { text: string }) => (
  <View style={styles.bulletRow}>
    <View style={styles.checkIconWrapper}>
       <Ionicons name="checkmark" size={16} color="#FFFFFF" />
    </View>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 } as ViewStyle,
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
  } as ImageStyle,
  contentLayer: { flex: 1 },
  mainWrapper: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 10,
    justifyContent: 'space-between'
  } as ViewStyle,
  headerSection: {
    marginTop: 10,
    alignItems: 'center',
  } as ViewStyle,
  brandName: {
    ...TYPOGRAPHY.brand,
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  } as TextStyle,
  tagline: {
    ...TYPOGRAPHY.header,
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 30,
  } as TextStyle,
  description: {
    ...TYPOGRAPHY.body,
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  } as TextStyle,
  bulletSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  } as ViewStyle,
  bulletContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: 24,
    borderRadius: BORDER_RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  } as ViewStyle,
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
  } as ViewStyle,
  checkIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  bulletText: {
    fontSize: 17,
    color: COLORS.textMain,
    fontWeight: '700',
  } as TextStyle,
  buttonContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'android' ? 40 : 20,
    gap: 10,
  } as ViewStyle,
  outlineBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  } as ViewStyle,
  outlineBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  footerNote: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 20,
    lineHeight: 18,
    marginTop: 10,
  } as TextStyle,
});