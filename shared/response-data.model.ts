import { Guest } from './guest.model';
import { RsvpAnswer } from './rsvp-answer.model';

export interface ResponseData {
  guest: Guest;
  group: Guest[];
  rsvp: RsvpAnswer | null;
}
