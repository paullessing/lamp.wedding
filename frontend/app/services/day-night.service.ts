import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { share } from 'rxjs/operators';

export type DayOrNight = 'day' | 'night';

@Injectable({
  providedIn: 'root'
})
export class DayNightService {

  public get state$(): Observable<DayOrNight> {
    return this._state$.pipe(share());
  }

  private _state$: BehaviorSubject<DayOrNight>;

  constructor() {
    this._state$ = new BehaviorSubject<DayOrNight>('day');
  }

  public toggle(): void {
    const value = this._state$.getValue();
    console.log('toggling');
    this._state$.next(value === 'day' ? 'night' : 'day');
  }
}
