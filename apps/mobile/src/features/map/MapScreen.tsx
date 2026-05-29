import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import MapView, { UrlTile, Region, Circle } from 'react-native-maps';
import { useLocation } from '@shared/hooks/useLocation';
import { useNearbyPois } from './useNearbyPois';
import { PoiMarker } from './PoiMarker';
import { OfflineTileManager } from '@core/geo/OfflineTileManager';
import { theme } from '@shared/theme/theme';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@core/utils/Logger';

function MapContent() {
  const { location, errorMsg } = useLocation();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [isOnlineFallback, setIsOnlineFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    async function initMap() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required to show your position on the map.');
        }

        try {
          const url = OfflineTileManager.getTileUrlTemplate();
          // Simulating a check if local tiles exist. If not, we throw to force fallback.
          // For now, we assume no mbtiles are bundled, so we immediately fallback.
          throw new Error('Local tiles not found');
        } catch (e) {
          Logger.warn('Local tiles unavailable, falling back to OSM online tiles');
          setTileUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
          setIsOnlineFallback(true);
        }

        const homeStr = await AsyncStorage.getItem('roadsos_home_location');
        if (homeStr) {
          setHomeLocation(JSON.parse(homeStr));
        }

        setIsReady(true);
      } catch (err) {
        Logger.error('Map initialization failed', err);
        // ErrorBoundary will catch any throw during render, but async errors need to be handled
      }
    }

    initMap();
  }, []);

  const centerLat = mapCenter?.lat ?? location?.lat ?? 51.5074;
  const centerLon = mapCenter?.lon ?? location?.lon ?? -0.1278;
  
  // Local Realm query, no network
  const pois = useNearbyPois({ lat: centerLat, lon: centerLon, radiusKm: 25 });

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.policeBlue} />
        <Text style={styles.loadingText}>Initializing Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLon,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onRegionChangeComplete={(region: Region) => {
          setMapCenter({ lat: region.latitude, lon: region.longitude });
        }}
        mapType={isOnlineFallback ? "standard" : "none"}
        showsUserLocation={true}
      >
        {tileUrl && (
          <UrlTile
            urlTemplate={tileUrl}
            maximumZ={18}
            offlineMode={!isOnlineFallback}
            shouldReplaceMapContent={!isOnlineFallback}
          />
        )}
        
        {homeLocation && (
          <Circle
            center={{ latitude: homeLocation.lat, longitude: homeLocation.lon }}
            radius={50000} // 50km
            fillColor="rgba(0, 150, 255, 0.1)"
            strokeColor="rgba(0, 150, 255, 0.5)"
            strokeWidth={2}
          />
        )}

        {pois.map((poi) => (
          <PoiMarker 
            key={poi.osmId} 
            poi={poi} 
            userLocation={location}
          />
        ))}
      </MapView>

      {isOnlineFallback && (
        <View style={styles.onlineBadge}>
          <Text style={styles.onlineBadgeText}>Online Mode</Text>
        </View>
      )}

      <View style={styles.attributionBar}>
        <Text style={styles.attributionText}>Map data © OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

export default function MapScreen() {
  return (
    <ErrorBoundary fallbackMessage="The map failed to load properly. Please restart the app or check location permissions.">
      <MapContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.typography.poiMeta,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  map: {
    flex: 1,
  },
  onlineBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: theme.colors.towingOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineBadgeText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  attributionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  attributionText: {
    ...theme.typography.badge,
    color: theme.colors.text.secondary,
  }
});

