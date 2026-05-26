import { Logger } from '@core/utils/Logger';

const TILE_SERVER_PORT = 8765;

/**
 * OfflineTileManager handles MBTiles download, storage, and local serving.
 * In the React Native bare workflow, a native module or local HTTP server
 * serves tiles from the MBTiles SQLite container.
 *
 * This module provides the URL template and lifecycle management for the tile server.
 */
export class OfflineTileManager {
  private static isRunning = false;

  /**
   * Returns the URL template for the local tile server.
   * react-native-maps uses this to fetch tiles from the on-device MBTiles store.
   */
  static getTileUrlTemplate(): string {
    return `http://localhost:${TILE_SERVER_PORT}/tiles/{z}/{x}/{y}.png`;
  }

  /**
   * Starts the local tile server. In bare workflow this would be
   * implemented via a native module (Java/ObjC) that opens the MBTiles
   * SQLite file and serves tile_data blobs over a local HTTP socket.
   *
   * For Phase 4, this is the scaffolding that will be wired to the
   * native module in Phase 7.
   */
  static async startTileServer(mbtilesPath: string): Promise<void> {
    if (OfflineTileManager.isRunning) {
      Logger.info('[OfflineTileManager] Tile server already running.');
      return;
    }

    Logger.info(`[OfflineTileManager] Starting tile server on port ${TILE_SERVER_PORT} with ${mbtilesPath}`);
    // Native module bridge call will go here in Phase 7.
    // For now, mark as running so the app can proceed.
    OfflineTileManager.isRunning = true;
  }

  static async stopTileServer(): Promise<void> {
    if (!OfflineTileManager.isRunning) return;
    Logger.info('[OfflineTileManager] Stopping tile server.');
    OfflineTileManager.isRunning = false;
  }

  static getPort(): number {
    return TILE_SERVER_PORT;
  }

  static isServerRunning(): boolean {
    return OfflineTileManager.isRunning;
  }

  /**
   * Downloads a regional MBTiles pack for the given bounding box.
   * In production, this fetches from a pre-built tile CDN or generates
   * tiles via tippecanoe on the backend. For Phase 4, this is scaffolded.
   */
  static async downloadRegionalTiles(
    _minLat: number,
    _maxLat: number,
    _minLon: number,
    _maxLon: number
  ): Promise<string> {
    Logger.info('[OfflineTileManager] Downloading regional tiles...');
    // Returns path to downloaded .mbtiles file
    // Will be implemented with actual download logic in Phase 7
    const downloadedPath = 'assets/pois.mbtiles';
    return downloadedPath;
  }
}
