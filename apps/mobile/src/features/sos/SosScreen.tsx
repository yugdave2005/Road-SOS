import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { SosButton } from './SosButton';
import { useSos, PoiResult } from './useSos';
import { useLocation } from '@shared/hooks/useLocation';
import { theme } from '@shared/theme/theme';

export function SosScreen() {
  const { location, errorMsg } = useLocation();
  const { triggerSos, results, isSearching, searchRadius } = useSos(location);

  const openMap = (lat: number, lon: number, name: string) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lon}`;
    const label = name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    if (url) Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: PoiResult }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.poiName}>{item.poi.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.poi.category.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.poiMeta}>Distance: {item.distanceKm.toFixed(1)} km</Text>
      
      <View style={styles.actions}>
        {item.poi.phone ? (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Linking.openURL(`tel:${item.poi.phone}`)}
          >
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          style={[styles.actionButton, styles.navButton]}
          onPress={() => openMap(item.poi.lat, item.poi.lon, item.poi.name)}
        >
          <Text style={styles.actionText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ROADSOS</Text>
        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : location ? (
          <Text style={styles.locationText}>Location Active (±{Math.round(location.accuracy)}m)</Text>
        ) : (
          <Text style={styles.locationText}>Acquiring GPS...</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <SosButton onPress={triggerSos} disabled={isSearching || !location} />
      </View>

      <View style={styles.resultsContainer}>
        {results.length > 0 && (
          <Text style={styles.resultsHeader}>
            Nearest Help ({searchRadius}km radius)
          </Text>
        )}
        <FlatList
          data={results}
          keyExtractor={(item) => item.poi.osmId.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.screenTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  locationText: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
  },
  errorText: {
    ...theme.typography.poiMeta,
    color: theme.colors.sosRed,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  poiName: {
    ...theme.typography.poiName,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  badgeText: {
    ...theme.typography.badge,
    color: theme.colors.text.secondary,
  },
  poiMeta: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  navButton: {
    backgroundColor: theme.colors.policeBlue,
    borderColor: theme.colors.policeBlue,
  },
  actionText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  }
});
