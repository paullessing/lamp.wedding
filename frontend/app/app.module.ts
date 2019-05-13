import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Route, RouterModule, UrlMatchResult, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { AppComponent } from './app.component';
import { DefaultPageComponent } from './default-page/default-page.component';
import { GuestNamePipe } from './guest-name.pipe';
import { HomepageComponent } from './homepage/homepage.component';
import { LogViewGuard } from './homepage/log-view.guard';
import { LocationComponent } from './location/location.component';
import { NavigationComponent } from './navigation/navigation.component';
import { AttendingComponent } from './rsvp/attending/attending.component';
import { ConfirmComponent } from './rsvp/confirm/confirm.component';
import { DetailsComponent } from './rsvp/details/details.component';
import { DietariesComponent } from './rsvp/dietaries/dietaries.component';
import { DoneComponent } from './rsvp/done/done.component';
import { FindUserComponent } from './rsvp/find-user/find-user.component';
import { RsvpComponent } from './rsvp/rsvp.component';
import { SongComponent } from './rsvp/song/song.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { DayNightService } from './services/day-night.service';

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
    DetailsComponent,
    DietariesComponent,
    SongComponent,
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
