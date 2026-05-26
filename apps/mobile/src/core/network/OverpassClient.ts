import { BoundingBox } from '../geo/BoundingBox';
import { PoiObject } from '../db/RealmConfig';
import { ConnectivityMonitor } from './ConnectivityMonitor';

export class OverpassClient {
  static async fetchPois(bbox: BoundingBox): Promise<Partial<PoiObject>[]> {
    const bboxStr = `${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon}`;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](${bboxStr});
        node["amenity"="police"](${bboxStr});
        node["amenity"="fire_station"](${bboxStr});
        node["amenity"="pharmacy"](${bboxStr});
        node["emergency"="ambulance_station"](${bboxStr});
        node["shop"="tyres"](${bboxStr});
        node["shop"="car_repair"](${bboxStr});
      );
      out center tags;
    `;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        ConnectivityMonitor.setLimited();
        throw new Error('Overpass API error');
      }

      ConnectivityMonitor.setOnline();
      const data = await response.json();
      
      return this.parseOverpassJson(data);
    } catch (e) {
      ConnectivityMonitor.setLimited();
      throw e;
    }
  }

  private static parseOverpassJson(data: any): Partial<PoiObject>[] {
    const results: Partial<PoiObject>[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const element of data.elements || []) {
      let lat = element.lat;
      let lon = element.lon;
      
      if (!lat || !lon) {
        if (element.center) {
          lat = element.center.lat;
          lon = element.center.lon;
        } else {
          continue;
        }
      }

      const tags = element.tags || {};
      let category = 'unknown';
      if (tags.amenity === 'hospital' || tags.amenity === 'trauma_centre') category = 'hospital';
      else if (tags.amenity === 'police') category = 'police';
      else if (tags.emergency === 'ambulance_station') category = 'ambulance_station';
      else if (tags.amenity === 'pharmacy') category = 'pharmacy';
      else if (tags.amenity === 'fire_station') category = 'fire_station';
      else if (tags.shop === 'car_repair') category = 'car_repair';
      else if (tags.shop === 'tyres') category = 'towing'; // mapping tyres to towing/puncture
      
      results.push({
        osmId: element.id,
        lat,
        lon,
        category,
        name: tags.name || 'Unknown',
        phone: tags.phone || undefined,
        address: tags['addr:full'] || tags['addr:street'] || undefined,
        lastUpdated: now,
        dataSource: 'osm'
      });
    }

    return results;
  }
}
