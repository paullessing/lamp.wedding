import { Component, OnDestroy, OnInit } from '@angular/core';
import { DayNightService } from '../services/day-night.service';
import { animate, state, style, transition, trigger } from '@angular/animations';

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
//           query('.content', animate(1000, style({ opacity: 1 })),
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
    trigger('background', [
      state('false', style({
        backgroundColor: 'white'
      })),
      state('true', style({
        backgroundColor: '#001d77'
      })),
      transition('false => true', [animate('2s')]),
    ]),
    trigger('lighthouse', [
      state('false', style({
        opacity: '1'
      })),
      state('true', style({
        opacity: '0'
      })),
      transition('false => true', [
        animate('2s', style({ opacity: '1' })),
        animate('3s', style({ opacity: '0' })),
      ]),
    ]),
  ]
})
export class HomepageComponent {

  public night: boolean = false;

  constructor(
  ) {}

  public toggle(): void {
    this.night = true;
  }
}
