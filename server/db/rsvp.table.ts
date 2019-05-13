import { PlaceholderRsvp } from '../../shared/placeholder-rsvp.model';
import { RsvpAnswer } from '../../shared/rsvp-answer.model';
import { Table } from '../util/database';

export const rsvpTable = new Table<RsvpAnswer | PlaceholderRsvp, 'guestId'>(
  'lamp.wedding.rsvp',
  (item) => item.guestId,
  'guestId'
);
