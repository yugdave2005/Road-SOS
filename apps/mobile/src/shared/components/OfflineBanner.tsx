import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivityStore } from '@core/network/ConnectivityMonitor';
import { theme } from '@shared/theme/theme';

/**
 * OfflineBanner is ALWAYS visible when offline. Never hidden, never dismissable.
 * Per master prompt: "Offline banner is ALWAYS visible when offline."
 */
export function OfflineBanner() {
  const connectivityState = useConnectivityStore((s) => s.state);

  if (connectivityState === 'online') return null;

  const label = connectivityState === 'limited' ? 'LIMITED CONNECTIVITY' : 'OFFLINE';

  return (
    <View
      style={styles.banner}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`Device is ${label.toLowerCase()}`}
    >
      <Text style={styles.bannerText}>⚠ {label} — Using cached data</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.offlineBadge,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  bannerText: {
    ...theme.typography.badge,
    color: theme.colors.text.primary,
    letterSpacing: 1.5,
  },
});
