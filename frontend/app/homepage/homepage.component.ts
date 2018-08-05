import { Component, OnInit } from '@angular/core';
import { DayNightService, DayOrNight } from '../services/day-night.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  public dayOrNight$: Observable<DayOrNight>;

  constructor(
    private dayNightService: DayNightService
  ) {}

  public ngOnInit(): void {
    this.dayOrNight$ = this.dayNightService.state$;
  }

  public toggle(): void {
    console.log('TOGGLING');
    this.dayNightService.toggle();
  }
}
