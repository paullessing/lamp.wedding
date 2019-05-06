import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Route, RouterModule, UrlMatchResult, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomepageComponent } from './homepage/homepage.component';
import { AttendingComponent } from './rsvp/attending/attending.component';
import { ConfirmComponent } from './rsvp/confirm/confirm.component';
import { DietariesComponent } from './rsvp/dietaries/dietaries.component';
import { DoneComponent } from './rsvp/done/done.component';
import { DayNightService } from './services/day-night.service';
import { HttpClientModule } from '@angular/common/http';
import { LogViewGuard } from './homepage/log-view.guard';
import { DefaultPageComponent } from './default-page/default-page.component';
import { LocationComponent } from './location/location.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { RsvpComponent } from './rsvp/rsvp.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FindUserComponent } from './rsvp/find-user/find-user.component';
import { GuestNamePipe } from './guest-name.pipe';

export function matchAllExceptEmptyUrl(segments: UrlSegment[], group: UrlSegmentGroup, route: Route): UrlMatchResult | null {
  // Matches anything except the empty URL
  return segments.length >= 1 ? { consumed: [] } : null
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    ReactiveFormsModule,

    HttpClientModule,
    RouterModule.forRoot([{
      matcher: matchAllExceptEmptyUrl,
      component: DefaultPageComponent,
      children: [
        {
          path: 'rsvp/:userId',
          component: RsvpComponent,
        },
        {
          path: 'rsvp',
          component: FindUserComponent,
        },
        {
          path: 'location',
          component: LocationComponent
        },
        {
          path: 'schedule',
          component: ScheduleComponent
        },
      ]
    },
    {
      path: '**',
      canActivate: [LogViewGuard],
      component: HomepageComponent
    }])
  ],
  declarations: [
    AppComponent,
    HomepageComponent,
    DefaultPageComponent,
    LocationComponent,
    NavigationComponent,
    ScheduleComponent,
    RsvpComponent,
    FindUserComponent,
    AttendingComponent,
    DietariesComponent,
    ConfirmComponent,
    DoneComponent,

    GuestNamePipe,
  ],
  providers: [
    DayNightService,
    LogViewGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
