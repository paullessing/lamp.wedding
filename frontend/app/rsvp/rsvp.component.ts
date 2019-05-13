import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Base64 } from 'js-base64';
import { Guest } from '../../../shared/guest.model';
import { ResponseData } from '../../../shared/response-data.model';
import { DietaryRequirements, RsvpAnswer } from '../../../shared/rsvp-answer.model';
import { GuestService } from '../services/guest.service';
import { AttendingAnswer } from './attending/attending.component';
import { Details } from './details/details.component';
import { Song } from './song/song.component';

@Component({
  selector: 'app-rsvp',
  styleUrls: ['./rsvp.component.scss'],

  // TODO: This whole step business should be routing
  template: `
    <h1 class="page__title">
      RSVP
      <span *ngIf="guest">for {{ guest | guestName }}</span>
    </h1>

    <div
      *ngIf="!loading && !error"
      class="display-card display-card--wide text-left"
    >
      <app-rsvp-attending
        *ngIf="step === 'attending'"
        [answer]="answer"
        [guest]="data.guest"
        [otherGuests]="data.group"
        (submit)="onAttendingSubmitted($event)"
      ></app-rsvp-attending>

      <app-rsvp-details
        *ngIf="step === 'details'"
        [answer]="answer"
        (submit)="onDetailsSubmitted($event)"
      ></app-rsvp-details>

      <app-rsvp-dietaries
        *ngIf="step === 'food'"
        [answer]="answer"
        (submit)="onDietariesSubmitted($event)"
      ></app-rsvp-dietaries>
      
      <app-rsvp-song
        *ngIf="step === 'song'"
        [answer]="answer"
        (submit)="onSongSubmitted($event)"
      ></app-rsvp-song>

      <app-rsvp-confirm
        *ngIf="step === 'confirm'"
        [error]="confirmationError"
        [answer]="answer"
        (submit)="onConfirm()"
      ></app-rsvp-confirm>

      <app-rsvp-done
        *ngIf="step === 'done'"
      ></app-rsvp-done>

    </div>
    <div *ngIf="loading">Loading...</div>

    <div *ngIf="error" [ngSwitch]="error">
      <ng-container *ngSwitchCase="'not_found'">
        We could not find your details. Please check the URL.
      </ng-container>
      <ng-container *ngSwitchCase="'self_submitted'">
        Your RSVP has already been submitted! If you need to edit it, use the link in your confirmation email.
        <p>
          <a [routerLink]="['/']">Go back home</a>
        </p>
      </ng-container>
      <ng-container *ngSwitchCase="'other_submitted'">
        Your RSVP has already been submitted by {{ submittedBy }}!<br />
        If this was a mistake, please check with them.
        <p>
          <a [routerLink]="['/']">Go back home</a>
        </p>
      </ng-container>
    </div>
  `
})
export class RsvpComponent implements OnInit {

  public data: ResponseData;
  public loading: boolean;
  public error: null | 'not_found' | 'self_submitted' | 'other_submitted';
  public submittedBy: null | string = null;

  public step: string;

  public answer: Partial<RsvpAnswer>;

  public hasChanged: boolean;
  public confirmationError: { status: string, data?: string };

  public get canLeave(): boolean {
    return !this.hasChanged || this.step === 'done';
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private guestService: GuestService
  ) {}

  public get guest(): Guest {
    return this.data && this.data.guest;
  }

  @HostListener('window:hashchange')
  public hashChanged(): void {
    const hash = window.location.hash;
    setTimeout(() => {
      this.goToStep(hash);
    });
  }

