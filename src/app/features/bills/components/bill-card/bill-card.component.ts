import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillResponse, BillStatus } from '@core/models/bill.model';

@Component({
  selector: 'app-bill-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bill-card.component.html',
  styleUrls: ['./bill-card.component.scss']
})
export class BillCardComponent {
  @Input({ required: true }) bill!: BillResponse;

  @Output() pay = new EventEmitter<BillResponse>();   // Pagar
  @Output() clone = new EventEmitter<BillResponse>(); // Smart Cloning
  @Output() edit = new EventEmitter<BillResponse>();
  @Output() delete = new EventEmitter<number>();

  // Calculamos días restantes visualmente
  get daysDiff(): number {
    const due = new Date(this.bill.dueDate);
    const today = new Date();
    // Normalizamos horas
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get statusLabel(): string {
    if (this.bill.status === 'PAGADO') return 'PAGADO';
    if (this.daysDiff < 0) return 'VENCIDO';
    if (this.daysDiff === 0) return 'VENCE HOY';
    return `Vence en ${this.daysDiff} días`;
  }

  get statusClass(): string {
    if (this.bill.status === 'PAGADO') return 'paid';
    if (this.daysDiff <= 0) return 'overdue'; // Vencido o vence hoy
    if (this.daysDiff <= 3) return 'urgent';  // Próximo a vencer
    return 'pending';
  }

  copyServiceCode(event: Event) {
    event.stopPropagation();
    navigator.clipboard.writeText(this.bill.serviceCode);
    // Idealmente mostrar un mini toast aquí, por ahora solo log
    console.log('Código copiado:', this.bill.serviceCode);
  }
}
