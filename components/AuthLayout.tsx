import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, SafeAreaView, Platform, Dimensions } from 'react-native';
import { STRINGS } from '../constants/Strings';
import { COLORS, TYPOGRAPHY } from '@/constants/theme';
import { KeyboardAvoidingView } from 'react-native';

const { height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scrollEnabled?: boolean; // 🟢 1. Add optional prop
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  scrollEnabled = true // 🟢 2. Default to true so other screens don't break
}: Props) {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../assets/images/medical-bg.webp')} 
        style={styles.background}
        resizeMode="cover" 
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
          <ScrollView 
            // 🟢 3. Pass the prop to the ScrollView
            scrollEnabled={scrollEnabled}
            contentContainerStyle={[
              styles.scrollContainer,
              // If scrolling is disabled, we want the container to fill the screen
              !scrollEnabled && { flex: 1 } 
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.headerSection}>
              <Text style={[styles.brandName, TYPOGRAPHY.brand]}>
                {STRINGS.common.appName}
              </Text>
              
              <View style={styles.titleWrapper}>
                {title && <Text style={[styles.headline, TYPOGRAPHY.header]}>{title}</Text>}
                {subtitle && <Text style={[styles.subtext, TYPOGRAPHY.body]}>{subtitle}</Text>}
              </View>
            </View>

            <View style={[styles.formSection, !scrollEnabled && { flex: 1 }]}>
              {children}
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  background: { flex: 1, width: '100%', height: '100%' },
  safeArea: { flex: 1 },
  scrollContainer: { 
    justifyContent: 'space-between', 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  headerSection: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    alignItems: 'center',
    width: '100%',
  },
  brandName: { color: COLORS.primary, marginBottom: 8 },
  titleWrapper: { paddingHorizontal: 30, alignItems: 'center' },
  headline: { color: COLORS.primary, textAlign: 'center', marginBottom: 4 },
  subtext: { color: COLORS.textSub, textAlign: 'center', lineHeight: 20 },
  formSection: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});