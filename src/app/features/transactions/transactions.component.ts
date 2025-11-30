import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from './services/transaction.service';
import { Transaction } from '@core/models/transaction.model';
import { TransactionType } from '@core/models/enums.model';

// Interfaz auxiliar para la agrupación visual
interface DailyGroup {
  date: string; // "Hoy", "Ayer", o fecha completa
  originalDate: Date; // Para ordenar
  transactions: Transaction[];
  dailyTotal: number; // Opcional: ver cuánto se gastó ese día
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

  isLoading = signal(true);
  groupedTransactions = signal<DailyGroup[]>([]);

  // Exponer el Enum al HTML
  TransactionType = TransactionType;

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading.set(true);
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

  // ALGORITMO DE AGRUPACIÓN (Magia Senior 🪄)
  private groupByDate(transactions: Transaction[]): DailyGroup[] {
    const groups: { [key: string]: DailyGroup } = {};

    // 1. Agrupar
    transactions.forEach(tx => {
      // Usamos la fecha corta (YYYY-MM-DD) como clave
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

      // Sumar al total del día si es gasto (negativo visualmente) o ingreso
      if (tx.type === TransactionType.GASTO) groups[dateKey].dailyTotal -= tx.amount;
      if (tx.type === TransactionType.INGRESO) groups[dateKey].dailyTotal += tx.amount;
    });

    // 2. Convertir a Array y Ordenar (Más reciente primero)
    return Object.values(groups)
      .sort((a, b) => b.originalDate.getTime() - a.originalDate.getTime())
      .map(group => ({
        ...group,
        date: this.getRelativeLabel(group.originalDate) // "Hoy", "Ayer", etc.
      }));
  }

  // Helper para etiquetas humanas
  private getRelativeLabel(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Normalizar a medianoche para comparar solo fechas
    const d = new Date(date.toDateString());
    const t = new Date(today.toDateString());
    const y = new Date(yesterday.toDateString());

    if (d.getTime() === t.getTime()) return 'Hoy';
    if (d.getTime() === y.getTime()) return 'Ayer';

    // Formato elegante: "Jueves, 24 de Nov"
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }
}
