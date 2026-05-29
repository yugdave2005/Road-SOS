import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { PoiObject } from '@core/db/RealmConfig';
import { theme } from '@shared/theme/theme';
import { getDistance } from '@core/geo/haversine';
import { UserLocation } from '@shared/hooks/useLocation';

interface PoiMarkerProps {
  poi: PoiObject;
  userLocation?: UserLocation | null;
}

export function PoiMarker({ poi, userLocation }: PoiMarkerProps) {
  const getColor = (category: string) => {
    switch (category) {
      case 'hospital': return theme.colors.sosRed;
      case 'trauma_centre': return theme.colors.sosRed;
      case 'fire_station': return '#8B0000'; // Dark Red
      case 'police': return theme.colors.policeBlue;
      case 'ambulance_station': return theme.colors.ambulanceGreen;
      case 'towing': 
      case 'car_repair': return theme.colors.towingOrange;
      case 'puncture_shop': return '#FFD700'; // Yellow
      case 'pharmacy': return '#800080'; // Purple
      default: return theme.colors.text.disabled;
    }
  };

  const distanceText = userLocation 
    ? `${getDistance(userLocation.lat, userLocation.lon, poi.lat, poi.lon).toFixed(1)} km away`
    : '';

  const openMap = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${poi.lat},${poi.lon}`;
    const url = Platform.select({
      ios: `${scheme}${poi.name}@${latLng}`,
      android: `${scheme}${latLng}(${poi.name})`
    });
    if (url) Linking.openURL(url);
  };

  return (
    <Marker
      coordinate={{ latitude: poi.lat, longitude: poi.lon }}
      pinColor={getColor(poi.category)}
    >
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.poiName}>{poi.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{poi.category.toUpperCase()}</Text>
          </View>
          {distanceText ? <Text style={styles.distanceText}>{distanceText}</Text> : null}
          
          <View style={styles.actions}>
            {poi.phone && (
              <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(`tel:${poi.phone}`)}>
                <Text style={styles.buttonText}>Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, styles.navButton]} onPress={openMap}>
              <Text style={styles.buttonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    width: 250,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  poiName: {
    ...theme.typography.poiName,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
  },
  badgeText: {
    ...theme.typography.badge,
    color: theme.colors.text.secondary,
  },
  distanceText: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  button: {
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
  buttonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  }
});

