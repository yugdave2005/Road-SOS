import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { UrlTile, Region } from 'react-native-maps';
import { useLocation } from '@shared/hooks/useLocation';
import { useNearbyPois } from './useNearbyPois';
import { PoiMarker } from './PoiMarker';
import { OfflineTileManager } from '@core/geo/OfflineTileManager';
import { theme } from '@shared/theme/theme';

export default function MapScreen() {
  const { location } = useLocation();
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);

  const centerLat = mapCenter?.lat ?? location?.lat ?? 51.5074;
  const centerLon = mapCenter?.lon ?? location?.lon ?? -0.1278;
  
  const pois = useNearbyPois({ lat: centerLat, lon: centerLon, radiusKm: 15 });

  const tileUrl = OfflineTileManager.getTileUrlTemplate();

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
        mapType="none" // Important: disables Apple/Google default tiles
        showsUserLocation={true}
      >
        <UrlTile
          urlTemplate={tileUrl}
          maximumZ={14}
          offlineMode={true} // Enables aggressive caching if possible
        />
        
        {pois.map((poi) => (
          <PoiMarker 
            key={poi.osmId} 
            poi={poi} 
            onPress={() => {
              // Trigger detail view
            }} 
          />
        ))}
      </MapView>

      <View style={styles.attributionBar}>
        <Text style={styles.attributionText}>Map data © OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
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
