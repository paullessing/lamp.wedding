import { Guest, GuestId } from './guest.model';

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
