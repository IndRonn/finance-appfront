import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickTransactionModalComponent } from './quick-transaction-modal.component';

describe('QuickTransactionModalComponent', () => {
  let component: QuickTransactionModalComponent;
  let fixture: ComponentFixture<QuickTransactionModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuickTransactionModalComponent]
    });
    fixture = TestBed.createComponent(QuickTransactionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
