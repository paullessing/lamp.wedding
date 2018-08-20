export type Uuid = string;

export interface Guest {
  id: Uuid;
  firstName: string;
  lastName: string;
  email: string;
}

export interface GuestLookup {
  firstName: string;
  lastName: string;
  email: string;
}
