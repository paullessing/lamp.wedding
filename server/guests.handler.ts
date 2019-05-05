import { APIGatewayEvent, APIGatewayProxyResult, Context, ProxyResult } from 'aws-lambda';
import parseCsv from 'csv-parse/lib/sync'
import { makeResponse } from './util/http-helpers';
import { Guest } from '../shared/guest.model';
import { guestsTable } from './db/guests.table';
import { ensureSecret } from './secret';

export async function putAll(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  if (!event.body) {
    console.warn(`Body not supplied`);
    throw makeResponse(400, 'Missing body');
  }

  const existingGuests = await guestsTable.all();

  const guests = parseCsvInput(event.body, existingGuests.length);
  if (!guests || !guests.length) {
    console.warn(`No data: ${event.body}`);
    throw makeResponse(400, 'Bad Request');
  }

  console.log('Read data:', guests);

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

export async function searchGuestByName(event: APIGatewayEvent): Promise<ProxyResult> {
  const queryParams = event.queryStringParameters || {};
  const firstName = normalise(queryParams.firstName);
  const lastName = normalise(queryParams.lastName);

  console.log('User is searching for: ', firstName, lastName);

  const matchFirstName = firstName.length >= 2;
  const matchLastName = lastName.length >= 2;

  if (!matchFirstName || !matchLastName) {
    return makeResponse(400, { error: 'First and Last Name must be at least two characters each' });
  }

  const guests = await guestsTable.search((value) =>
    value.firstName.indexOf(firstName) >= 0 && value.lastName.indexOf(lastName) >= 0
  );

  const matchedIds = guests.slice(0, 3).map((guest) => guest.id);
  const results = await Promise.all(matchedIds.map((id) => guestsTable.find(id)));

  return makeResponse(200, { results, count: results.length });
}

function parseCsvInput(data: string, startIndex): Guest[] {
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

  let index = startIndex;
  return parsed.slice(1).map((row): Guest => {
    const guest: Guest = {
      id: null,
      index: index++,
      firstName: row[firstNameIndex],
    };
    if (typeof row[lastNameIndex] === 'string' && row[lastNameIndex]) {
      guest.lastName = row[lastNameIndex];
    }
    if (typeof row[emailIndex] === 'string' && row[emailIndex]) {
      guest.email = row[emailIndex];
    }
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
