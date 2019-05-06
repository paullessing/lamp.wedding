import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DietariesComponent } from './dietaries.component';

describe('DietariesComponent', () => {
  let component: DietariesComponent;
  let fixture: ComponentFixture<DietariesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DietariesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DietariesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
