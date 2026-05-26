import { useState, useEffect, useMemo } from 'react';
import { useRealm } from '@realm/react';
import { PoiRepository } from '@core/db/PoiRepository';
import { PoiObject } from '@core/db/RealmConfig';
import { expandBoundingBox } from '@core/geo/BoundingBox';

interface UseNearbyPoisProps {
  lat: number;
  lon: number;
  radiusKm: number;
}

export function useNearbyPois({ lat, lon, radiusKm }: UseNearbyPoisProps) {
  const realm = useRealm();
  const repo = useMemo(() => new PoiRepository(realm), [realm]);
  const [pois, setPois] = useState<PoiObject[]>([]);

  useEffect(() => {
    if (!lat || !lon) return;
    
    // In a real app we'd debounce this or trigger it on map idle event
    const bbox = expandBoundingBox(lat, lon, radiusKm);
    
    // Fetch POIs across all categories for the map view
    const results = repo.getNearby(bbox);
    setPois(results);
  }, [lat, lon, radiusKm, repo]);

  return pois;
}
