import { TestBed, inject } from '@angular/core/testing';

import { DayNightService } from './day-night.service';

describe('DayNightService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DayNightService]
    });
  });

  it('should be created', inject([DayNightService], (service: DayNightService) => {
    expect(service).toBeTruthy();
  }));
});
