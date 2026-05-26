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
    },
  };
}

export const realmConfig: Realm.Configuration = {
  schema: [PoiObject],
  schemaVersion: 1,
  migration: (oldRealm, newRealm) => {
    // Migration logic here as schema evolves
  },
};
