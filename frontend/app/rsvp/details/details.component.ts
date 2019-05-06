import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RsvpAnswer } from '../../../../shared';

export interface Details {
  email?: string;
  phoneNumber?: string;
}

@Component({
  selector: 'app-rsvp-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {

  @Input()
  public answer: Partial<RsvpAnswer>;

  @Output()
  public submit: EventEmitter<Details>;

  public form: FormGroup;
  public submitted: boolean;

  constructor(
    private fb: FormBuilder
  ) {
    this.submit = new EventEmitter();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      email: [
        this.answer.email,
        this.answer.isAttending ? [Validators.required, Validators.email] : [(control: AbstractControl) =>
          control.value ? Validators.email(control) : null
        ]
      ],
      phoneNumber: [
        this.answer.phoneNumber,
        this.answer.isAttending ? [Validators.required, Validators.pattern(
          /^(\+.{9,}|0\s?(\d\s?){10})$/
        )] : null
      ],
    });
  }

  public onSubmit($event: Event): void {
    $event.stopPropagation();
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    this.submit.emit(this.form.value);
  }
}
