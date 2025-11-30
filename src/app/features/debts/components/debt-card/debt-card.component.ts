import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebtResponse } from '@core/models/debt.model';

@Component({
  selector: 'app-debt-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './debt-card.component.html',
  styleUrls: ['./debt-card.component.scss']
})
export class DebtCardComponent {
  @Input({ required: true }) debt!: DebtResponse;

  @Output() edit = new EventEmitter<DebtResponse>();
  @Output() delete = new EventEmitter<number>();
  @Output() amortize = new EventEmitter<DebtResponse>(); // <--- Nuevo evento: Pagar

  // Calculamos porcentaje pagado para la barra
  // El backend envía progressPercentage (cuanto falta o cuanto lleva, según la impl).
  // Asumiremos que el backend envía % PAGADO (0 a 1).
  get paidPercentage(): number {
    return (this.debt.progressPercentage || 0);
  }
}
