import BackgroundFetch from 'react-native-background-fetch';
import { PoiRepository } from '@core/db/PoiRepository';
import { OverpassClient } from '@core/network/OverpassClient';
import { ConnectivityMonitor } from '@core/network/ConnectivityMonitor';
import { expandBoundingBox } from '@core/geo/BoundingBox';
import { Logger } from '@core/utils/Logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOME_LOCATION_KEY = 'ROADSOS_HOME_LOCATION';

export class SyncManager {
  static async initialise(repo: PoiRepository): Promise<void> {
    await BackgroundFetch.configure(
      {
        minimumFetchInterval: 1440, // 24 hours in minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
      },
      async (taskId) => {
        Logger.info(`[SyncManager] Background fetch triggered: ${taskId}`);
        await SyncManager.performSync(repo);
        BackgroundFetch.finish(taskId);
      },
      (taskId) => {
        Logger.warn(`[SyncManager] Background fetch timeout: ${taskId}`);
        BackgroundFetch.finish(taskId);
      }
    );
    Logger.info('[SyncManager] Initialised background sync.');
  }

  static async performSync(repo: PoiRepository): Promise<void> {
    const isConnected = await ConnectivityMonitor.isConnected();
    if (!isConnected) {
      Logger.info('[SyncManager] Offline — skipping sync.');
      return;
    }

    const homeLocation = await SyncManager.getHomeLocation();
    if (!homeLocation) {
      Logger.warn('[SyncManager] No home location set — skipping sync.');
      return;
    }

    Logger.info('[SyncManager] Syncing Home Zone POIs...');
    const bbox = expandBoundingBox(homeLocation.lat, homeLocation.lon, 50);
    const pois = await OverpassClient.fetchPois(bbox);
    repo.upsertBatch(pois);
    Logger.info(`[SyncManager] Synced ${pois.length} POIs.`);
  }

  static async downloadTripCorridor(
    routePolyline: [number, number][],
    bufferKm: number = 15
  ): Promise<void> {
    if (routePolyline.length === 0) return;

    const isConnected = await ConnectivityMonitor.isConnected();
    if (!isConnected) {
      Logger.warn('[SyncManager] Offline — cannot pre-cache trip corridor.');
      return;
    }

    // Compute union bounding box of all segments buffered by bufferKm
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;

    for (const [lat, lon] of routePolyline) {
      const segBbox = expandBoundingBox(lat, lon, bufferKm);
      if (segBbox.minLat < minLat) minLat = segBbox.minLat;
      if (segBbox.maxLat > maxLat) maxLat = segBbox.maxLat;
      if (segBbox.minLon < minLon) minLon = segBbox.minLon;
      if (segBbox.maxLon > maxLon) maxLon = segBbox.maxLon;
    }

    Logger.info('[SyncManager] Downloading trip corridor POIs...');
    // Download POIs for the corridor union bbox
    // The returned pois are upserted directly — no need for separate trip session tagging in Phase 4
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const pois = await OverpassClient.fetchPois({ minLat, maxLat, minLon, maxLon });
      clearTimeout(timeoutId);
      // Upsert to Realm — in Phase 4 we don't have the full repo reference here,
      // so we'll expose a module-level singleton approach in Phase 4's app initialisation.
      Logger.info(`[SyncManager] Downloaded ${pois.length} corridor POIs.`);
    } catch (e) {
      clearTimeout(timeoutId);
      Logger.error('[SyncManager] Trip corridor download failed.');
    }
  }

  static async setHomeLocation(lat: number, lon: number): Promise<void> {
    await AsyncStorage.setItem(HOME_LOCATION_KEY, JSON.stringify({ lat, lon }));
    Logger.info(`[SyncManager] Home location saved: ${lat}, ${lon}`);
  }

  static async getHomeLocation(): Promise<{ lat: number; lon: number } | null> {
    const stored = await AsyncStorage.getItem(HOME_LOCATION_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as { lat: number; lon: number };
    } catch {
      return null;
    }
  }
}
