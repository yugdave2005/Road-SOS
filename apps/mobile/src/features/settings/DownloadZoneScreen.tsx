import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SyncManager } from '@core/db/SyncManager';
import { theme } from '@shared/theme/theme';

export default function DownloadZoneScreen() {
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentHome, setCurrentHome] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    SyncManager.getHomeLocation().then(setCurrentHome);
  }, []);

  const handleSave = async () => {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values.');
      return;
    }
    if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      Alert.alert('Out of Range', 'Latitude must be -90 to 90, longitude -180 to 180.');
      return;
    }

    setIsSaving(true);
    await SyncManager.setHomeLocation(parsedLat, parsedLon);
    setCurrentHome({ lat: parsedLat, lon: parsedLon });
    setIsSaving(false);
    
    Alert.alert(
      'Home Zone Saved', 
      `Home location set to ${parsedLat.toFixed(4)}, ${parsedLon.toFixed(4)}.\nPOIs within 50km will now sync in the background.`
    );
    
    // Trigger immediate sync
    SyncManager.performSync().catch(err => {
      // Background sync failures are handled internally, but we catch here just in case
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Download Zone</Text>
      <Text style={styles.subtitle}>
        Set your home location to automatically cache nearby emergency services (50km radius).
      </Text>

      {currentHome && (
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>Current Home Zone</Text>
          <Text style={styles.currentValue}>
            {currentHome.lat.toFixed(4)}, {currentHome.lon.toFixed(4)}
          </Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Latitude</Text>
        <TextInput
          style={styles.input}
          value={lat}
          onChangeText={setLat}
          placeholder="e.g. 28.6139"
          placeholderTextColor={theme.colors.text.disabled}
          keyboardType="numeric"
          accessible
          accessibilityLabel="Latitude input"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Longitude</Text>
        <TextInput
          style={styles.input}
          value={lon}
          onChangeText={setLon}
          placeholder="e.g. 77.2090"
          placeholderTextColor={theme.colors.text.disabled}
          keyboardType="numeric"
          accessible
          accessibilityLabel="Longitude input"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Save home zone location"
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Set Home Zone'}</Text>
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>
          • POIs within 50km of your home are synced every 24 hours{'\n'}
          • Sync happens in the background even when the app is closed{'\n'}
          • All data is stored locally for offline access{'\n'}
          • Trip corridors can be pre-cached before departure
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    paddingTop: 60,
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  currentCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderColor: theme.colors.ambulanceGreen,
    borderWidth: 1,
  },
  currentLabel: {
    ...theme.typography.badge,
    color: theme.colors.ambulanceGreen,
    marginBottom: theme.spacing.xs,
  },
  currentValue: {
    ...theme.typography.poiName,
    color: theme.colors.text.primary,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.policeBlue,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  infoTitle: {
    ...theme.typography.poiName,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});
