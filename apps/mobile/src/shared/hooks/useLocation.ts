import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) setErrorMsg('Permission to access location was denied');
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (isMounted) {
          setLocation({
            lat: loc.coords.latitude,
            lon: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? 0,
            timestamp: loc.timestamp,
          });
        }
      } catch (err) {
        if (isMounted) setErrorMsg('Could not fetch location');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return { location, errorMsg };
}
