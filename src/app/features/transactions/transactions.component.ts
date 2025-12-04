import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services & Models
import { TransactionService } from './services/transaction.service';
import { AccountService } from '@features/accounts/services/account.service';
import { ModalStateService } from '@core/services/modal-state.service';
import { Transaction } from '@core/models/transaction.model';
import { TransactionType } from '@core/models/enums.model';
import { UiStateService } from "@core/services/ui-state.service";

// Components & Pipes
import { QuickTransactionModalComponent } from '@shared/components/quick-transaction-modal/quick-transaction-modal.component';
import { SlytherinCurrencyPipe } from '@shared/pipes/slytherin-currency.pipe';

interface DailyGroup {
  date: string;
  originalDate: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    QuickTransactionModalComponent,
    SlytherinCurrencyPipe
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private modalState = inject(ModalStateService);
  private destroyRef = inject(DestroyRef);
  private uiState = inject(UiStateService);

  // Signals
  isLoading = signal(true);
  groupedTransactions = signal<DailyGroup[]>([]);
  isModalOpen = signal(false);

  TransactionType = TransactionType;

  ngOnInit() {
    this.uiState.setPageTitle('Movimientos');
    this.loadHistory();
    this.setupAutoRefresh();
  }

  private setupAutoRefresh() {
    this.accountService.refreshNeeded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadHistory();
      });
  }

  loadHistory() {
    if (this.groupedTransactions().length === 0) this.isLoading.set(true);

    // CORRECCIÓN 1: Usar .getHistory() en lugar de .getAll()
    this.transactionService.getHistory().subscribe({

      // CORRECCIÓN 2: Tipar explícitamente 'data' como Transaction[]
      next: (data: Transaction[]) => {
        const groups = this.groupByDate(data);
        this.groupedTransactions.set(groups);
        this.isLoading.set(false);
      },

      // CORRECCIÓN 3: Tipar 'err' como any
      error: (err: any) => {
        console.error('Error cargando historial:', err);
        this.isLoading.set(false);
      }
    });
  }

  // ... (El resto del código: getIcon, editTransaction, deleteTransaction, groupByDate... se mantiene igual)

  getIcon(trx: Transaction): string {
    if (trx.type === TransactionType.INGRESO) return 'arrow_upward';
    if (trx.type === TransactionType.GASTO) return 'arrow_downward';
    return 'sync_alt';
  }

  openNewTransaction() {
    this.isModalOpen.set(true);
  }

  editTransaction(tx: Transaction) {
    this.modalState.openEditTransaction(tx);
  }

  deleteTransaction(id: number) {
    if(!confirm('¿Eliminar este movimiento? El saldo será restaurado.')) return;

    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        this.loadHistory();
      },
      error: (e: any) => console.error(e)
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onTransactionSaved() {
    this.closeModal();
    this.loadHistory();
  }

  private groupByDate(transactions: Transaction[]): DailyGroup[] {
    const groups: { [key: string]: DailyGroup } = {};

    transactions.forEach(tx => {
      const dateKey = new Date(tx.transactionDate).toISOString().split('T')[0];

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          originalDate: new Date(dateKey),
          transactions: [],
          dailyTotal: 0
        };
      }

      groups[dateKey].transactions.push(tx);

      if (tx.type === TransactionType.GASTO) groups[dateKey].dailyTotal -= tx.amount;
      if (tx.type === TransactionType.INGRESO) groups[dateKey].dailyTotal += tx.amount;
    });

    return Object.values(groups)
      .sort((a, b) => b.originalDate.getTime() - a.originalDate.getTime())
      .map(group => ({
        ...group,
        date: this.getRelativeLabel(group.originalDate)
      }));
  }

  private getRelativeLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const dStr = date.toISOString().split('T')[0];
    const tStr = today.toISOString().split('T')[0];
    const yStr = yesterday.toISOString().split('T')[0];

    if (dStr === tStr) return 'Hoy';
    if (dStr === yStr) return 'Ayer';

    const localDate = new Date(dStr + 'T12:00:00');
    return localDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }
}
