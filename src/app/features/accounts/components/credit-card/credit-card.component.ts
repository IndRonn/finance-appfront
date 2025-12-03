import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Account } from '@core/models/account.model';
import { Currency } from '@core/models/enums.model';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './credit-card.component.html',
  styleUrls: ['./credit-card.component.scss']
})
export class CreditCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) account!: Account;
  @Output() edit = new EventEmitter<Account>();
  @Output() delete = new EventEmitter<number>();

  Currency = Currency;

  // --- VARIABLES VISUALES (LA TRÍADA) ---
  totalLimit = 0;       // Techo
  debtTotal = 0;        // Deuda Total (InitialBalance)
  statementAmount = 0;  // A Pagar YA
  currentCycle = 0;     // A Pagar Luego (Nuevo)

  availableAmount = 0;  // Disponible Real
  usagePercentage = 0;  // Para la barra

  // Fechas
  periodRange: string = '--';
  nextPaymentDisplay: string = '--';

  isConfirmingDelete = signal(false);

  ngOnInit() { this.refreshData(); }
  ngOnChanges() { this.refreshData(); }

  handleDelete() {
    if (this.isConfirmingDelete()) {
      this.delete.emit(this.account.id);
    } else {
      this.isConfirmingDelete.set(true);
      setTimeout(() => this.isConfirmingDelete.set(false), 3000);
    }
  }

  private refreshData() {
    this.mapFinancials();
    this.calculateDates();
  }

  private mapFinancials() {
    // 1. Mapeo Directo (Sin cálculos raros, confiamos en el Backend)
    this.totalLimit = Number(this.account.creditLimit) || 0;

    this.debtTotal = Number(this.account.initialBalance) || 0;        // TOTAL
    this.statementAmount = Number(this.account.statementBalance) || 0;// FACTURADO
    this.currentCycle = Number(this.account.currentCycleBalance) || 0;// NUEVO

    // 2. El Disponible siempre es: Límite - Deuda Total
    this.availableAmount = Math.max(0, this.totalLimit - this.debtTotal);

    // 3. Barra de Progreso (Salud Crediticia)
    if (this.totalLimit > 0) {
      this.usagePercentage = (this.debtTotal / this.totalLimit) * 100;
      this.usagePercentage = Math.min(this.usagePercentage, 100);
    } else {
      this.usagePercentage = 0;
    }
  }

  private calculateDates() {
    if (!this.account.closingDate || !this.account.paymentDate) {
      this.periodRange = '--';
      this.nextPaymentDisplay = '--';
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const currentDay = today.getDate();
    const closingDay = Number(this.account.closingDate);
    const paymentDay = Number(this.account.paymentDate);

    let cycleStart: Date, cycleEnd: Date;

    // Lógica de Visualización de Periodo
    if (currentDay <= closingDay) {
      cycleEnd = new Date(today.getFullYear(), today.getMonth(), closingDay);
      cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1);
    } else {
      cycleEnd = new Date(today.getFullYear(), today.getMonth() + 1, closingDay);
      cycleStart = new Date(today.getFullYear(), today.getMonth(), closingDay + 1);
    }

    const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
    this.periodRange = `${fmt.format(cycleStart)} - ${fmt.format(cycleEnd)}`;

    // Lógica Visual de Fecha de Pago
    let targetPayDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
    if (today.getDate() > paymentDay) {
      targetPayDate.setMonth(targetPayDate.getMonth() + 1);
    }
    this.nextPaymentDisplay = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' }).format(targetPayDate);
  }

  getBackground(): string {
    return 'linear-gradient(135deg, #243B55 0%, #141E30 100%)';
  }
}
