import { Component, OnInit } from '@angular/core';
import { animate, group, query, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  animations: [
    trigger('title', [
      state('day', style({ display: 'none', fontSize: '4em' })),
      state('night', style({ display: 'block', fontSize: '4em' })),
      state('title, details', style({ fontSize: '7em' })),
      transition('day => night', [
        style({ display: 'block', opacity: 0, fontSize: '4em' }),
        animate('2s cubic-bezier(.81, 0, 1, 0)', style({ display: 'block', opacity: 1, fontSize: '4em' })),
      ]),
      transition('night => title', [
        animate('1.5s 1.5s ease-in-out'),
      ]),
    ]),
    trigger('lighthouseFadeAway', [
      state('title, details', style({ display: 'none' })),
      transition('night => title', [
        style({ display: 'block', opacity: 1, height: '*', marginTop: '*', marginBottom: '*' }),
        group([
          animate('2s', style({ opacity: 0 })),
          animate('1.5s 1.5s ease-in-out', style({ height: 0, marginTop: 0, marginBottom: 0 })),
        ])
      ]),
    ]),

    trigger('headerMoveToTop', [
      state('title, details', style({ top: '23vh', fontSize: '1.2em' })),
      transition('night => title', [
        animate('1.5s 1.5s ease-in-out'),
      ]),
    ]),

    trigger('detailsFadeIn', [
      state('*', style({ display: 'none' })),
      state('details', style({ display: 'block' })),
      transition('* => details', group([
        query('.save-the-date', [
          style({ opacity: 0 }),
          animate('2s ease-in', style({ opacity: 1 }))
        ]),
        query('.date-and-location', [
          style({ opacity: 0 }),
          animate('2s 2.5s ease-in', style({ opacity: 1 }))
        ]),
        query('.signoff', [
          style({ opacity: 0 }),
          animate('2s 5.5s ease-in', style({ opacity: 1 }))
        ]),
      ])),
    ]),

    trigger('signoffFadeIn', [
      transition(':enter', [
        style({ display: 'block', opacity: 0 }),
        animate('1.5s ease-in-out', style({ opacity: 1 })),
      ]),
    ]),
  ]
})
export class HomepageComponent implements OnInit {

  public animationState: 'day' | 'night' | 'title' | 'details';
  public showSignoff = false;

  constructor(
  ) {
    this.animationState = 'day';
  }

  public ngOnInit(): void {
    setTimeout(() => this.start(), 2000);
  }

  public start(): void {
    if (this.animationState !== 'day') {
      return;
    }
    this.animationState = 'night';
    setTimeout(() => this.animationState = 'title', 3500);
    setTimeout(() => this.animationState = 'details', 6500);
    setTimeout(() => this.showSignoff = true, 5000);
  }
}
