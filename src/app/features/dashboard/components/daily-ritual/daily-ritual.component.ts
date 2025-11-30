import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DailyStatus, DailyCloseRequest } from '@core/models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { AccountService } from '@features/accounts/services/account.service';
import { SavingsGoalService } from '@features/savings/services/savings-goal.service';
import { Account } from '@core/models/account.model';
import { SavingsGoalResponse } from '@core/models/savings-goal.model';

@Component({
  selector: 'app-daily-ritual',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './daily-ritual.component.html',
  styleUrls: ['./daily-ritual.component.scss']
})
export class DailyRitualComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dashboardService = inject(DashboardService);
  private accountService = inject(AccountService);
  private savingsService = inject(SavingsGoalService);

  @Input({ required: true }) status!: DailyStatus; // El estado del día
  @Output() close = new EventEmitter<void>(); // Cancelar
  @Output() completed = new EventEmitter<void>(); // Éxito

  // Datos para selects
  accounts = signal<Account[]>([]);
  goals = signal<SavingsGoalResponse[]>([]);

  // Estado UI
  step = signal<1 | 2>(1); // Paso 1: Decisión, Paso 2: Detalles
  selectedAction = signal<'SAVE' | 'ROLLOVER' | null>(null);
  isSubmitting = signal(false);

  ritualForm = this.fb.group({
    targetGoalId: [null as number | null],
    sourceAccountId: [null as number | null, [Validators.required]]
  });

  ngOnInit() {
    // Cargar datos necesarios
    this.accountService.getMyAccounts().subscribe(accs =>
      this.accounts.set(accs.filter(a => a.type === 'DEBITO' || a.type === 'EFECTIVO'))
    );
    this.savingsService.getAll().subscribe(goals => this.goals.set(goals));

    // Preseleccionar cuenta con más saldo por UX
    // (Lógica simplificada)
  }

  selectAction(action: 'SAVE' | 'ROLLOVER') {
    this.selectedAction.set(action);

    if (action === 'SAVE') {
      this.ritualForm.get('targetGoalId')?.setValidators([Validators.required]);
    } else {
      this.ritualForm.get('targetGoalId')?.clearValidators();
    }
    this.ritualForm.get('targetGoalId')?.updateValueAndValidity();

    this.step.set(2);
  }

  submitRitual() {
    if (this.ritualForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.ritualForm.value;

    const request: DailyCloseRequest = {
      date: this.status.date, // La fecha que estamos cerrando
      amount: this.status.availableForToday, // El sobrante
      action: this.selectedAction()!,
      sourceAccountId: formVal.sourceAccountId!,
      targetSavingsGoalId: formVal.targetGoalId || undefined
    };

    this.dashboardService.closeDailyBox(request).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.completed.emit();
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      }
    });
  }
}
