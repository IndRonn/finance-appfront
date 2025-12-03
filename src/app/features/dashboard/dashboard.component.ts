import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

// Services
import { DashboardService } from './services/dashboard.service';
import { TransactionService } from '@features/transactions/services/transaction.service';
import { BillService } from '@features/bills/services/bill.service';
import { UiStateService } from '@core/services/ui-state.service';
import { AccountService } from '@features/accounts/services/account.service';

// Models
import { DailyStatus } from '@core/models/dashboard.model';
import { Transaction } from '@core/models/transaction.model';
import { BillResponse } from '@core/models/bill.model';

// Components & Pipes
import { DailyRitualComponent } from './components/daily-ritual/daily-ritual.component';
import { SlytherinCurrencyPipe } from '@shared/pipes/slytherin-currency.pipe'; // 👈 IMPORTANTE

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // 👇 AGREGAMOS EL PIPE AQUÍ
  imports: [CommonModule, DailyRitualComponent, RouterModule, SlytherinCurrencyPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private transactionService = inject(TransactionService);
  private billService = inject(BillService);
  private accountService = inject(AccountService);
  private destroyRef = inject(DestroyRef);
  public uiState = inject(UiStateService);

  // Estados
  status = signal<DailyStatus | null>(null);
  recentTransactions = signal<Transaction[]>([]);
  urgentBills = signal<BillResponse[]>([]);
  isLoading = signal(true);
  showRitual = signal(false);

  // Computed: Ganancia si ahorras hoy (Delta real contra el límite base)
  boostAmount = computed(() => {
    const s = this.status();
    if (!s || !s.dailyLimit) return 0;
    return s.projectedAvailableTomorrow - s.dailyLimit;
  });

  ngOnInit() {
    this.uiState.setPageTitle('Dashboard', 'Visión General');
    this.loadAllData();
    this.setupAutoRefresh();
  }

  // LÓGICA DE TIEMPO REAL
  private setupAutoRefresh() {
    this.accountService.refreshNeeded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadAllData();
      });
  }

  loadAllData() {
    this.isLoading.set(true);

    // 1. Estado del Día
    this.dashboardService.getDailyStatus().subscribe({
      next: (data) => {
        this.status.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // 2. Últimos Movimientos
    this.transactionService.getHistory().subscribe(txs => {
      this.recentTransactions.set(txs.slice(0, 5));
    });

    // 3. Alertas de Recibos
    this.billService.getBills().subscribe(bills => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const pending = bills.filter(b => {
        if (b.status === 'PAGADO') return false;
        const due = new Date(b.dueDate);
        return due <= nextWeek;
      });
      this.urgentBills.set(pending);
    });
  }

  // Acciones
  openRitual() { this.showRitual.set(true); }

  onRitualCompleted() {
    this.showRitual.set(false);
    this.accountService.notifyRefresh();
  }

  // Helpers Visuales
  getAvailabilityColor(amount: number): string {
    if (amount > 50) return 'var(--color-primary)';
    if (amount > 0) return 'var(--color-warning)';
    return 'var(--color-danger)';
  }

  getBillDueDays(dateStr: string): number {
    const due = new Date(dateStr);
    const today = new Date();
    due.setHours(0,0,0,0); today.setHours(0,0,0,0);
    const diff = due.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Porcentaje de Gasto Diario para la Barra
  get dailyProgressPct(): number {
    const s = this.status();
    if (!s || !s.dailyLimit || s.dailyLimit === 0) return 0;
    return Math.min((s.spentToday / s.dailyLimit) * 100, 100);
  }

  // Color dinámico de la barra
  get dailyProgressColor(): string {
    const pct = this.dailyProgressPct;
    if (pct >= 100) return 'var(--color-danger)';
    if (pct > 80) return 'var(--color-warning)';
    return 'var(--color-primary)';
  }
}
