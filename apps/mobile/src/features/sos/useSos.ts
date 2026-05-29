import { useState, useCallback, useMemo } from 'react';
import { useRealm } from '@realm/react';
import { PoiRepository } from '@core/db/PoiRepository';
import { PoiObject } from '@core/db/RealmConfig';
import { expandBoundingBox } from '@core/geo/BoundingBox';
import { getDistance } from '@core/geo/haversine';
import { UserLocation } from '@shared/hooks/useLocation';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@core/utils/Logger';

export interface PoiResult {
  poi: PoiObject;
  distanceKm: number;
}

export function useSos(location: UserLocation | null) {
  const realm = useRealm();
  const repo = useMemo(() => new PoiRepository(realm), [realm]);

  const [results, setResults] = useState<PoiResult[]>([]);
  const [contactedFacilities, setContactedFacilities] = useState<PoiResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activateSos = useCallback(async () => {
    setErrorMsg(null);
    setIsSearching(true);
    try {
      let activeLocation = location;
      if (!activeLocation) {
        const lastKnown = await AsyncStorage.getItem('roadsos_last_location');
        if (lastKnown) {
          activeLocation = JSON.parse(lastKnown);
        }
      }

      if (!activeLocation) {
        throw new Error('GPS unavailable and no last known location found.');
      }

      const bbox = expandBoundingBox(activeLocation.lat, activeLocation.lon, 25);
      const rawResults = repo.getNearby(bbox, ['hospital', 'trauma_centre', 'ambulance_station', 'police', 'towing', 'puncture_shop', 'fire_station', 'pharmacy']);
      
      const withDistance: PoiResult[] = rawResults.map(poi => ({
        poi,
        distanceKm: getDistance(activeLocation!.lat, activeLocation!.lon, poi.lat, poi.lon)
      }));

      // Set results for the UI list
      const sortedResults = [...withDistance].sort((a, b) => a.distanceKm - b.distanceKm);
      setResults(sortedResults);

      // Extract police and medical
      const police = withDistance.filter(r => r.poi.category === 'police').sort((a, b) => a.distanceKm - b.distanceKm);
      const medical = withDistance.filter(r => ['hospital', 'trauma_centre', 'ambulance_station'].includes(r.poi.category)).sort((a, b) => a.distanceKm - b.distanceKm);

      const toContact: PoiResult[] = [];
      const nearestPolice = police[0];
      const nearestMedical = medical[0];

      if (nearestPolice) toContact.push(nearestPolice);
      if (nearestMedical) toContact.push(nearestMedical);

      setContactedFacilities(toContact);

      const dialOrMap = (poi: PoiObject) => {
        if (poi.phone) {
          Linking.openURL(`tel:${poi.phone}`).catch(err => {
            Logger.error(`Failed to dial ${poi.phone}`, err);
          });
        } else {
          const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
          const latLng = `${poi.lat},${poi.lon}`;
          const url = Platform.select({
            ios: `${scheme}${poi.name}@${latLng}`,
            android: `${scheme}${latLng}(${poi.name})`
          });
          if (url) Linking.openURL(url).catch(err => Logger.error('Failed to open map', err));
        }
      };

      if (nearestPolice) {
        dialOrMap(nearestPolice.poi);
        if (nearestMedical) {
          setTimeout(() => dialOrMap(nearestMedical.poi), 3000);
        }
      } else if (nearestMedical) {
        dialOrMap(nearestMedical.poi);
      } else if (sortedResults.length > 0) {
          // If no police or medical, dial the nearest of whatever we found
          dialOrMap(sortedResults[0].poi);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error during SOS activation';
      Logger.error(`[useSos] ${msg}`);
      setErrorMsg(msg);
    } finally {
      setIsSearching(false);
    }
  }, [location, repo]);

  return { activateSos, results, contactedFacilities, isSearching, searchRadius, errorMsg };
}

