import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Guest } from '../../../../shared/guest.model';
import { RsvpAnswer } from '../../../../shared/rsvp-answer.model';

export interface AttendingAnswer {
  isAttending: boolean;
  otherGuests: Guest[];
}

@Component({
  selector: 'app-rsvp-attending',
  templateUrl: './attending.component.html',
  styleUrls: ['./attending.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendingComponent implements OnInit {

  @Input()
  public answer: Partial<RsvpAnswer>;

  @Input()
  public guest: Guest;

  @Input()
  public otherGuests: Guest[];

  @Output()
  public submit: EventEmitter<AttendingAnswer>;

  public form: FormGroup;
  public submitted: boolean;
  public isWarningDismissed: boolean;

  constructor(
    private fb: FormBuilder
  ) {
    this.submit = new EventEmitter();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      isAttending: [this.answer.isAttending, Validators.required],
      guests: this.fb.array((this.otherGuests || []).map((guest) => [
        this.isAttending(guest)
      ]))
    });
  }

  public get guestControls(): AbstractControl[] {
    return (this.form.get(['guests']) as FormArray).controls;
  }

  public onSubmit($event: Event): void {
    $event.stopPropagation();
    if (this.needsToShowWarning) {
      return;
    }

    this.submitted = true;
    if (this.form.valid) {
      const otherGuests = this.otherGuests.filter((_, i) => this.form.value.guests[i]);

      const answer: AttendingAnswer = {
        isAttending: this.form.value.isAttending,
        otherGuests
      };

      this.submit.emit(answer);
    }
  }

  public get isMultiple(): boolean {
    return this.form && this.form.value.guests.filter(x => !!x).length > 0;
  }

  public get isAll(): boolean {
    return !this.form || this.form.value.guests.filter(x => !x).length === 0;
  }

  public get needsToShowWarning(): boolean {
    return this.form.value.isAttending === true && !this.isAll && !this.isWarningDismissed;
  }

  public dismissWarning(): void {
    this.isWarningDismissed = true;
  }

  private isAttending(guest: Guest): boolean {
    return (this.answer && this.answer.guests || []).map(_guest => _guest.id).indexOf(guest.id) >= 0;
  }
}
