import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // <--- Importante

// Services & Models
import { TransactionService } from './services/transaction.service';
import { AccountService } from '@features/accounts/services/account.service'; // <--- Importar
import { ModalStateService } from '@core/services/modal-state.service'; // <--- Para editar
import { Transaction } from '@core/models/transaction.model';
import { TransactionType } from '@core/models/enums.model';

interface DailyGroup {
  date: string;
  originalDate: Date;
  transactions: Transaction[];
  dailyTotal: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService); // <--- Inyectar
  private modalState = inject(ModalStateService);  // <--- Inyectar
  private destroyRef = inject(DestroyRef);

  isLoading = signal(true);
  groupedTransactions = signal<DailyGroup[]>([]);
  TransactionType = TransactionType;

  ngOnInit() {
    this.loadHistory();
    this.setupAutoRefresh(); // <--- Activar escucha
  }

  // --- TIEMPO REAL ---
  private setupAutoRefresh() {
    this.accountService.refreshNeeded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Si se crea un movimiento desde el Header, actualizamos la lista
        this.loadHistory();
      });
  }

  loadHistory() {
    // Si es refresh automático, podrías evitar el spinner si quisieras
    // this.isLoading.set(true);
    this.transactionService.getHistory().subscribe({
      next: (data) => {
        const groups = this.groupByDate(data);
        this.groupedTransactions.set(groups);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }

  // --- ACCIONES CRUD ---

  editTransaction(tx: Transaction) {
    this.modalState.openEditTransaction(tx);
  }

  deleteTransaction(id: number) {
    if(!confirm('¿Eliminar este movimiento? El saldo será restaurado.')) return;

    this.transactionService.deleteTransaction(id).subscribe({
      // No necesitamos llamar a loadHistory() aquí porque el servicio ya hace
      // tap(() => notifyRefresh()), lo que dispara el setupAutoRefresh() de arriba.
      error: (e) => console.error(e)
    });
  }

  // --- HELPERS DE AGRUPACIÓN (Igual que antes) ---
  private groupByDate(transactions: Transaction[]): DailyGroup[] {
    const groups: { [key: string]: DailyGroup } = {};

    transactions.forEach(tx => {
      const dateKey = tx.transactionDate.substring(0, 10);
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

    // Ajuste de zona horaria simple para comparar fechas locales
    const dStr = date.toISOString().split('T')[0];
    const tStr = today.toISOString().split('T')[0];
    const yStr = yesterday.toISOString().split('T')[0];

    if (dStr === tStr) return 'Hoy';
    if (dStr === yStr) return 'Ayer';

    // Como date viene de "YYYY-MM-DD" y new Date() asume UTC a veces,
    // usamos la fecha con la parte de tiempo T00:00 para formatear seguro
    const localDate = new Date(dStr + 'T00:00:00');
    return localDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }
}
