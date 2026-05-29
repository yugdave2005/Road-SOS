import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pressable, Text, StyleSheet, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@shared/theme/theme';

interface SosButtonProps {
  onActivate: () => void;
  disabled?: boolean;
  gpsUnavailable?: boolean;
}

export function SosButton({ onActivate, disabled = false, gpsUnavailable = false }: SosButtonProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
    setCountdown(null);
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const handlePressIn = useCallback(() => {
    if (disabled || gpsUnavailable) return;
    
    setCountdown(5);
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        }
        return prev;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      clearTimers();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Vibration.vibrate([0, 100, 50, 100]);
      onActivate();
    }, 5000);
  }, [disabled, gpsUnavailable, clearTimers, onActivate]);

  const handlePressOut = useCallback(() => {
    if (countdown !== null) {
      clearTimers();
    }
  }, [countdown, clearTimers]);

  return (
    <Pressable
      style={[styles.button, (disabled || gpsUnavailable) && styles.disabled]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || gpsUnavailable}
      accessible
      accessibilityRole="button"
      accessibilityLabel="SOS Emergency Button"
      accessibilityHint={gpsUnavailable ? "GPS unavailable" : "Hold for 5 seconds to activate emergency response"}
    >
      {gpsUnavailable ? (
        <Text style={styles.label}>GPS OFF</Text>
      ) : countdown !== null ? (
        <Text style={[styles.label, { fontSize: 80 }]}>{countdown}</Text>
      ) : (
        <>
          <Text style={styles.label}>SOS</Text>
          <Text style={styles.sublabel}>HOLD 5 SECONDS</Text>
        </>
      )}
    </Pressable>
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