  public ngOnInit(): void {
    const userId = this.activatedRoute.snapshot.params.userId;
    const token = this.activatedRoute.snapshot.queryParams.token;

    console.log('TOKEN', token);

    const storedData = sessionStorage.getItem('rsvpAnswer');
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as { guestId: string, answer: Partial<RsvpAnswer> };
        console.log('Stored data', data, data.guestId, userId);
        if (data.guestId === userId) {
          this.answer = data.answer;
        }
        if (token) {
          this.answer.token = token;
        }
        console.log(this.answer);
      } catch (e) {
        console.error(e);
        sessionStorage.removeItem('rsvpAnswer');
      }
    }

    this.loading = true;

    this.guestService.getResponseData(userId, token)
      .subscribe((data: ResponseData) => {
        this.data = data;
        this.loading = false;
        this.answer = this.answer || data.rsvp || {
          guestId: data.guest.id,
          guests: [data.guest]
        };
        this.loading = false;

        const step = window.location.hash || 'attending';
        this.goToStep(step, true);
      }, (response: HttpErrorResponse) => {
        if (response.status === 404) {
          this.loading = false;
          this.error = 'not_found';
        } if (response.status === 403) {
          this.loading = false;
          if (response.error && response.error.respondedBy) {
            this.error = 'other_submitted';
            this.submittedBy = response.error.respondedBy;
          } else {
            this.error = 'self_submitted';
          }
        } else {
          console.error(response);
          window.location.href = '/';
        }
      });
  }

  public onAttendingSubmitted(answer: AttendingAnswer): void {
    console.log('Is Attending', answer);

    this.answer.isAttending = answer.isAttending;
    this.answer.guests = [this.data.guest, ...answer.otherGuests];
    this.hasChanged = true;

    this.goToNextStep();
  }

  public onDetailsSubmitted({ email, phoneNumber }: Details): void {
    this.answer.email = email;
    this.answer.phoneNumber = phoneNumber;
    this.hasChanged = true;

    this.goToNextStep();
  }

  public onDietariesSubmitted(data: DietaryRequirements[]): void {
    this.answer.dietaries = data;
    this.hasChanged = true;

    this.goToNextStep();
  }

  public onSongSubmitted(song: Song): void {
    this.answer = {
      ...this.answer,
      songArtist: song.artist,
      songTitle: song.title
    };
    this.hasChanged = true;

    this.goToNextStep();
  }

  public onConfirm(): void {
    console.log('CONFIRMED', this.answer);

    this.guestService.sendRsvp(this.answer as RsvpAnswer)
      .subscribe((answer) => {
        console.log('SUCCESS', answer);
        this.answer = answer;
        sessionStorage.removeItem('rsvpAnswer');
        this.goToStep('done');
      }, (response: HttpErrorResponse) => {
        switch (response.status) {
          case 404:
            this.confirmationError = { status: 'not_found' };
            break;
          case 409:
            this.confirmationError = { status: 'already_confirmed' };
            break;
          case 400:
          case 500:
          default:
            this.confirmationError = { status: 'unknown_error', data: Base64.encode(JSON.stringify(response.error), true) };
        }
      });
  }

  private goToNextStep(): void {
    sessionStorage.setItem('rsvpAnswer', JSON.stringify({
      guestId: this.guest.id,
      answer: this.answer
    }));
    this.goToStep(this.getNextStep());
  }

  private getNextStep(): string | null {
    switch (this.step) {
      case 'attending':
        return 'details';
      case 'details':
        if (this.answer.isAttending) {
          return 'food';
        } else {
          return 'confirm';
        }
      case 'food':
        return 'song';
      case 'song':
        return 'confirm';
      case 'confirm':
        return 'done';

      default:
        return 'attending';
    }
  }

  private goToStep(step: string, replace?: boolean): void {
    step = step.replace(/^#/, '');
    const doGoToStep = (step: string): void => {
      console.log('going to step', step);
      this.step = step;
      if (replace) {
        const url = `${window.location}`.split('#')[0];
        history.replaceState(undefined, undefined, `${url}#${step}`);
      } else {
        window.location.hash = step;
      }
    };

    if (this.step === 'done') {
      return;
    }

    if (step === 'attending' || (typeof this.answer.isAttending !== 'boolean')) {
      doGoToStep('attending');
      return;
    }

    // Short-circuit for not attending guests
    if (this.answer.isAttending === false) {
      if (step === 'done') {
        doGoToStep('done');
        return;
      }
      if (step === 'confirm') {
        doGoToStep('confirm');
        return;
      }
    }

    if (step === 'details' || !this.answer.email || !this.answer.phoneNumber) {
      doGoToStep('details');
      return;
    }

    if (step === 'food' || !this.answer.dietaries || !this.answer.dietaries.length) {
      doGoToStep('food');
      return;
    }

    if (step === 'song' || !this.answer.songTitle || !this.answer.songArtist) {
      doGoToStep('song');
      return;
    }

    if (step === 'confirm') {
      doGoToStep('confirm');
      return;
    }

    if (step === 'done') {
      doGoToStep('done');
      return;
    }

    doGoToStep('attending'); // Catch-all
  }
}
