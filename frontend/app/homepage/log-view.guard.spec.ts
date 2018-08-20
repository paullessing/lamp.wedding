import { TestBed, async, inject } from '@angular/core/testing';

import { LogViewGuard } from './log-view.guard';

describe('LogViewGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogViewGuard]
    });
  });

  it('should ...', inject([LogViewGuard], (guard: LogViewGuard) => {
    expect(guard).toBeTruthy();
  }));
});
