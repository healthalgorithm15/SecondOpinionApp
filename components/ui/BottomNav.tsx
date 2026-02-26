import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../../constants/theme';

export function BottomNav({ tabs }: { tabs: any[] }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {tabs.map((tab) => {
          // 🟢 Pro Logic: Handles both root path and group paths correctly
          const isActive = tab.path === '' || tab.path === '/(tabs)'
            ? pathname === '/' || pathname === '/index'
            : pathname.includes(tab.path.replace('/(tabs)', ''));
          
          return (
            <TouchableOpacity 
              key={tab.name} 
              style={styles.tabItem} 
              activeOpacity={0.7}
              onPress={() => router.replace(tab.path as any)}
            >
              <Ionicons 
                name={isActive ? (tab.icon as any) : `${tab.icon}-outline`} 
                size={24} 
                color={isActive ? COLORS.secondary : COLORS.textSub} 
              />
              <Text style={[
                styles.tabLabel, 
                { color: isActive ? COLORS.secondary : COLORS.textSub }
              ]}>
                {tab.name}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
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
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlay,
    borderRadius: 20, 
    height: 70,
    ...SHADOWS.soft,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { 
    ...TYPOGRAPHY.caption, 
    fontSize: 10, 
    marginTop: 2 
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
    marginTop: 4,
  }
});