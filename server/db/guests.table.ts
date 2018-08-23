import { LookupTable } from '../util/database';
import { Guest, GuestLookup } from '../../shared/guest.model';

export const guestsTable = new LookupTable<Guest, GuestLookup>(
  'lamp.wedding.guests',
  (guest: Guest) => {
    try { return {
      firstName: guest.firstName.replace(/\s+/i, '').toLocaleLowerCase(),
      lastName: guest.lastName && guest.lastName.replace(/\s+/i, '').toLocaleLowerCase(),
      email: guest.email && guest.email.toLocaleLowerCase(),
      groupId: guest.groupId
    }; } catch (e) {
      console.log('Failed to convert', guest);
      throw e;
    }
  }
);
