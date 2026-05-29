import { PoiRepository } from '@core/db/PoiRepository';
import { Logger } from '@core/utils/Logger';

/* eslint-disable @typescript-eslint/no-var-requires */
const hospitalData = require('../../../assets/data/hospital.json');
const traumaCentreData = require('../../../assets/data/trauma_centre.json');
const policeData = require('../../../assets/data/police.json');
const ambulanceStationData = require('../../../assets/data/ambulance_station.json');
const towingData = require('../../../assets/data/towing.json');
const punctureShopData = require('../../../assets/data/puncture_shop.json');
const fireStationData = require('../../../assets/data/fire_station.json');
const pharmacyData = require('../../../assets/data/pharmacy.json');
/* eslint-enable @typescript-eslint/no-var-requires */

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    osm_id: number;
    name: string;
    category: string;
    phone: string | null;
    address: string | null;
    city: string;
    country: string;
    last_updated: number;
    data_source: string;
  };
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

interface CategoryDataEntry {
  label: string;
  data: GeoJsonCollection;
}

const CATEGORY_FILES: CategoryDataEntry[] = [
  { label: 'hospital', data: hospitalData as GeoJsonCollection },
  { label: 'trauma_centre', data: traumaCentreData as GeoJsonCollection },
  { label: 'police', data: policeData as GeoJsonCollection },
  { label: 'ambulance_station', data: ambulanceStationData as GeoJsonCollection },
  { label: 'towing', data: towingData as GeoJsonCollection },
  { label: 'puncture_shop', data: punctureShopData as GeoJsonCollection },
  { label: 'fire_station', data: fireStationData as GeoJsonCollection },
  { label: 'pharmacy', data: pharmacyData as GeoJsonCollection },
];

function featuresToPoiRecords(features: GeoJsonFeature[]) {
  return features.map((feature) => ({
    osmId: feature.properties.osm_id,
    lat: feature.geometry.coordinates[1],
    lon: feature.geometry.coordinates[0],
    category: feature.properties.category,
    name: feature.properties.name,
    phone: feature.properties.phone ?? undefined,
    address: feature.properties.address ?? undefined,
    lastUpdated: feature.properties.last_updated,
    dataSource: feature.properties.data_source,
  }));
}

/**
 * PoiDataLoader reads bundled GeoJSON data files and seeds
 * the Realm database on first launch (when the DB is empty).
 *
 * This runs synchronously during app initialisation, before
 * the SOS screen mounts, so POI data is always available
 * for offline queries.
 *
 * Zero network calls — all data comes from bundled assets.
 */
export class PoiDataLoader {
  /**
   * Seeds Realm with bundled POI data if the database is empty.
   * Skips seeding if any records already exist (idempotent).
   */
  static async seedIfEmpty(repo: PoiRepository): Promise<void> {
    const existingCount = repo.count();

    if (existingCount > 0) {
      Logger.info(
        `[PoiDataLoader] Database already has ${existingCount} records — skipping seed.`
      );
      return;
    }

    Logger.info('[PoiDataLoader] Database is empty — seeding from bundled GeoJSON...');

    let totalSeeded = 0;

    for (const entry of CATEGORY_FILES) {
      try {
        const features = entry.data.features;

        if (!features || features.length === 0) {
          Logger.warn(`[PoiDataLoader] No features found in ${entry.label}.geojson`);
          continue;
        }

        const records = featuresToPoiRecords(features);
        repo.upsertBatch(records);

        totalSeeded += records.length;
        Logger.info(
          `[PoiDataLoader] Seeded ${records.length} records for category: ${entry.label}`
        );
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        Logger.error(
          `[PoiDataLoader] Failed to seed category ${entry.label}: ${message}`
        );
      }
    }

    Logger.info(
      `[PoiDataLoader] Seeding complete. Total records: ${totalSeeded}`
    );
  }
}
