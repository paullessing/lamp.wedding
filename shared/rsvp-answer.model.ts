import { Guest, GuestId } from './guest.model';
import { PlaceholderRsvp } from './placeholder-rsvp.model';

export type Dietaries = 'None' | 'Vegetarian' | 'Other';
export type DietaryRequirements = Guest & {
  dietaries: Dietaries;
  dietaryNotes?: string;
}

export interface RsvpAnswer {
  token?: string;
  guestId: GuestId;
  guests: Guest[];
  isAttending: boolean;
  email: string;
  phoneNumber: string;
  dietaries: DietaryRequirements[];

  songArtist: string;
  songTitle: string;
}

export function isFullRsvp(rsvp: RsvpAnswer | PlaceholderRsvp): rsvp is RsvpAnswer {
  return rsvp.hasOwnProperty('isAttending') && typeof (rsvp as any)['isAttending'] === 'boolean';
}
