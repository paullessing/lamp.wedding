import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Guest, GuestId } from '../../../shared/guest.model';
import { map } from 'rxjs/operators';
import { ResponseData } from '../../../shared/response-data.model';
import { RsvpAnswer } from '../../../shared/rsvp-answer.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GuestService {

  private readonly _cache: { [guestId: string]: Guest };

  constructor(
    private http: HttpClient
  ) {
    this._cache = {};
  }

  public find(firstName: string, lastName: string): Observable<Guest[]> {
    return this.http.get(`${environment.apiHost}/api/guests/find`, {
      params: new HttpParams()
        .append('firstName', firstName)
        .append('lastName', lastName)
    }).pipe(
      map((data) => {
        const guests = (data['results'] || []) as Guest[];
        guests.forEach((guest) => this.cache(guest.id, guest));
        return guests;
      }),
    );
  }

  public getGuest(id: GuestId): Observable<Guest> {
    if (this.cache(id)) {
      return of(this.cache(id));
    }

    return this.http.get(`${environment.apiHost}/api/guests/${id}`).pipe(
      map((data: object) => {
        const guest = data['guest'] as Guest;
        this.cache(id, guest);
        return guest;
      }),
    );
  }

  public getResponseData(id: GuestId, token?: string): Observable<ResponseData> {
    const params = token ? new HttpParams({ fromObject: { token } }) : new HttpParams();
    return this.http.get(`${environment.apiHost}/api/guests/${id}/response`, { params }).pipe(
      map((res: object) => res as ResponseData),
    );
  }

  public sendRsvp(rsvp: RsvpAnswer): Observable<RsvpAnswer> {
    return this.http.put(`${environment.apiHost}/api/guests/${rsvp.guestId}/rsvp`, rsvp).pipe(
      map((response: object) => response as RsvpAnswer),
    );
  }

  private cache(id: GuestId, value?: Guest): Guest | undefined {
    if (typeof value !== 'undefined') {
      this._cache[id.toString()] = value;
    }
    return this._cache[id.toString()];
  }
}
