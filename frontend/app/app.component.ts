import { Component, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DayNightService } from './services/day-night.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    @Inject(DOCUMENT) private document,
    private dayNightService: DayNightService
  ) {
    this.dayNightService.state$.subscribe((state) => {
      console.log('STATE CHANGE', state);
      this.document.body.classList.toggle('night', state === 'night');
    });
  }
}
