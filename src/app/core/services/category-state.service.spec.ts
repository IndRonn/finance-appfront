import { TestBed } from '@angular/core/testing';

import { CategoryStateService } from './category-state.service';

describe('CategoryStateService', () => {
  let service: CategoryStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
