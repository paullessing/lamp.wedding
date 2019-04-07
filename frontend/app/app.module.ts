import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomepageComponent } from './homepage/homepage.component';
import { DayNightService } from './services/day-night.service';
import { HttpClientModule } from '@angular/common/http';
import { Route, RouterModule, UrlMatchResult, UrlSegment, UrlSegmentGroup } from '@angular/router';
import { LogViewGuard } from './homepage/log-view.guard';
import { DefaultPageComponent } from './default-page/default-page.component';
import { LocationComponent } from './location/location.component';

export function matchEverythingExceptEmptyUrl(segments: UrlSegment[], group: UrlSegmentGroup, route: Route): UrlMatchResult {
  // Matches anything except the empty URL
  return segments.length >= 1 ? { consumed: [] } : null
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([{
      matcher: matchEverythingExceptEmptyUrl,
      component: DefaultPageComponent,
      children: [{
        path: 'location',
        component: LocationComponent
      }]
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
  ],
  providers: [
    DayNightService,
    LogViewGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
