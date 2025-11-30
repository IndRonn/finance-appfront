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
  // RESTAURAMOS LOS OUTPUTS
  @Output() edit = new EventEmitter<Account>();
  @Output() delete = new EventEmitter<number>();

  Currency = Currency;

  availableAmount = 0;
  debtAmount = 0;
  totalLimit = 0;
  usagePercentage = 0;
  periodRange: string = '--';
  nextPaymentDisplay: string = '--';

  // Estado para confirmación de borrado
  isConfirmingDelete = signal(false);

  ngOnInit() {
    this.refreshData();
  }

  ngOnChanges() {
    this.refreshData();
  }

  handleDelete() {
    if (this.isConfirmingDelete()) {
      // Si ya estaba confirmando, emitimos el borrado real
      this.delete.emit(this.account.id);
    } else {
      // Primera vez: activamos estado de confirmación
      this.isConfirmingDelete.set(true);
      // Timeout para cancelar si se arrepiente (3 segundos)
      setTimeout(() => this.isConfirmingDelete.set(false), 3000);
    }
  }

  // ... (El resto de métodos calculateFinancials, calculateDates, getBackground se mantienen IGUAL) ...
  // Asegúrate de incluir el método getBackground() que ya tenías.

  private refreshData() {
    this.calculateFinancials();
    this.calculateDates();
  }

  private calculateFinancials() {
    this.totalLimit = Number(this.account.creditLimit) || 0;
    this.debtAmount = Number(this.account.initialBalance) || 0;
    this.availableAmount = Math.max(0, this.totalLimit - this.debtAmount);

    if (this.totalLimit > 0) {
      this.usagePercentage = (this.debtAmount / this.totalLimit) * 100;
      this.usagePercentage = Math.min(this.usagePercentage, 100);
    } else {
      this.usagePercentage = 0;
    }
  }

  private calculateDates() {
    if (this.account.closingDate === null || this.account.closingDate === undefined ||
      this.account.paymentDate === null || this.account.paymentDate === undefined) {
      this.periodRange = '--';
      this.nextPaymentDisplay = '--';
      return;
    }

    const today = new Date();
    const currentDay = today.getDate();
    const closingDay = Number(this.account.closingDate);
    const paymentDay = Number(this.account.paymentDate);

    let periodStart: Date, periodEnd: Date;

    if (currentDay <= closingDay) {
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth(), closingDay);
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth(), closingDay + 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, closingDay);
    }

    const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
    this.periodRange = `${fmt.format(periodStart)} - ${fmt.format(periodEnd)}`;

    let paymentDateReal = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), paymentDay);
    if (paymentDay < closingDay) {
      paymentDateReal.setMonth(paymentDateReal.getMonth() + 1);
    }

    this.nextPaymentDisplay = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'long'
    }).format(paymentDateReal);
  }

  getBackground(): string {
    return 'linear-gradient(135deg, #243B55 0%, #141E30 100%)';
  }
}
