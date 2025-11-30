import { TestBed } from '@angular/core/testing';

import { ExternalDebtService } from './external-debt.service';

describe('ExternalDebtService', () => {
  let service: ExternalDebtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExternalDebtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
