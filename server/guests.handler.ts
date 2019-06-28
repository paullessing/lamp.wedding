import { APIGatewayEvent, APIGatewayProxyResult, Context, ProxyResult } from 'aws-lambda';
import parseCsv from 'csv-parse/lib/sync'
import { isPlaceholder, PlaceholderRsvp } from '../shared/placeholder-rsvp.model';
import { ResponseData } from '../shared/response-data.model';
import { RsvpAnswer } from '../shared/rsvp-answer.model';
import { rsvpTable } from './db/rsvp.table';
import { makeResponse } from './util/http-helpers';
import { Guest, GuestId, GuestLookup, NewGuest } from '../shared/guest.model';
import { guestsTable } from './db/guests.table';
import { ensureSecret } from './secret';
import { isTruthy } from './util/util';

/**
 * Adds all guests from CSV to the database.
 */
export async function putAll(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  if (!event.body) {
    console.warn(`Body not supplied`);
    throw makeResponse(400, 'Missing body');
  }

  const existingGuests = await guestsTable.all();

  const guests = parseCsvInput(new Buffer(event.body, 'base64').toString(), existingGuests.length);
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

export async function updateGuest(event: APIGatewayEvent): Promise<ProxyResult> {
  ensureSecret(event);

  if (!event.body) {
    console.warn(`Body not supplied`);
    throw makeResponse(400, 'Missing body');
  }

  let guest: Guest | null = null;
  try {
    guest = JSON.parse(new Buffer(event.body, 'base64').toString());
  } catch (e) {
    console.log(e);
    throw makeResponse(400, 'Could not parse body');
  }

  if (!guest) {
    throw makeResponse(422, 'Missing body');
  }

  const id = event.pathParameters!.id;
  if (!id) {
    throw makeResponse(422, 'Missing ID');
  }

  const oldGuest = await guestsTable.find(id);
  if (!oldGuest) {
    throw makeResponse(422, `Could not find guest with ID: '${id}'`);
  }

  const updatedGuest: Guest = {
    ...oldGuest,
    email: guest.email || oldGuest.email,
    firstName: guest.firstName || oldGuest.firstName,
    lastName: guest.lastName || oldGuest.lastName,
    groupId: typeof guest.groupId === 'string' ? guest.groupId : oldGuest.groupId,
  };

  await guestsTable.put(updatedGuest);

  return makeResponse(200, {
    previous: oldGuest,
    current: updatedGuest
  });
}

/**
 * Finds guests by partial name.
 */
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

  const guests: Guest[] = await guestsTable.search((value: GuestLookup) =>
    value.firstName.indexOf(firstName) >= 0 && value.lastName.indexOf(lastName) >= 0
  );

  const matchedIds = guests.slice(0, 3).map((guest) => guest.id);
  const results = await Promise.all(matchedIds.map((id) => guestsTable.find(id)));

  return makeResponse(200, { results, count: results.length });
}

/**
 * Retrieve a single guest.
 */
export async function getById(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const guestId = GuestId.validate(event.pathParameters!.id);

  const guest = await guestsTable.find(guestId);

  if (guest) {
    return makeResponse(200, { guest });
  } else {
    return makeResponse(404);
  }
}

/**
 * Retrieve a single guest's data.
 */
export async function getResponseData(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  const guestId = GuestId.validate(event.pathParameters!.id);
  const token = event.queryStringParameters && event.queryStringParameters.token;

  const guest = await guestsTable.find(guestId);

  if (!guest) {
    return makeResponse(404);
  }

  console.log('Got guest', guest);

  let answer: RsvpAnswer | null = null;
  const rsvpOrPlaceholder = await rsvpTable.find(guestId);
  if (rsvpOrPlaceholder) {
    if (isPlaceholder(rsvpOrPlaceholder)) {
      return makeResponse(403, { respondedBy: rsvpOrPlaceholder.respondedBy.name });
    }
    if (rsvpOrPlaceholder.token !== token) {
      return makeResponse(403);
    }
    answer = rsvpOrPlaceholder;
  }

  let group: Guest[] = [];
  if (guest.groupId) {
    group = (await Promise.all<Guest | null>(
      (await guestsTable.search((lookup, id) => lookup.groupId === guest.groupId && id !== guest.id))
        .map(async (lookupGuest: Guest): Promise<Guest | null> => {
          console.log('Looked up guest', lookupGuest, answer);
          if (answer && answer.guests.filter((answerGuest) => answerGuest.id === lookupGuest.id).length > 0) {
            // This guest is already in the existing RSVP, so keep them
            console.log('Keeping them');
            return lookupGuest;
          } else {
            console.log('Checking if they have an RSVP');
            // Ensure the guest doesn't already have an RSVP
            return (await rsvpTable.find(lookupGuest.id)) ? null : lookupGuest;
          }
        })
    )).filter(isTruthy);
  }

  const responseData: ResponseData = {
    guest,
    group,
    rsvp: answer
  };

  return makeResponse(200, responseData);
}

function parseCsvInput(data: string, startIndex: number): NewGuest[] {
  console.log('data', data);
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
  return parsed.slice(1).map((row: { [key: string] : string | null }): NewGuest => {
    const guest: Partial<NewGuest> = {
      index: index++,
      firstName: row[firstNameIndex] as string,
    };
    if (typeof row[lastNameIndex] === 'string' && row[lastNameIndex]) {
      guest.lastName = row[lastNameIndex]!;
    }
    if (typeof row[emailIndex] === 'string' && row[emailIndex]) {
      guest.email = row[emailIndex]!;
    }
    if (typeof row[groupIndex] === 'string' && row[groupIndex]) {
      guest.groupId = row[groupIndex]!;
    }
    return guest as NewGuest;
  });
}

function normalise(name: string | undefined) {
  return (name || '')
    .toLocaleLowerCase()
    .trim()
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
