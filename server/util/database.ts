import { DynamoDB } from 'aws-sdk';
import * as uuid from 'uuid/v4';
import DocumentClient = DynamoDB.DocumentClient;
import WriteRequest = DocumentClient.WriteRequest;
import { makeResponse } from './http-helpers';

const docClient = new DocumentClient();

export class Table<T> {
  constructor(
    private tableName: string,
    private primaryKey: string = 'id'
  ) {}

  public all(): Promise<T[]> {
    return getAll(this.tableName);
  }

  public find(id: string | number): Promise<T | null> {
    return get(this.tableName, '' + id, this.primaryKey);
  }

  public put(item: T): Promise<T> {
    return put(this.tableName, item, this.primaryKey);
  }

  public putMulti(items: T[]): Promise<T[]> {
    return putMulti(this.tableName, items, this.primaryKey);
  }

  public remove(id: string | number): Promise<void> {
    return remove(this.tableName, '' + id, this.primaryKey);
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

export function put<T>(tableName: string, item: T, primaryKey: string = 'id'): Promise<T> {
  item = ensureKey(item, primaryKey);

  return new Promise((resolve, reject) => {
    const itemToInsert: DocumentClient.PutItemInput = {
      TableName: tableName,
      Item: item
    };

    console.log('Putting:', itemToInsert);

    docClient.put(itemToInsert, (error) => {
      console.log('Finished inserting' + (error ? ' with error' : ''), error);
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

export function putMulti<T>(tableName: string, items: T[], primaryKey: string = 'id'): Promise<T[]> {
  items = items.map((item) => ensureKey(item, primaryKey));

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
        console.log('Finished inserting' + (error ? ' with error' : ''), error);
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

function ensureKey<T>(item: T, key: string): T {
  if (item[key]) {
    return item;
  } else {
    return Object.assign({},
      item,
      { [key]: uuid() }
    );
  }
}
