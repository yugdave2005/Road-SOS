import React from 'react';
import { Marker } from 'react-native-maps';
import { PoiObject } from '@core/db/RealmConfig';
import { theme } from '@shared/theme/theme';

interface PoiMarkerProps {
  poi: PoiObject;
  onPress?: () => void;
}

export function PoiMarker({ poi, onPress }: PoiMarkerProps) {
  const getColor = (category: string) => {
    switch (category) {
      case 'hospital': return theme.colors.sosRed;
      case 'police': return theme.colors.policeBlue;
      case 'ambulance_station': return theme.colors.ambulanceGreen;
      case 'towing': 
      case 'car_repair': return theme.colors.towingOrange;
      default: return theme.colors.text.disabled;
    }
  };

  return (
    <Marker
      coordinate={{ latitude: poi.lat, longitude: poi.lon }}
      title={poi.name}
      description={poi.category.toUpperCase()}
      pinColor={getColor(poi.category)}
      onCalloutPress={onPress}
    />
  );
}
