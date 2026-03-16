import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../constants/theme';

/**
 * BottomNav Component
 * * High-end navigation bar for PramanAI.
 * Features:
 * - Dynamic path matching with group folder stripping.
 * - Specialized styling for the 'Analyze' primary action.
 * - Glassmorphism effects with subtle borders.
 */
export function BottomNav({ tabs }: { tabs: any[] }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {tabs.map((tab) => {
          // 1. CLEAN PATHS
          const cleanTabPath = tab.path.replace(/\/\(.*\)\//, '').replace(/^\/|\/$/g, '');
          const cleanPathname = pathname.replace(/\/\(.*\)\//, '').replace(/^\/|\/$/g, '');
          
          // 2. REFINED MATCHING (Parent-aware)
          // We check if the current path starts with the tab path 
          // (e.g., /patient/details should highlight the /patient tab)
          const isHome = cleanTabPath === '' || cleanTabPath === 'index';
          const isActive = isHome 
            ? (cleanPathname === '' || cleanPathname === 'index')
            : cleanPathname.startsWith(cleanTabPath);

          const isAnalyzeTab = tab.name === 'Analyze';

          return (
            <TouchableOpacity 
              key={tab.name} 
              style={styles.tabItem} 
              activeOpacity={0.7}
              onPress={() => router.replace(tab.path as any)}
            >
              {/* Specialized 'Analyze' Button handling */}
              <View style={[
                styles.iconContainer,
                isAnalyzeTab && styles.analyzeIconContainer,
                isAnalyzeTab && isActive && { backgroundColor: COLORS.secondary }
              ]}>
                <Ionicons 
                  name={isActive ? (tab.icon as any) : `${tab.icon}-outline`} 
                  size={isAnalyzeTab ? 28 : 24} 
                  color={isActive ? (isAnalyzeTab ? COLORS.white : COLORS.secondary) : COLORS.textSub} 
                />
              </View>

              <Text style={[
                styles.tabLabel, 
                { 
                  color: isActive ? COLORS.secondary : COLORS.textSub, 
                  fontWeight: isActive ? '700' : '400',
                  opacity: isActive ? 1 : 0.8 // Subtle focus
                },
              ]}>
                {tab.name}
              </Text>
              
              {/* Dot indicator for standard tabs */}
              {isActive && !isAnalyzeTab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20, 
    left: 16,
    right: 16,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlay || 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24, 
    height: 75,
    ...SHADOWS.soft,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1,
    height: '100%'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  analyzeIconContainer: {
    backgroundColor: 'rgba(30, 93, 87, 0.1)', 
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginBottom: 2,
  },
  tabLabel: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 10, 
    marginTop: 2,
    textAlign: 'center'
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
    position: 'absolute',
    bottom: 8,
  }
});