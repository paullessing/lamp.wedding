import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Route, RouterModule, UrlMatchResult, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { AppComponent } from './app.component';
import { DefaultPageComponent } from './default-page/default-page.component';
import { GuestNamePipe } from './guest-name.pipe';
import { EnsureNightGuard } from './homepage/ensure-night.guard';
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
import { RsvpClosedComponent } from './rsvp/rsvp-closed/rsvp-closed.component';
import { RsvpComponent } from './rsvp/rsvp.component';
import { SongComponent } from './rsvp/song/song.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { DayNightService } from './services/day-night.service';
import { GiftsComponent } from './gifts/gifts.component';
import { PhotosComponent } from './photos/photos.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    ReactiveFormsModule,

    HttpClientModule,
    RouterModule.forRoot([{
      path: '',
      component: DefaultPageComponent,
      children: [
        {
          path: 'rsvp/:userId',
          component: RsvpClosedComponent,
        },
        {
          path: 'rsvp',
          component: RsvpClosedComponent,
        },
        {
          path: 'location',
          component: LocationComponent
        },
        {
          path: 'schedule',
          component: ScheduleComponent
        },
        {
          path: 'gifts',
          component: GiftsComponent
        },
        {
          path: 'photos',
          component: PhotosComponent,
        }, // http://picti.net/7QmGq
        {
          path: '**',
          component: HomepageComponent,
          canDeactivate: [EnsureNightGuard],
        },
      ]
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
    GiftsComponent,
    RsvpClosedComponent,

    GuestNamePipe,

    PhotosComponent,

  ],
  providers: [
    DayNightService,
    LogViewGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
