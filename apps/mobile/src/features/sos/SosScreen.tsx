import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { SosButton } from './SosButton';
import { useSos, PoiResult } from './useSos';
import { useLocation } from '@shared/hooks/useLocation';
import { theme } from '@shared/theme/theme';

export function SosScreen() {
  const { location, errorMsg: locationError } = useLocation();
  const { activateSos, results, contactedFacilities, isSearching, searchRadius, errorMsg: sosError } = useSos(location);

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
        {locationError || sosError ? (
          <Text style={styles.errorText}>{locationError || sosError}</Text>
        ) : location ? (
          <Text style={styles.locationText}>Location Active (±{Math.round(location.accuracy)}m)</Text>
        ) : (
          <Text style={styles.locationText}>Acquiring GPS...</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <SosButton 
          onActivate={activateSos} 
          disabled={isSearching} 
          gpsUnavailable={!location && !!locationError} 
        />
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

      {/* Non-dismissable contacted facilities overlay */}
      {contactedFacilities.length > 0 && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>EMERGENCY CONTACTED</Text>
          {contactedFacilities.map(cf => (
            <View key={cf.poi.osmId} style={styles.contactedCard}>
              <Text style={styles.contactedName}>{cf.poi.name}</Text>
              <Text style={styles.contactedType}>{cf.poi.category.toUpperCase()} - {cf.distanceKm.toFixed(1)}km</Text>
              <Text style={styles.contactedPhone}>{cf.poi.phone || 'No phone'}</Text>
            </View>
          ))}
          <Text style={styles.overlayFooter}>Help is on the way. Stay calm.</Text>
        </View>
      )}
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
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    zIndex: 1000,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.sosRed,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    letterSpacing: 1,
  },
  contactedCard: {
    backgroundColor: '#222',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.sosRed,
  },
  contactedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  contactedType: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
  },
  contactedPhone: {
    fontSize: 16,
    color: '#66B2FF',
    fontWeight: '600',
  },
  overlayFooter: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontWeight: '600',
  }
});

