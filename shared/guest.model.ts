export type Uuid = string;

export interface Guest {
  id: Uuid | null;
  firstName: string;
  lastName: string;
  email: string;
  groupId?: string;
}

export interface GuestLookup {
  firstName: string;
  lastName: string;
  email: string;
  groupId?: string;
}
