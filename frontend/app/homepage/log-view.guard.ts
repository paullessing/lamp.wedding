import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LogViewGuard implements CanActivate {

  constructor(
    private http: HttpClient,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {

    const email = next.queryParams.email;

    if (email) {
      this.http.put('https://jb0mi6gek0.execute-api.eu-west-2.amazonaws.com/dev/view', { email })
        .subscribe();
    }

    return true;
  }
}
