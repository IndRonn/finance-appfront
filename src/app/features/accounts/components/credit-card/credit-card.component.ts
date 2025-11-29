import { Component, Input, OnInit, OnChanges } from '@angular/core';
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

  Currency = Currency;

  // Métricas Financieras
  availableAmount = 0;
  debtAmount = 0;
  totalLimit = 0;
  usagePercentage = 0;

  // Métricas de Tiempo (Strings formateados)
  periodRange: string = '--';
  nextPaymentDisplay: string = '--';

  ngOnInit() {
    this.refreshData();
  }

  ngOnChanges() {
    this.refreshData();
  }

  private refreshData() {
    this.calculateFinancials();
    this.calculateDates();
  }

  private calculateFinancials() {
    this.totalLimit = this.account.creditLimit || 0;
    this.debtAmount = this.account.initialBalance || 0;
    this.availableAmount = this.totalLimit - this.debtAmount;

    if (this.availableAmount < 0) this.availableAmount = 0;

    if (this.totalLimit > 0) {
      this.usagePercentage = (this.debtAmount / this.totalLimit) * 100;
      if (this.usagePercentage > 100) this.usagePercentage = 100;
    } else {
      this.usagePercentage = 0;
    }
  }

  private calculateDates() {
    // Si no hay datos de fechas, mostramos placeholders
    if (!this.account.closingDate || !this.account.paymentDate) return;

    const today = new Date();
    const currentDay = today.getDate();
    const closingDay = this.account.closingDate;

    // LÓGICA DE CICLO:
    // Si hoy es 15 y cierra el 20: Estamos en el ciclo que cierra ESTE mes.
    // Si hoy es 25 y cierra el 20: Estamos en el ciclo que cierra el PRÓXIMO mes.

    let periodStart: Date;
    let periodEnd: Date;

    if (currentDay <= closingDay) {
      // Ciclo actual: (Cierre mes pasado + 1) al (Cierre este mes)
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1, closingDay + 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth(), closingDay);
    } else {
      // Nuevo ciclo: (Cierre este mes + 1) al (Cierre próximo mes)
      periodStart = new Date(today.getFullYear(), today.getMonth(), closingDay + 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, closingDay);
    }

    // Formatear: "15 Nov - 14 Dic"
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startStr = periodStart.toLocaleDateString('es-ES', options);
    const endStr = periodEnd.toLocaleDateString('es-ES', options);

    this.periodRange = `${startStr} - ${endStr}`;

    // LÓGICA DE PAGO:
    // Asumimos que el pago es el día 'paymentDate' del mes siguiente al cierre del periodo.
    // Ojo: Esto es una estimación. Si el pago es el mismo mes, habría que ajustar.
    // Por estándar, si cierras el 20, pagas el 5 del siguiente.

    const paymentMonth = periodEnd.getMonth() + 1; // Mes siguiente al fin del periodo
    const paymentYear = periodEnd.getFullYear() + (paymentMonth > 11 ? 1 : 0);

    const paymentDateReal = new Date(paymentYear, paymentMonth, this.account.paymentDate);

    this.nextPaymentDisplay = paymentDateReal.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long'
    });
  }

  getProgressColor(): string {
    if (this.usagePercentage > 90) return 'var(--color-danger)';
    if (this.usagePercentage > 50) return 'var(--color-warning)'; // Naranja/Dorado
    return 'var(--color-primary)'; // Verde
  }

  getGradient(): string {
    return 'linear-gradient(135deg, #243B55 0%, #141E30 100%)';
  }

  getBackground(): string {
    return 'linear-gradient(135deg, #243B55 0%, #141E30 100%)';
  }
}
