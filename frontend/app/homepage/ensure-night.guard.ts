import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, switchMap, take } from 'rxjs/operators';
import { DayNightService } from '../services/day-night.service';

@Injectable({
  providedIn: 'root'
})
export class EnsureNightGuard implements CanDeactivate<any> {

  constructor(
    private dayNightService: DayNightService
  ) {}

  canDeactivate(): Observable<boolean> {
    return this.dayNightService.state$.pipe(
      take(1),
      switchMap((value) => {
        if (value === 'night') {
          return of(true);
        } else {
          this.dayNightService.toggle();
          return of(true).pipe(delay(2000));
        }
      })
    );
  }
}
