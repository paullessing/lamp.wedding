import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DayNightService } from './services/day-night.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document,
    private dayNightService: DayNightService,
  ) {
    this.dayNightService.state$.subscribe((state) => {
      this.document.body.classList.toggle('day', state === 'day');
    });
  }

  public ngOnInit(): void {
    this.document.documentElement.classList.remove('preload');
  }
}
