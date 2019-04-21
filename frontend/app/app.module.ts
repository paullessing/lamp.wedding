import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Route, RouterModule, UrlMatchResult, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomepageComponent } from './homepage/homepage.component';
import { DayNightService } from './services/day-night.service';
import { HttpClientModule } from '@angular/common/http';
import { LogViewGuard } from './homepage/log-view.guard';
import { DefaultPageComponent } from './default-page/default-page.component';
import { LocationComponent } from './location/location.component';
import { NavigationComponent } from './navigation/navigation.component';
import { ScheduleComponent } from './schedule/schedule.component';

export function matchAllExceptEmptyUrl(segments: UrlSegment[], group: UrlSegmentGroup, route: Route): UrlMatchResult | null {
  // Matches anything except the empty URL
  return segments.length >= 1 ? { consumed: [] } : null
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([{
      matcher: matchAllExceptEmptyUrl,
      component: DefaultPageComponent,
      children: [
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
  ],
  providers: [
    DayNightService,
    LogViewGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
