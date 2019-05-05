import { DynamoDB } from 'aws-sdk';
import uuid from 'uuid/v4';
import DocumentClient = DynamoDB.DocumentClient;
import WriteRequest = DocumentClient.WriteRequest;
import { makeResponse } from './http-helpers';

type Id = string | String | number; // Using "String" to be compatible with Phantom types which extend String
const docClient = new DocumentClient();

type IdGenerator = () => Id;

export class Table<T extends { id: Id }> {
  constructor(
    protected readonly tableName: string,
    protected readonly idGenerator: IdGenerator = uuid,
  ) {}

  public all(): Promise<T[]> {
    return getAll(this.tableName);
  }

  public find(id: Id): Promise<T | null> {
    return get(this.tableName, '' + id, 'id');
  }

  public put(item: T): Promise<T> {
    return put(this.tableName, item, 'id', this.idGenerator);
  }

  public putMulti(items: T[]): Promise<T[]> {
    return putMulti(this.tableName, items, 'id', this.idGenerator);
  }

  public remove(id: Id): Promise<void> {
    return remove(this.tableName, '' + id, 'id');
  }
}

type LookupEntry<Lookup> = {
  id: Id;
  lookup: Lookup;
}

type LookupMap<Lookup> = {
  id: '_all';
  all: { [key: string]: LookupEntry<Lookup> } | { [key: number]: LookupEntry<Lookup> };
};

export class LookupTable<T extends { id: Id }, Lookup = any> extends Table<T> {
  constructor(
    tableName: string,
    private readonly lookupGenerator: (value: T) => Lookup,
    idGenerator: IdGenerator = uuid,
  ) {
    super(tableName, idGenerator);
  }

  public async put(item: T): Promise<T> {
    const insertedValue = await super.put(item);
    const lookup: LookupEntry<Lookup> = {
      lookup: this.lookupGenerator(insertedValue),
      id: insertedValue.id
    };

    await this.addOrUpdateLookupEntries([lookup]);
    return insertedValue;
  }

  public async putMulti(items: T[]): Promise<T[]> {
    const insertedValues = await super.putMulti(items);
    const lookups = insertedValues.map((value) => ({
      lookup: this.lookupGenerator(value),
      id: value.id
    }));

    await this.addOrUpdateLookupEntries(lookups);
    return insertedValues;
  }

  public async search(lookup: Partial<Lookup> | ((l: Lookup) => boolean)): Promise<T[]> {
    const match = typeof lookup === 'function' ? lookup : (entry: Lookup) => {
      for (const key in lookup) {
        if (lookup.hasOwnProperty(key)) {
          if (entry[key] !== lookup[key]) {
            return false;
          }
        }
      }
      return true;
    };

    const all = (await this.getLookupMap()).all;

    const results: Promise<T>[] = [];

    for (const entry in all) {
      if (!all.hasOwnProperty(entry)) {
        continue;
      }
      if (match(all[entry].lookup)) {
        results.push(this.find(all[entry].id));
      }
    }

    return Promise.all(results);
  }

  public async all(): Promise<T[]> {
    const all = await super.all();
    return all.filter((entry) => entry.id !== '_all');
  }

  public async count(): Promise<number> {
    const all = await this.getLookupMap();
    return Object.keys(all.all).length;
  }

  private async addOrUpdateLookupEntries(lookups: LookupEntry<Lookup>[]): Promise<void> {
    const map = await this.getLookupMap();
    const newMap = {
      ...map,
      all: { ...map.all }
    };
    for (const lookup of lookups) {
      const id = typeof lookup.id === 'number' ? lookup.id : lookup.id as string;
      newMap.all[id] = lookup;
    }
    await super.put(newMap as any);
  }

  private async getLookupMap(): Promise<LookupMap<Lookup>> {
    const map = await this.find('_all') as any as LookupMap<Lookup>;
    return map || {
      id: '_all',
      all: {}
    } as LookupMap<Lookup>;
  }
}

export function getAll<T>(tableName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const params: DocumentClient.ScanInput = {
      TableName: tableName
    };

    docClient.scan(params, onScan);

    let allItems: T[] = [];

    function onScan(err, data) {
      if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        reject(err);
      } else {
        // print all the movies
        console.log('Scan succeeded.');
        allItems = allItems.concat(data.Items);

        // continue scanning if we have more movies, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey !== 'undefined') {
          console.log('Scanning for more...');
          params.ExclusiveStartKey = data.LastEvaluatedKey;
          docClient.scan(params, onScan);
        } else {
          resolve(allItems);
        }
      }
    }
  });
}

export function put<T>(tableName: string, item: T, primaryKey: string = 'id', idGenerator: IdGenerator = uuid): Promise<T> {
  item = ensureKey(item, primaryKey, idGenerator);

  return new Promise((resolve, reject) => {
    const itemToInsert: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: item
    };

    console.log('Putting:', itemToInsert);

    docClient.put(itemToInsert, (error) => {
      console.log('Finished inserting' + (error ? ' with error' : ''), error || '');
      if (error) {
        reject(error);
      } else {
        resolve(item);
      }
    });
  })
}

export function remove(tableName: string, key: string, primaryKeyName: string = 'id'): Promise<void> {
  return new Promise((resolve, reject) => {
    const itemToDelete: DocumentClient.DeleteItemInput = {
      TableName: tableName,
      Key: { [primaryKeyName]: key }
    };

    console.log('Deleting:', tableName, primaryKeyName, key);

    docClient.delete(itemToDelete, (error) => {
      console.log('Finished deleting' + (error ? ' with error' : ''), error);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  })
}

export function putMulti<T>(tableName: string, items: T[], primaryKey: string = 'id', idGenerator: IdGenerator = uuid): Promise<T[]> {
  items = items.map((item) => ensureKey(item, primaryKey, idGenerator));

  console.info('Inserting multi:', tableName);
  console.info(items);

  const count = 0;

  const nextBatch = (insertedItems: T[] = []) => !items.length ?
    insertedItems :
    new Promise<T[]>((resolve, reject) => {
      if (count > 100) {
        console.error('Too many iterations!');
        throw makeResponse(500, 'Internal Server Error');
      }

      const itemsInThisBatch = items.splice(0, 25);
      const request: DocumentClient.BatchWriteItemInput = {
        RequestItems: {
          [tableName]: itemsInThisBatch.map((item: T): WriteRequest => ({
            PutRequest: {
              Item: item
            }
          }))
        }
      };

      console.log('Putting:', request);

      docClient.batchWrite(request, (error) => {
        console.log('Finished inserting' + (error ? ' with error' : ''), error || '');
        if (error) {
          reject(error);
        } else {
          resolve(insertedItems.concat(itemsInThisBatch));
        }
      });
    }).then(nextBatch);

  return Promise.resolve([])
    .then(nextBatch);
}

export function get<T>(tableName: string, key: string, primaryKeyName: string = 'id'): Promise<T> {
  return new Promise((resolve, reject) => {
    const props: DocumentClient.GetItemInput = {
      TableName: tableName,
      Key: { [primaryKeyName]: key }
    };

    docClient.get(props, (error, item: DocumentClient.GetItemOutput) => {
      console.log('Finished inserting' + (error ? ' with error' : ''), error);
      if (error) {
        reject(error);
      } else {
        resolve(item.Item as T);
      }
    });
  });
}

function ensureKey<T>(item: T, key: string, idGenerator: IdGenerator = uuid): T {
  if (item[key]) {
    return item;
  } else {
    return Object.assign({},
      item,
      { [key]: idGenerator() }
    );
  }
}
