import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DietaryRequirements, Guest, RsvpAnswer } from '../../../../shared';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-rsvp-dietaries',
  templateUrl: './dietaries.component.html',
  styleUrls: ['./dietaries.component.scss']
})
export class DietariesComponent implements OnInit {

  @Input()
  public answer: RsvpAnswer;

  @Output()
  public submit: EventEmitter<DietaryRequirements[]>;

  public form: FormGroup;
  public submitted: boolean;

  constructor(
    private fb: FormBuilder
  ) {
    this.submit = new EventEmitter();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      guests: this.fb.array(
        this.answer.guests.map((guest: Guest, index: number) => {
          const answer = this.answer.dietaries && this.answer.dietaries[index];
          return this.fb.group({
            dietaries: [
              answer && answer.dietaries,
              [Validators.required, validDietary]],
            notes:
              [{ value: answer && answer.dietaryNotes, disabled: true },
                [Validators.required]]
          });
        })
      )
    });

    const updateNotesFields = (formValue: any): void => {
      formValue.guests.forEach((guest, index) => {
        const notes = this.form.get(['guests', index, 'notes']);

        if (guest.dietaries === 'Other' && !notes.enabled) {
          notes.enable();
        } else if (guest.dietaries !== 'Other' && notes.enabled) {
          notes.disable();
        }
      });
    };

    this.form.valueChanges.subscribe(updateNotesFields);
    updateNotesFields(this.form.value);
  }

  public getGuestControl(index: number): FormControl {
    return this.form.get(['guests', index]) as FormControl;
  }

  public onSubmit($event: Event): void {
    $event.stopPropagation();
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }

    const requirements: DietaryRequirements[] = this.form.value.guests
      .map((guest, index) => ({
        dietaries: guest.dietaries,
        dietaryNotes: guest.notes,
        ...this.answer.guests[index]
      }));

    this.submit.emit(requirements);
  }
}

function validDietary(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value && ['None', 'Vegetarian', 'Other'].indexOf(value) < 0) {
    return {
      invalid: 'Not a valid value'
    };
  }
  return null;
}
