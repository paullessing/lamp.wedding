import { Component, OnDestroy, OnInit } from '@angular/core';
import { DayNightService } from '../services/day-night.service';
import { animate, group, keyframes, query, state, style, transition, trigger } from '@angular/animations';

// @Component({
//   selector: 'inner',
//   template: `
//     <div [@queryAnimation]="exp">
//       <h1>Title</h1>
//       <div class="content">
//         Blah blah blah
//       </div>
//     </div>
//   `,
//   animations: [
//     trigger('queryAnimation', [
//       transition('* => goAnimate', [
//         // hide the inner elements
//         query('h1', style({ opacity: 0 })),
//         query('.content', style({ opacity: 0 })),
//
//         // animate the inner elements in, one by one
//         query('h1', animate(1000, style({ opacity: 1 })),
//         query('.content', animate(1000, style({ opacity: 1 })),
//       ])
//     ])
//   ]
// })
// class Cmp {
//   exp = '';
//
//   goAnimate() {
//     this.exp = 'goAnimate';
//   }
// }


@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
  animations: [
    trigger('fadeBackground', [
      state('night', style({ backgroundColor: '#001d77' })),
      transition('day => night', animate('2s')),
    ]),
    trigger('fadeLighthouse', [
      state('title, details', style({ display: 'none' })),
      transition('night => title', [
        style({ display: 'block', opacity: 1 }),
        animate('6s', keyframes([
          style({ opacity: 1, offset: 0.66 }),
          style({ opacity: 0, offset: 1 }),
        ])),
      ]),
    ]),
    trigger('fadeTitle', [
      state('*', style({ display: 'block' })),
      state('night, title, details', style({ display: 'block', opacity: 1 })),
      transition('day => night', [
        style({ display: 'block', opacity: 0 }),
        animate('2s', style({ display: 'block', opacity: 1 })),
      //   // animate('6s',
      //   //   keyframes([
      //   //   style({ opacity: 0, offset: 0.66 }),
      //   //   style({ opacity: 1, offset: 1 }),
      //   // ])),
      ]),
    ]),

    trigger('fadeHeader', [
      state('details', style({ top: '23vh' })),
      transition('night => title', [
        style({ top: '*' }),
        animate('4.5s', style({ top: '*' })),
        animate('1.5s ease-in-out', style({ top: '23vh' })),
      ]),
    ]),

    trigger('growTitle', [
      state('title, details', style({ fontSize: '7rem' })),
      transition('* => title', [
        style({ fontSize: '*' }),
        animate('5.5s', style({ fontSize: '*' })),
        animate('1.5s', style({ fontSize: '7rem' })),
      ]),
    ]),

    trigger('fadeDetails', [
      state('*', style({ display: 'none' })),
      state('details', style({ display: 'block', opacity: 1 })),
      transition('title => details', [
        style({ display: 'block', opacity: 0 }),
        animate('1.5s ease-in-out', style({ opacity: 1 })),
      ]),
    ]),

    //   state('false', style({
    //     backgroundColor: 'white'
    //   })),
    //   state('true', style({
    //     backgroundColor: '#001d77'
    //   })),
    //   transition('false => true', [animate('2s')]),
    // ]),
    // trigger('lighthouse', [
    //   state('false', style({
    //     opacity: '1'
    //   })),
    //   state('true', style({
    //     opacity: '0'
    //   })),
    //   transition('false => true', [
    //     animate('2s', style({ opacity: '1' })),
    //     animate('3s', style({ opacity: '0' })),
    //   ]),
    // ]),
  ]
})
export class HomepageComponent {

  public animationState: 'day' | 'night' | 'title' | 'details';

  constructor(
  ) {
    this.animationState = 'day';
  }

  public goToNight(): void {
    this.animationState = 'night';
  }

  public showTitle(): void {
    if (this.animationState === 'night') {
      this.animationState = 'title';
    }
  }

  public showDetails(): void {
    if (this.animationState === 'title') {
      this.animationState = 'details';
    }
  }
}
