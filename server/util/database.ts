import { AWSError, DynamoDB } from 'aws-sdk';
import uuid from 'uuid/v4';
import { makeResponse } from './http-helpers';
import WriteRequest = DocumentClient.WriteRequest;
import DocumentClient = DynamoDB.DocumentClient;

type Id = string | String; // Using "String" to be compatible with Phantom types which extend String
const docClient = new DocumentClient();

type IdGenerator<T> = (value: T) => Id;

const uuidGenerator: IdGenerator<any> = () => uuid();

export class Table<T extends { [id in PrimaryKeyName]: IdType }, PrimaryKeyName extends string = 'id', IdType extends Id = Id> {
  protected readonly idField: string & PrimaryKeyName;

  constructor(
    protected readonly tableName: string,
    protected readonly idGenerator: IdGenerator<T> = uuidGenerator,
    idField: PrimaryKeyName | null = null,
  ) {
    this.idField = (idField === null ? 'id' : idField) as unknown as string & PrimaryKeyName;
  }

  public all(): Promise<T[]> {
    return getAll(this.tableName);
  }

  public find(id: IdType): Promise<T | null> {
    return get(this.tableName, '' + id, this.idField);
  }

  public put<P extends T = T>(item: OptionalPrimaryKey<P, PrimaryKeyName>): Promise<P> {
    return put<P, PrimaryKeyName>(this.tableName, item, this.idField, this.idGenerator);
  }

  public putMulti<P extends T = T>(items: OptionalPrimaryKey<P, PrimaryKeyName>[]): Promise<P[]> {
    return putMulti<P, PrimaryKeyName>(this.tableName, items, this.idField, this.idGenerator);
  }

  public remove(id: IdType): Promise<void> {
    return remove(this.tableName, '' + id, this.idField);
  }
}

type LookupEntry<Lookup, IdType extends Id = Id> = {
  id: IdType;
  lookup: Lookup;
}

type LookupMap<Lookup, PrimaryKeyName extends string, IdType extends Id = Id> = {
  all: { [key: string]: LookupEntry<Lookup, IdType> };
} & {
  [id in PrimaryKeyName]: '_all'
};

type OptionalPrimaryKey<T, PrimaryKeyName extends keyof T> =
  Pick<T, Exclude<keyof T, PrimaryKeyName>> &
  Partial<Pick<T, PrimaryKeyName>>;

export class LookupTable<T extends { [id in PrimaryKeyName]: IdType }, Lookup = any, PrimaryKeyName extends string = 'id', IdType extends Id = Id> extends Table<T, PrimaryKeyName> {
  constructor(
    tableName: string,
    private readonly lookupGenerator: (value: T) => Lookup,
    idGenerator: IdGenerator<T> = uuidGenerator,
    idField: PrimaryKeyName | null = null,
  ) {
    super(tableName, idGenerator, idField);
  }

  public async put<P extends T = T>(item: OptionalPrimaryKey<P, PrimaryKeyName>): Promise<P> {
    const insertedValue = await super.put(item);
    const lookup: LookupEntry<Lookup> = {
      lookup: this.lookupGenerator(insertedValue),
      id: insertedValue[this.idField]
    };

    await this.addOrUpdateLookupEntries([lookup]);
    return insertedValue;
  }

  public async putMulti<P extends T = T>(items: OptionalPrimaryKey<P, PrimaryKeyName>[]): Promise<P[]> {
    const insertedValues = await super.putMulti(items);
    const lookups = insertedValues.map((value) => ({
      lookup: this.lookupGenerator(value),
      id: value[this.idField]
    }));

    await this.addOrUpdateLookupEntries(lookups);
    return insertedValues;
  }

  public async search(lookup: Partial<Lookup> | ((l: Lookup, id: IdType) => boolean)): Promise<T[]> {
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
      const value = all[entry];
      if (match(value.lookup, value.id as IdType)) {
        results.push(this.find(value.id) as Promise<T>);
      }
    }

    return Promise.all(results);
  }

  public async all(): Promise<T[]> {
    const all = await super.all();
    return all.filter((entry) => entry[this.idField] !== '_all');
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

  private async getLookupMap(): Promise<LookupMap<Lookup, PrimaryKeyName>> {
    const map = await this.find('_all') as any as LookupMap<Lookup, PrimaryKeyName>;
    return map || {
      [this.idField]: '_all',
      all: {}
    } as LookupMap<Lookup, PrimaryKeyName>;
  }
}

export function getAll<T>(tableName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const params: DocumentClient.ScanInput = {
      TableName: tableName
    };

    docClient.scan(params, onScan);

    let allItems: T[] = [];

    function onScan(err: AWSError, data: DocumentClient.ScanOutput) {
      if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        reject(err);
      } else {
        // print all the movies
        console.log('Scan succeeded.');
        allItems = allItems.concat(data.Items as T[]);

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

export function put<T extends { [key in K]: string | String }, K extends string>(tableName: string, itemToInsert: OptionalPrimaryKey<T, K>, primaryKey: string = 'id', idGenerator: IdGenerator<T> = uuidGenerator): Promise<T> {
  const item = ensureKey<T, K>(itemToInsert as unknown as T, primaryKey as K, idGenerator);

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

export function putMulti<T extends { [key in K]: string | String }, K extends string>(tableName: string, itemsToInsert: OptionalPrimaryKey<T, K>[], primaryKey: string = 'id', idGenerator: IdGenerator<T> = uuidGenerator): Promise<T[]> {
  const items: T[] = itemsToInsert.map((item) => ensureKey<T, K>(item as unknown as T, primaryKey as K, idGenerator));

  console.info('Inserting multi:', tableName);
  console.info(items);

  const count = 0;

  const nextBatch = (insertedItems: T[] = []): Promise<T[]> | T[] => !items.length ?
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
      console.log('Finished getting' + (error ? ' with error' : ''), error || '');
      if (error) {
        reject(error);
      } else {
        resolve(item.Item as T);
      }
    });
  });
}

function ensureKey<T extends { [key in K]: string | String }, K extends string>(item: T, key: K, idGenerator: IdGenerator<T> = uuidGenerator): T {
  if (item[key]) {
    return item;
  } else {
    return Object.assign({},
      item,
      { [key]: idGenerator(item) }
    );
  }
}
