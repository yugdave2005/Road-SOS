import Realm from 'realm';
import { PoiObject } from './RealmConfig';
import { BoundingBox } from '../geo/BoundingBox';

export class PoiRepository {
  constructor(private realm: Realm) {}

  getNearby(bbox: BoundingBox, categories?: string[]): PoiObject[] {
    let query = this.realm
      .objects<PoiObject>('Poi')
      .filtered(
        'lat >= $0 AND lat <= $1 AND lon >= $2 AND lon <= $3',
        bbox.minLat, bbox.maxLat, bbox.minLon, bbox.maxLon
      );

    if (categories && categories.length > 0) {
      const categoryFilter = categories.map((_, i) => `category == $${i + 4}`).join(' OR ');
      query = query.filtered(categoryFilter, ...categories);
    }

    return Array.from(query);
  }

  upsertBatch(pois: Partial<PoiObject>[]): void {
    this.realm.write(() => {
      for (const poi of pois) {
        this.realm.create('Poi', poi, Realm.UpdateMode.Modified);
      }
    });
  }

  getByOsmId(osmId: number): PoiObject | undefined {
    return this.realm.objectForPrimaryKey<PoiObject>('Poi', osmId) ?? undefined;
  }

  count(): number {
    return this.realm.objects('Poi').length;
  }
}
