import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyRitualComponent } from './daily-ritual.component';

describe('DailyRitualComponent', () => {
  let component: DailyRitualComponent;
  let fixture: ComponentFixture<DailyRitualComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DailyRitualComponent]
    });
    fixture = TestBed.createComponent(DailyRitualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
