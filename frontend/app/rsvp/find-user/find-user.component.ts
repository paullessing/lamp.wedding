import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Guest, GuestId } from '../../../../shared';
import { GuestService } from '../../services/guest.service';

@Component({
  selector: 'app-rsvp',
  templateUrl: './find-user.component.html',
  styleUrls: ['./find-user.component.scss']
})
export class FindUserComponent implements OnInit {

  public notFound: boolean;
  public results: Guest[] | null;
  public loading: boolean;
  public error: string;

  public form: FormGroup;
  public submitted: boolean;
  public selectUserForm: FormGroup;
  public selectUserSubmitted: boolean;

  constructor(
    private guestService: GuestService,
    private fb: FormBuilder,
    private router: Router
  ) {
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', [Validators.required, Validators.minLength(2)]],
    })
  }

  public findUser() {
    this.notFound = false;
    this.results = null;
    this.submitted = true;

    if (!this.form.valid) {
      return;
    }
    const value = this.form.value;

    this.loading = true;

    this.guestService.find(value.firstName, value.lastName)
      .subscribe((guests: Guest[]) => {
        if (guests && guests.length === 1 &&
          guests[0].firstName.toLocaleLowerCase() === value.firstName.toLocaleLowerCase() &&
          guests[0].lastName.toLocaleLowerCase() === value.lastName.toLocaleLowerCase()) {
          this.goToForm(guests[0].id);
        }

        this.results = guests;
        this.selectUserForm = this.fb.group({
          userId: [null, [Validators.required]]
        });
      }, null, () => {
        this.loading = false;
      });

    console.log(value.firstName, value.lastName);
  }

  public restart(): void {
    this.results = null;
    this.submitted = false;
    this.selectUserForm = null;
    this.selectUserSubmitted = false;
    this.error = null;
  }

  public getFormError(): string | null {
    if (!this.submitted || this.form.valid) {
      return null;
    }
    if (this.form.hasError('required', ['firstName'])
      || this.form.hasError('required', ['lastName'])) {
      return 'required';
    }
    if (this.form.hasError('minlength', ['firstName'])
      || this.form.hasError('minlength', ['lastName'])) {
      return 'minlength'
    }
    return null;
  }

  public goToForm(userId?: GuestId): void {
    console.log('Submitting', this.selectUserForm, this.selectUserForm && this.selectUserForm.value, this.selectUserForm && this.selectUserForm.valid);
    userId = userId || this.getSelectedUserId();
    if (!userId) {
      console.error('No userId selected');
      return;
    }

    this.router.navigate(['rsvp', userId]);
  }

  private getSelectedUserId(): GuestId | null {
    if (this.results.length === 1) {
      return this.results[0].id;
    }

    if (this.selectUserForm && this.selectUserForm.valid) {
      return this.selectUserForm.value.userId;
    }

    return null;
  }
}
