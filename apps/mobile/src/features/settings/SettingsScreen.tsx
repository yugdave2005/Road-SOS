import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@shared/theme/theme';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('DownloadZone')}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Configure download zone"
      >
        <Text style={styles.menuTitle}>Download Zone</Text>
        <Text style={styles.menuSubtitle}>Configure Home Zone for offline caching</Text>
      </TouchableOpacity>

      <View style={styles.menuItem}>
        <Text style={styles.menuTitle}>Data Usage</Text>
        <Text style={styles.menuSubtitle}>POIs are stored locally using Realm DB</Text>
      </View>

      <View style={styles.menuItem}>
        <Text style={styles.menuTitle}>About ROADSOS</Text>
        <Text style={styles.menuSubtitle}>v1.0.0 — Offline-First Emergency Response</Text>
      </View>

      <View style={styles.attribution}>
        <Text style={styles.attributionText}>
          Map data © OpenStreetMap contributors
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  menuItem: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  menuTitle: {
    ...theme.typography.poiName,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  menuSubtitle: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
  },
  attribution: {
    marginTop: 'auto' as any,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  attributionText: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.disabled,
  },
});
