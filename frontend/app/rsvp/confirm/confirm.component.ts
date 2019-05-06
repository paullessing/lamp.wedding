import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RsvpAnswer } from '../../../../shared';

@Component({
  selector: 'app-rsvp-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent {

  @Input()
  public answer: RsvpAnswer;

  @Input()
  public error: { status: string, data?: string };

  @Output()
  public submit: EventEmitter<void>;

  public submitted: boolean;
  public completed: boolean;

  constructor() {
    this.submit = new EventEmitter<void>();
  }

  public onSubmit(): void {
    if (this.completed) {
      return;
    }

    this.completed = true;
    this.submit.emit();
  }
}
