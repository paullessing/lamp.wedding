import { Component, OnDestroy, OnInit } from '@angular/core';
import { DayNightService, DayOrNight } from '../services/day-night.service';
import { Observable, Subscription } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  animations: [
    trigger('background', [
      state('night', style({
        backgroundColor: 'navy'
      })),
      state('day', style({
        backgroundColor: 'white'
      })),
      transition('* => *', [animate('3s')]),
    ])
  ]
})
export class HomepageComponent implements OnInit, OnDestroy {

  public dayOrNight$: Observable<DayOrNight>;
  public lighthouseClass: DayOrNight = 'day';

  private subscription: Subscription;
  private currentTime: DayOrNight = 'day';

  constructor(
    private dayNightService: DayNightService
  ) {}

  public ngOnInit(): void {
    this.dayOrNight$ = this.dayNightService.state$;
    this.subscription = this.dayOrNight$.subscribe((value) => this.currentTime = value);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public toggle(): void {
    this.dayNightService.toggle();
  }
}
