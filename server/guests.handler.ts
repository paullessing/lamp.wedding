import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import * as parseCsv from 'csv-parse/lib/sync'
import { makeResponse } from './util/http-helpers';
import { LookupTable } from './util/database';
import { Guest, GuestLookup } from '../shared/guest.model';

export const SECRET = '58fb6aabb1806843877b8c8926aa710e0a1d7c1891e60764a801068a756e0c22';

const guestsTable = new LookupTable<Guest, GuestLookup>(
  'lamp.wedding.guests',
  (guest: Guest) => {
    try { return {
      firstName: guest.firstName.replace(/\s+/i, '').toLocaleLowerCase(),
      lastName: guest.lastName.replace(/\s+/i, '').toLocaleLowerCase(),
      email: guest.email.toLocaleLowerCase(),
      groupId: guest.groupId
    }; } catch (e) {
      console.log('Failed to convert', guest);
      throw e;
    }
  }
);

export async function putAll(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const authHeader = event.headers && (event.headers['X-Auth-Token'] || event.headers['x-auth-token']);
  if (authHeader !== SECRET) {
    console.warn(`Invalid X-Auth-Token header`);
    throw makeResponse(401, 'Unauthenticated');
  }

  if (!event.body) {
    console.warn(`Body not supplied`);
    throw makeResponse(400, 'Missing body');
  }

  const guests = parseCsvInput(event.body);
  if (!guests || !guests.length) {
    console.warn(`No data: ${event.body}`);
    throw makeResponse(400, 'Bad Request');
  }

  console.log('Read data:', guests);

  const existingGuests = await guestsTable.all();

  for (const guest of guests) {
    for (const existingGuest of existingGuests) {
      if (normalise(guest.firstName) === normalise(existingGuest.firstName) &&
        normalise(guest.lastName) === normalise(existingGuest.lastName)) {
        throw makeResponse(400, `Guest "${guest.firstName} ${guest.lastName}" already exists!`);
      }
    }
  }

  const insertedGuests = await guestsTable.putMulti(guests);

  const count = await guestsTable.count();

  return makeResponse(200, {
    insert: 'OK',
    total: count,
    added: insertedGuests.length
  });
}

function parseCsvInput(data: string): Guest[] {
  const parsed = parseCsv(data);
  const firstNameIndex = parsed[0].indexOf('firstName');
  const lastNameIndex = parsed[0].indexOf('lastName');
  const emailIndex = parsed[0].indexOf('email');
  const groupIndex = parsed[0].indexOf('groupId');

  if (firstNameIndex < 0) {
    throw makeResponse(400, 'Missing column "firstName"');
  }
  if (lastNameIndex < 0) {
    throw makeResponse(400, 'Missing column "lastName"');
  }
  if (emailIndex < 0) {
    throw makeResponse(400, 'Missing column "email"');
  }
  if (groupIndex < 0) {
    throw makeResponse(400, 'Missing column "groupId"');
  }

  return parsed.slice(1).map((row): Guest => {
    const guest: Guest = {
      id: null,
      firstName: row[firstNameIndex],
      lastName: row[lastNameIndex],
      email: row[emailIndex]
    };
    if (typeof row[groupIndex] === 'string' && row[groupIndex]) {
      guest.groupId = row[groupIndex];
    }
    return guest;
  });
}

function normalise(name: string) {
  return (name || '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9 _-]/gi, replaceCharacter);
}

function replaceCharacter(char: string): string {
  switch (char) {
    case 'ß': return 'ss';
    case 'à': return 'ae';
    case 'á': return 'a';
    case 'â': return 'a';
    case 'ã': return 'a';
    case 'ä': return 'a';
    case 'å': return 'a';
    case 'æ': return 'ae';
    case 'ç': return 'c';
    case 'è': return 'e';
    case 'é': return 'e';
    case 'ê': return 'e';
    case 'ë': return 'e';
    case 'ì': return 'i';
    case 'í': return 'i';
    case 'î': return 'i';
    case 'ï': return 'i';
    default: return '_';
  }
}
