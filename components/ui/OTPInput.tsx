import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/theme';

interface OTPInputProps {
  code: string[];
  setCode: (code: string[]) => void;
}

export const OTPInput = ({ code, setCode }: OTPInputProps) => {
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    const cleanedText = text.replace(/[^0-9]/g, '');
    const newCode = [...code];
    newCode[index] = cleanedText;
    setCode(newCode);

    // Auto-focus next box
    if (cleanedText && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    // Handle backspace to go to previous box
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => { inputs.current[index] = el; }}
          style={[
            styles.otpBox,
            // Dynamic border color based on focus/content
            { 
              borderColor: digit ? COLORS.secondary : COLORS.border,
              backgroundColor: digit ? COLORS.white : 'rgba(255, 255, 255, 0.6)'
            }
          ]}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          value={digit}
          selectionColor={COLORS.secondary}
          // Important for Inter font alignment
          textAlignVertical="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', // Centered for the new AuthLayout
    gap: 10,                  // Consistent spacing
    marginTop: 20, 
    marginBottom: 20 
  },
  otpBox: { 
    width: 48, 
    height: 58, 
    borderWidth: 1.5, 
    borderRadius: BORDER_RADIUS.button, 
    textAlign: 'center', 
    // Applying Inter-Bold from theme
    fontFamily: TYPOGRAPHY.boldText.fontFamily,
    fontSize: 22, 
    color: COLORS.textMain, 
    // Soft shadow for depth
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
});