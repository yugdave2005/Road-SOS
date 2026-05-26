import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@shared/theme/theme';

interface SosButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

export function SosButton({ onPress, disabled = false }: SosButtonProps) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Vibration.vibrate([0, 100, 50, 100]);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel="SOS Emergency Button"
      accessibilityHint="Activates emergency response and finds nearest help"
      activeOpacity={0.85}
    >
      <Text style={styles.label}>SOS</Text>
      <Text style={styles.sublabel}>EMERGENCY</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.sosRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FF3355',
  },
  disabled: {
    backgroundColor: theme.colors.sosDarkRed,
    opacity: 0.6,
  },
  label: {
    ...theme.typography.sosButton,
    color: theme.colors.text.primary,
  },
  sublabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFB3B3',
    letterSpacing: 3,
    marginTop: 4,
  },
});
