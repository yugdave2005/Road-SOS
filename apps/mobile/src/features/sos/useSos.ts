import { useState, useCallback, useMemo } from 'react';
import { useRealm } from '@realm/react';
import { PoiRepository } from '@core/db/PoiRepository';
import { PoiObject } from '@core/db/RealmConfig';
import { expandBoundingBox } from '@core/geo/BoundingBox';
import { getDistance } from '@core/geo/haversine';
import { UserLocation } from '@shared/hooks/useLocation';

export interface PoiResult {
  poi: PoiObject;
  distanceKm: number;
}

export function useSos(location: UserLocation | null) {
  const realm = useRealm();
  const repo = useMemo(() => new PoiRepository(realm), [realm]);

  const [results, setResults] = useState<PoiResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(25);

  const triggerSos = useCallback(() => {
    if (!location) return;
    setIsSearching(true);
    
    const categoryPriority: Record<string, number> = {
      hospital: 1,
      trauma_centre: 1,
      ambulance_station: 2,
      police: 3,
      towing: 4,
      car_repair: 4, 
    };

    const performSearch = (radius: number) => {
      setSearchRadius(radius);
      const bbox = expandBoundingBox(location.lat, location.lon, radius);
      
      const rawResults = repo.getNearby(bbox, ['hospital', 'trauma_centre', 'ambulance_station', 'police', 'towing', 'car_repair']);
      
      if (rawResults.length === 0 && radius === 25) {
        performSearch(100);
        return;
      }

      const withDistance: PoiResult[] = rawResults.map(poi => ({
        poi,
        distanceKm: getDistance(location.lat, location.lon, poi.lat, poi.lon)
      }));

      withDistance.sort((a, b) => {
        const priorityA = categoryPriority[a.poi.category] ?? 99;
        const priorityB = categoryPriority[b.poi.category] ?? 99;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.distanceKm - b.distanceKm;
      });

      setResults(withDistance);
      setIsSearching(false);
    };

    performSearch(25);
  }, [location, repo]);

  return { triggerSos, results, isSearching, searchRadius };
}
