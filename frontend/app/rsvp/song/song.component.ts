import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RsvpAnswer } from '../../../../shared';

export interface Song {
  title: string;
  artist: string;
}

@Component({
  selector: 'app-rsvp-song',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.scss']
})
export class SongComponent implements OnInit {

  @Input()
  public answer: Partial<RsvpAnswer>;

  @Input()
  public isFullGuest: boolean;

  @Output()
  public submit: EventEmitter<Song | null>;

  public form: FormGroup;
  public submitted: boolean;

  constructor(
    private fb: FormBuilder
  ) {
    this.submit = new EventEmitter();
  }

  public ngOnInit(): void {
    this.form = this.fb.group({
      artist: [this.answer.songArtist, [Validators.required]],
      title: [this.answer.songTitle, [Validators.required]]
    });
  }

  public onSubmit($event: Event): void {
    $event.stopPropagation();
    this.submitted = true;

    if (this.form.value.noAnswer) {
      this.submit.emit(null);
    } else {
      if (!this.form.valid) {
        return;
      }

      this.submit.emit(this.form.value);
    }
  }
}
