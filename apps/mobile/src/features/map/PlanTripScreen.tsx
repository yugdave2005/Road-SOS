import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { theme } from '@shared/theme/theme';
import { useLocation } from '@shared/hooks/useLocation';
import { SyncManager } from '@core/db/SyncManager';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function PlanTripScreen({ navigation }: any) {
  const { location } = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const searchDestination = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`, {
        headers: { 'User-Agent': 'ROADSOS-App/1.0' }
      });
      const data = await res.json();
      setResults(data);
    } catch (e) {
      Alert.alert('Search Error', 'Could not find destination.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectDestination = async (dest: SearchResult) => {
    if (!location) {
      Alert.alert('No GPS', 'Cannot plan trip without current location.');
      return;
    }

    setIsDownloading(true);
    try {
      // Fetch OSRM Route
      const start = `${location.lon},${location.lat}`;
      const end = `${dest.lon},${dest.lat}`;
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start};${end}?geometries=geojson&overview=simplified`;
      
      const res = await fetch(osrmUrl);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('Could not find a route.');
      }

      // GeoJSON LineString coordinates are [lon, lat]
      const coords: [number, number][] = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]); // Convert to [lat, lon]

      const sessionId = `trip_${Date.now()}`;
      await SyncManager.downloadTripCorridor(sessionId, coords, 15);

      Alert.alert('Success', 'Trip corridor cached! You can now travel offline.', [
        { text: 'OK', onPress: () => navigation.navigate('MapMain', { tripSessionId: sessionId, route: coords }) }
      ]);
    } catch (e: any) {
      Alert.alert('Trip Planning Failed', e.message || 'Error occurred.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => selectDestination(item)}>
      <Text style={styles.resultText}>{item.display_name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan Offline Trip</Text>
      <Text style={styles.subtitle}>
        Search for a destination. We will calculate the route and download all emergency POIs within a 15km corridor along your path.
      </Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Enter destination (e.g., London, UK)"
          placeholderTextColor={theme.colors.text.disabled}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchDestination} disabled={isSearching}>
          {isSearching ? <ActivityIndicator color="#000" /> : <Text style={styles.searchBtnText}>Search</Text>}
        </TouchableOpacity>
      </View>

      {isDownloading && (
        <View style={styles.downloadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.policeBlue} />
          <Text style={styles.downloadingText}>Downloading trip corridor...</Text>
        </View>
      )}

      {!isDownloading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id.toString()}
          renderItem={renderItem}
          style={styles.list}
        />
      )}
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
  searchRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
    height: 50,
  },
  searchButton: {
    backgroundColor: theme.colors.policeBlue,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  searchBtnText: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  resultText: {
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  downloadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadingText: {
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    fontSize: 16,
    fontWeight: '600',
  }
});
