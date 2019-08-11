import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RsvpClosedComponent } from './rsvp-closed.component';

describe('RsvpClosedComponent', () => {
  let component: RsvpClosedComponent;
  let fixture: ComponentFixture<RsvpClosedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RsvpClosedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RsvpClosedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
