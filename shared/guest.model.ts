export interface GuestId extends String {
  __phantom_guest_id: never;
}
export namespace GuestId {
  export function validate(id: string | GuestId | undefined | null): GuestId {
    if (!id) {
      throw new Error('Invalid GuestId');
    }
    return id as unknown as GuestId;
  }
}

export interface DateString extends String {
  __phantom_date_string: never;
}
export namespace DateString {
  export function convert(date: string | Date): DateString {
    if (typeof date === 'string') {
      return date as unknown as DateString;
    } else {
      return date.toISOString() as unknown as DateString;
    }
  }
}

export interface Guest {
  id: GuestId;
  index: number;
  firstName: string;
  lastName: string;
  email?: string;
  groupId?: string;
  viewedSaveTheDate?: DateString;
}

export type NewGuest = {
  [K in Exclude<keyof Guest, 'id'>]: Guest[K];
} & {
  id?: GuestId;
}

type x = Partial<Guest>
export interface GuestLookup {
  firstName: string;
  lastName: string;
  email: string;
  groupId?: string;
}
