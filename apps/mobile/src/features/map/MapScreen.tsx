import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { UrlTile, Region, Circle, Polyline } from 'react-native-maps';
import { useLocation } from '@shared/hooks/useLocation';
import { useNearbyPois } from './useNearbyPois';
import { PoiMarker } from './PoiMarker';
import { OfflineTileManager } from '@core/geo/OfflineTileManager';
import { theme } from '@shared/theme/theme';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@core/utils/Logger';
import { useRoute, useNavigation } from '@react-navigation/native';
import { PoiRepository } from '@core/db/PoiRepository';
import { useRealm } from '@realm/react';

function MapContent() {
  const { location, errorMsg } = useLocation();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [tileUrl, setTileUrl] = useState<string | null>(null);
  const [isOnlineFallback, setIsOnlineFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lon: number } | null>(null);
  
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const realm = useRealm();
  
  const tripSessionId = route.params?.tripSessionId;
  const tripRoute = route.params?.route as [number, number][] | undefined;
  
  const [tripPois, setTripPois] = useState<any[]>([]);

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
      }
    }

    initMap();
  }, []);

  useEffect(() => {
    if (tripSessionId && isReady) {
      const repo = new PoiRepository(realm);
      setTripPois(repo.getByTripSession(tripSessionId));
    } else {
      setTripPois([]);
    }
  }, [tripSessionId, isReady]);

  const centerLat = mapCenter?.lat ?? location?.lat ?? 51.5074;
  const centerLon = mapCenter?.lon ?? location?.lon ?? -0.1278;
  
  // Local Realm query, no network
  const pois = useNearbyPois({ lat: centerLat, lon: centerLon, radiusKm: 25 });
  
  // Merge regular POIs with trip POIs if a trip is active
  const displayPois = tripSessionId ? [...pois, ...tripPois] : pois;

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.policeBlue} />
        <Text style={styles.loadingText}>Initializing Map...</Text>
      </View>
    );
  }

  const handlePlanTrip = () => {
    navigation.navigate('PlanTrip');
  };

  const handleClearTrip = () => {
    if (tripSessionId) {
      const repo = new PoiRepository(realm);
      repo.clearTripSession(tripSessionId);
      navigation.setParams({ tripSessionId: undefined, route: undefined });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: tripRoute?.[0]?.[0] ?? centerLat,
          longitude: tripRoute?.[0]?.[1] ?? centerLon,
          latitudeDelta: tripRoute ? 0.5 : 0.1,
          longitudeDelta: tripRoute ? 0.5 : 0.1,
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

        {tripRoute && (
          <Polyline 
            coordinates={tripRoute.map(c => ({ latitude: c[0], longitude: c[1] }))} 
            strokeColor={theme.colors.policeBlue}
            strokeWidth={4}
          />
        )}

        {displayPois.map((poi, idx) => (
          <PoiMarker 
            key={`${poi.osmId}-${idx}`} 
            poi={poi} 
            userLocation={location}
          />
        ))}
      </MapView>

      <View style={styles.topActions}>
        <TouchableOpacity style={styles.planTripBtn} onPress={handlePlanTrip}>
          <Text style={styles.planTripText}>Plan Offline Trip</Text>
        </TouchableOpacity>
      </View>

      {tripSessionId && (
        <View style={styles.tripBanner}>
          <Text style={styles.tripBannerText}>Active Trip Corridor ({tripPois.length} POIs)</Text>
          <TouchableOpacity onPress={handleClearTrip} style={styles.clearTripBtn}>
            <Text style={styles.clearTripText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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
  topActions: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
  },
  planTripBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  planTripText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  tripBanner: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.policeBlue,
    padding: 12,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  tripBannerText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  clearTripBtn: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  clearTripText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
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


