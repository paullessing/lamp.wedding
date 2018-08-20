import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomepageComponent } from './homepage/homepage.component';
import { DayNightService } from './services/day-night.service';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LogViewGuard } from './homepage/log-view.guard';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot([{
      path: '**',
      canActivate: [LogViewGuard],
      component: HomepageComponent
    }])
  ],
  declarations: [
    AppComponent,
    HomepageComponent,
  ],
  providers: [
    DayNightService,
    LogViewGuard,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
