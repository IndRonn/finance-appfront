import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetResponse } from '@core/models/budget.model';

@Component({
  selector: 'app-budget-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './budget-progress.component.html',
  styleUrls: ['./budget-progress.component.scss']
})
export class BudgetProgressComponent {
  @Input({ required: true }) budget!: BudgetResponse;
  @Output() edit = new EventEmitter<BudgetResponse>();
  @Output() delete = new EventEmitter<number>();

  /**
   * Calculamos el ratio forzando tipos numéricos para evitar errores con strings.
   */
  get ratio(): number {
    const limit = Number(this.budget.limitAmount);
    const spent = Number(this.budget.spentAmount);

    if (!limit || limit === 0) return 0;
    return spent / limit;
  }

  get widthPercentage(): number {
    const pct = this.ratio * 100;
    // Mínimo 2% para que se vea algo aunque sea muy poco
    if (pct > 0 && pct < 2) return 2;
    return Math.min(pct, 100);
  }

  get statusClass(): string {
    const r = this.ratio;

    if (r >= 1.0) return 'overkill'; // > 100%
    if (r >= 0.9) return 'danger';   // > 90%
    if (r >= 0.7) return 'warning';  // > 70%
    return 'success';                // < 70% (Verde)
  }
}
