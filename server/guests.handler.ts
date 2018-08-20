import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import * as parseCsv from 'csv-parse/lib/sync'
import { makeResponse } from './util/http-helpers';
import { LookupTable, Table } from './util/database';
import { Guest, GuestLookup } from '../shared/guest.model';

export const SECRET = '58fb6aabb1806843877b8c8926aa710e0a1d7c1891e60764a801068a756e0c22';
export const ALL_GUESTS_LOOKUP_KEY = '_all';

const guestsTable = new LookupTable<Guest, GuestLookup>(
  'lamp.wedding.guests',
  (guest: Guest) => ({
    firstName: guest.firstName.replace(/\s+/i, '').toLocaleLowerCase(),
    lastName: guest.lastName.replace(/\s+/i, '').toLocaleLowerCase(),
    email: guest.email.toLocaleLowerCase(),
  })
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

  const guests = parseCsv(event.body);
  if (!guests || !guests.length) {
    console.warn(`No data: ${event.body}`);
    throw makeResponse(400, 'Bad Request');
  }

  console.log('Read data:', guests);

  const { data: existingAllGuests } = (await guestsTable.get<{ data: GuestLookup[] }>('guests', ALL_GUESTS_LOOKUP_KEY) || { data: [] });

  for (const guest of guests) {
    for (const existingGuest of existingAllGuests) {
      if (normalise(guest.firstName) === existingGuest.firstName && normalise(guest.lastName) === existingGuest.lastName) {
        throw makeResponse(400, `Guest "${guest.firstName} ${guest.lastName}" already exists!`);
      }
    }
  }

  const insertedGuests = await database.putMulti<Guest>('guests', guests);
  const allGuests = insertedGuests.map((guest): GuestLookup => ({
    id: guest.id,
    firstName: normalise(guest.firstName),
    lastName: normalise(guest.lastName),
    groupId: guest.groupId
  }));

  const newAllGuests = existingAllGuests.concat(allGuests);

  await database.put('guests', {
    id: ALL_GUESTS_LOOKUP_KEY,
    data: newAllGuests // TODO test
  });

  return makeResponse(200, {
    insert: 'OK',
    total: newAllGuests.length,
    added: allGuests.length
  });
}
