import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { DietaryRequirements, Guest, GuestId, isFullRsvp, isPlaceholder, PlaceholderRsvp, RsvpAnswer } from '../shared';
import { guestsTable } from './db/guests.table';
import { rsvpTable } from './db/rsvp.table';
import { sendConfirmationEmail } from './email';
import { ensureSecret } from './secret';
import { makeResponse } from './util/http-helpers';

export async function putRsvp(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  try {
    const guestId = GuestId.validate(event.pathParameters!.id);

    const guest = await guestsTable.find(guestId);
    if (!guest) {
      return makeResponse(404);
    }

    if (!event.body) {
      console.log('Error: No body');
      return makeResponse(400);
    }

    let rsvp: RsvpAnswer;
    try {
      console.log(typeof event.body, event.body);
      rsvp = JSON.parse(new Buffer(event.body, 'base64').toString());
    } catch (e) {
      console.log('Error parsing body:', e);
      return makeResponse(400);
    }

    const existingRsvp = await rsvpTable.find(guestId);
    if (existingRsvp && (isPlaceholder(existingRsvp) || isFullRsvp(existingRsvp) && rsvp.token !== existingRsvp.token)) {
      return makeResponse(409);
    }

    if (!existingRsvp) {
      rsvp.token = uuid();
    }

    const response: RsvpAnswer = await rsvpTable.put(rsvp);
    if (rsvp.guests.length > 1) {
      await rsvpTable.putMulti(rsvp.guests
        .filter((guest) => guest.id !== guestId)
        .map((thisGuest) => ({
          guestId: thisGuest.id,
          respondedBy: {
            guestId,
            name: guest.firstName + ' ' + guest.lastName
          } })));
    }

    if (existingRsvp && isFullRsvp(existingRsvp)) {
      await Promise.all((existingRsvp as RsvpAnswer).guests
        .filter((existingGuest) => existingGuest.id !== guestId)
        .filter((existingGuest) => !response.guests.find(responseGuest => responseGuest.id === existingGuest.id))
        .map((noLongerRsvpdGuest) => rsvpTable.remove(noLongerRsvpdGuest.id))
      );
    }

    await sendConfirmationEmail(guest, response);

    return makeResponse(existingRsvp ? 200 : 201, response);
  } catch (e) {
    console.error('An error occurred while submitting the RSVP', e, e.message);
    return makeResponse(500, e + '; ' + e.message + '; ' + JSON.stringify(e));
  }
}

export async function getAllResponses(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  ensureSecret(event);

  const [rsvps, guests] = await Promise.all([rsvpTable.all(), guestsTable.all()]);

  const guestsWithRsvps: { primary: boolean, respondedBy: string | null, guest: Guest, rsvp: RsvpAnswer }[] = [];
  const guestsWithoutRsvps = [];

  for (const guest of guests) {
    const rsvp = rsvps.find((rsvp) => rsvp.guestId === guest.id);
    if (rsvp) {
      if (rsvp.hasOwnProperty('respondedBy')) {
        const respondedBy = (rsvp as PlaceholderRsvp).respondedBy.guestId;
        const otherRsvp = rsvps.find((rsvp) => rsvp.guestId === respondedBy) as RsvpAnswer;
        guestsWithRsvps.push({
          primary: false,
          respondedBy: (rsvp as PlaceholderRsvp).respondedBy.name,
          guest,
          rsvp: otherRsvp
        })
      } else {
        guestsWithRsvps.push({
          primary: true,
          respondedBy : null,
          guest,
          rsvp: rsvp as RsvpAnswer
        });
      }
    } else {
      guestsWithoutRsvps.push(guest);
    }
  }

  const getDietary = (dietaries: DietaryRequirements[], guestId: GuestId): string => {
    const dietary = (dietaries || []).find(d => d.id === guestId);
    if (!dietary) {
      return 'ERROR: NO DIETARIES';
    }
    return (dietary.dietaries === 'Other' ? dietary.dietaryNotes : dietary.dietaries) || '';
  };

  const responses = guestsWithRsvps.map(({ primary, guest, rsvp, respondedBy }) => {
    try {
      return {
        guestId: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        groupId: guest.groupId,
        email: primary ? rsvp.email : `cf ${respondedBy}`,
        phoneNumber: primary ? rsvp.phoneNumber : `cf ${respondedBy}`,
        response: rsvp.isAttending ? 'Attending' : 'Not Attending',
        songArtist: primary ? rsvp.songArtist : '',
        songTitle: primary ? rsvp.songTitle : '',
        dietaries: rsvp.isAttending && getDietary(rsvp.dietaries, guest.id) || '',
      };
    } catch (e) {
      console.log(`Error parsing guest ${guest.id}`, guest, rsvp, primary);
      throw e;
    }
  });

  const missingResponses = guestsWithoutRsvps.map(guest => ({
    guestId: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    groupId: guest.groupId,
    email: guest.email,
  }));

  const keys = [
    'guestId',
    'firstName',
    'lastName',
    'groupId',
    'email',
    'phoneNumber',
    'response',
    'songArtist',
    'songTitle',
    'dietaries',
  ];
  const result = [keys.join(',')].concat(
    [].concat(responses as any, missingResponses as any).map((response) => toCsv(response, keys)
    )).join('\n');

  return {
    statusCode: 200,
    body: result,
    headers: {
      'Content-Type': 'application/csv',
    }
  };
}

function toCsv(item: any, keys: string[]): string {
  return keys
    .map(key => item[key])
    .map(v => v && v.toString() || '')
    .map(v => v.trim())
    .map(v => v.match(/(\s|,)/) ? `"${v}"` : v)
    .join(',');
}
