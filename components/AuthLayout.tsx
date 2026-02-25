import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ScrollView, SafeAreaView, Platform, Dimensions } from 'react-native';
import { STRINGS } from '../constants/Strings';
import { COLORS, TYPOGRAPHY } from '@/constants/theme';

const { height } = Dimensions.get('window');

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../assets/images/medical-bg.png')} 
        style={styles.background}
        // 🟢 'cover' can sometimes crop. 'contain' shows the whole image but might leave gaps.
        // We use 'cover' with specific alignment to keep the brain centered.
        resizeMode="cover" 
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* 🟢 Top Section: Brand Identity */}
            <View style={styles.headerSection}>
              <Text style={[styles.brandName, TYPOGRAPHY.brand]}>
                {STRINGS.common.appName}
              </Text>
              
              <View style={styles.titleWrapper}>
                {title && <Text style={[styles.headline, TYPOGRAPHY.header]}>{title}</Text>}
                {subtitle && <Text style={[styles.subtext, TYPOGRAPHY.body]}>{subtitle}</Text>}
              </View>
            </View>

            {/* 🟢 Bottom Section: The "Glass" Form */}
            <View style={styles.formSection}>
              {children}
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgScreen },
  background: { 
    flex: 1, 
    width: '100%', 
    height: '100%' 
  },
  safeArea: { flex: 1 },
  scrollContainer: { 
    //flexGrow: 1, 
    justifyContent: 'space-between', // 🟢 Forces brand to top and form to bottom/middle
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  headerSection: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    alignItems: 'center',
    width: '100%',
  },
  brandName: { 
    color: COLORS.primary, // 🟢 Uses theme deep teal
    marginBottom: 8,
  },
  titleWrapper: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  headline: { 
    color: COLORS.primary, 
    textAlign: 'center',
    marginBottom: 4 
  },
  subtext: { 
    color: COLORS.textSub, 
    textAlign: 'center', 
    lineHeight: 20 
  },
  formSection: {
    width: '100%',
    paddingHorizontal: 20, // 🟢 Gives space on sides to see the background edges
    marginBottom: 20,
  },
  
});