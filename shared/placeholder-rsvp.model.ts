import { GuestId } from './guest.model';
import { RsvpAnswer } from './rsvp-answer.model';

/**
 * The RSVP has been provided by someone else.
 * This entry links to that guest.
 */
export interface PlaceholderRsvp {
  guestId: GuestId;
  respondedBy: {
    guestId: GuestId;
    name: string;
  };
}

export function isPlaceholder(rsvp: RsvpAnswer | PlaceholderRsvp): rsvp is PlaceholderRsvp {
  return rsvp && rsvp.hasOwnProperty('guestId') && rsvp.hasOwnProperty('respondedBy');
}
