import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { COLORS } from '../../constants/theme';

export function BottomNav({ tabs }: { tabs: any[] }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {tabs.map((tab) => {
          // 🟢 Pro Logic: Matches exact path or the folder segment
          const isActive = tab.path === '/(tabs)' 
  ? pathname === '/(tabs)' || pathname === '/' 
  : pathname.includes(tab.path);
          
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
                color={isActive ? COLORS.secondary : '#94A3B8'} 
              />
              <Text style={[styles.tabLabel, { color: isActive ? COLORS.secondary : '#94A3B8' }]}>
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
    bottom: Platform.OS === 'ios' ? 20 : 80, // 🟢 Lifts the bar above system navigation
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.overlay,
    borderRadius: 5, // 🟢 Smooth rounding as seen in your mockup
    height: 70,
    // 🟢 Elevated shadow for the "floating" effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabItem: { alignItems: 'center', flex: 1 },
  tabLabel: { fontSize: 10, fontFamily: 'Inter-Medium', marginTop: 2 },
 activeIndicator: {
  width: 4,
  height: 4,
  borderRadius: 2, // Re-enable for the circular dot in mockup
  backgroundColor: COLORS.secondary, // Use secondary for the teal highlight
  marginTop: 4,
}
});