import { APIGatewayEvent, Context, ProxyResult } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { GuestId, isFullRsvp, isPlaceholder, RsvpAnswer } from '../shared';
import { guestsTable } from './db/guests.table';
import { rsvpTable } from './db/rsvp.table';
import { sendConfirmationEmail } from './email';
import { makeResponse } from './util/http-helpers';

export async function putRsvp(event: APIGatewayEvent, context: Context): Promise<ProxyResult> {
  try {
    const guestId = GuestId.validate(event.pathParameters!.id);

    const guest = await guestsTable.find(guestId);
    if (!guest) {
      return makeResponse(404);
    }

    if (!event.body) {
      return makeResponse(400);
    }

    let rsvp: RsvpAnswer;
    try {
      rsvp = JSON.parse(event.body);
    } catch (e) {
      return makeResponse(400);
    }

    const existingRsvp = await rsvpTable.find(guestId);
    if (existingRsvp && (!isPlaceholder(existingRsvp) || isFullRsvp(existingRsvp) && rsvp.token !== existingRsvp.token)) {
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
