import Realm from 'realm';

export class PoiObject extends Realm.Object<PoiObject> {
  osmId!: number;
  lat!: number;
  lon!: number;
  category!: string;
  name!: string;
  phone?: string;
  address?: string;
  lastUpdated!: number;
  dataSource!: string;
  tripSessionId?: string; // Links POI to a specific trip caching session

  static schema: Realm.ObjectSchema = {
    name: 'Poi',
    primaryKey: 'osmId',
    properties: {
      osmId: 'int',
      lat: 'double',
      lon: 'double',
      category: { type: 'string', indexed: true },
      name: 'string',
      phone: 'string?',
      address: 'string?',
      lastUpdated: 'int',
      dataSource: 'string',
      tripSessionId: 'string?',
    },
  };
}

export const realmConfig: Realm.Configuration = {
  schema: [PoiObject],
  schemaVersion: 2,
  migration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion < 2) {
      // tripSessionId is optional, so no explicit migration logic needed, 
      // Realm will just add the column as null
    }
  },
};
