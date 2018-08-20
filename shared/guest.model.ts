export type Uuid = string;
export type DateString = string;

export interface Guest {
  id: Uuid | null;
  firstName: string;
  lastName: string;
  email: string;
  groupId?: string;
  viewedSaveTheDate?: DateString;
}

export interface GuestLookup {
  firstName: string;
  lastName: string;
  email: string;
  groupId?: string;
}
