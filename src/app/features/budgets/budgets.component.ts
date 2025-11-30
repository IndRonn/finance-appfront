import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetService } from './services/budget.service';
import { BudgetResponse } from '@core/models/budget.model';
import { BudgetProgressComponent } from './components/budget-progress/budget-progress.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, BudgetProgressComponent],
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.scss']
})
export class BudgetsComponent implements OnInit {
  private budgetService = inject(BudgetService);

  // Estado
  budgets = signal<BudgetResponse[]>([]);
  isLoading = signal(true);

  // Fecha seleccionada (Por defecto hoy)
  currentDate = signal(new Date());

  ngOnInit() {
    this.loadBudgets();
  }

  loadBudgets() {
    this.isLoading.set(true);

    // Extraemos mes (1-12) y año para la API
    const date = this.currentDate();
    const month = date.getMonth() + 1; // JS es 0-11, API espera 1-12
    const year = date.getFullYear();

    this.budgetService.getBudgets(month, year).subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando presupuestos', err);
        this.isLoading.set(false);
        // Fallback visual vacío si falla
        this.budgets.set([]);
      }
    });
  }

  // --- NAVEGACIÓN DE MESES ---
  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
    this.loadBudgets(); // Recargar datos
  }

  openCreateModal() {
    console.log('Abrir modal de nuevo presupuesto');
    // Pendiente: Implementar modal de creación (HU-09)
  }
}
