import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator, 
  View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline'; 
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;   
  disabled?: boolean;  
}

export const PrimaryButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle,
  loading = false,
  disabled = false,
}: ButtonProps) => {
  
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;

  // 🟢 FIX: Use "as const" to tell TypeScript these are fixed tuples
  const primaryGradient = ['#1E5D57', '#2D8279'] as const; 
  const secondaryGradient = ['#4FD1C5', '#38B2AC'] as const;

  const Content = () => (
    loading ? (
      <ActivityIndicator 
        color={isOutline ? COLORS.primary : "#FFFFFF"} 
        size="small"
      />
    ) : (
      <Text style={[
        styles.text, 
        isOutline && styles.outlineText, 
        textStyle
      ]}>
        {title}
      </Text>
    )
  );

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[styles.wrapper, style]}
    >
      {isOutline ? (
        <View style={[styles.button, styles.outlineButton, isDisabled && styles.disabledButton]}>
          <Content />
        </View>
      ) : (
        <LinearGradient
          colors={variant === 'primary' ? primaryGradient : secondaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, isDisabled && styles.disabledButton]}
        >
          <Content />
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    borderRadius: 16, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 56, 
  } as ViewStyle,
  text: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  } as TextStyle,

  
  outlineButton: {
  // 🟢 CHANGE: Use a semi-transparent white or the primary color 
  // based on the background. For the Welcome screen, we'll pass a style override.
  backgroundColor: 'rgba(255, 255, 255, 0.08)', 
  borderWidth: 1.5,
  borderColor: COLORS.primary,
  backdropFilter: 'blur(10px)', // For platforms that support it
} as ViewStyle,
  outlineText: {
    color: COLORS.primary,
  } as TextStyle,
  disabledButton: {
    opacity: 0.6, 
  } as ViewStyle,
});