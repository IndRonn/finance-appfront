import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services & Models
import { BudgetService } from './services/budget.service';
import { CategoryStateService } from '@core/services/category-state.service';
import { BudgetResponse, BudgetRequest } from '@core/models/budget.model';
import { CategoryResponse } from '@core/models/category.model';
import { TransactionType } from '@core/models/enums.model';

// Components
import { BudgetProgressComponent } from './components/budget-progress/budget-progress.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AutoFocusDirective } from '@shared/directives/auto-focus.directive';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, BudgetProgressComponent, ModalComponent, ReactiveFormsModule, AutoFocusDirective],
  templateUrl: './budgets.component.html',
  styleUrls: ['./budgets.component.scss']
})
export class BudgetsComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryStateService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Datos
  budgets = signal<BudgetResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);

  // UI State
  isLoading = signal(true);
  currentDate = signal(new Date());

  // Modal State
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingId = signal<number | null>(null); // <--- FALTABA ESTO (Control de Edición)

  // Formulario
  budgetForm = this.fb.group({
    categoryId: [null as number | null, [Validators.required]],
    limitAmount: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit() {
    this.loadBudgets();
    this.loadCategories();
  }

  loadCategories() {
    // Solo necesitamos categorías de GASTO
    this.categoryService.categories$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => {
        const expenses = cats.filter(c => c.type === TransactionType.GASTO);
        this.categories.set(expenses);
      });
  }

  loadBudgets() {
    this.isLoading.set(true);
    const date = this.currentDate();
    const month = date.getMonth() + 1; // API espera 1-12
    const year = date.getFullYear();

    this.budgetService.getBudgets(month, year).subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- ACTIONS CRUD ---

  // 1. ABRIR PARA CREAR
  openCreateModal() {
    this.editingId.set(null); // Modo Crear
    this.budgetForm.reset();
    this.budgetForm.get('categoryId')?.enable(); // Aseguramos que el select funcione
    this.isModalOpen.set(true);
  }

  // 2. ABRIR PARA EDITAR (Faltaba este método)
  openEditModal(budget: BudgetResponse) {
    this.editingId.set(budget.id);

    // Buscamos el ID de la categoría basado en el nombre (si el backend no manda ID directo en el response)
    const matchingCategory = this.categories().find(c => c.name === budget.categoryName);

    this.budgetForm.patchValue({
      limitAmount: budget.limitAmount,
      categoryId: matchingCategory ? matchingCategory.id : null
    });

    // UX: Bloqueamos cambiar categoría al editar, mejor borrar y crear de nuevo si te equivocaste de rubro
    this.budgetForm.get('categoryId')?.disable();

    this.isModalOpen.set(true);
  }

  // 3. GUARDAR (CREATE / UPDATE)
  onSubmit() {
    if (this.budgetForm.invalid) return;

    this.isSubmitting.set(true);

    // Usamos getRawValue() para incluir categoryId aunque esté disabled
    const formVal = this.budgetForm.getRawValue();
    const date = this.currentDate();

    const request: BudgetRequest = {
      categoryId: formVal.categoryId!,
      limitAmount: formVal.limitAmount!,
      month: date.getMonth() + 1,
      year: date.getFullYear()
    };

    if (this.editingId()) {
      // UPDATE
      this.budgetService.updateBudget(this.editingId()!, request).subscribe({
        next: (updated) => {
          // Actualizamos la lista local
          this.budgets.update(list => list.map(b => b.id === updated.id ? updated : b));
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting.set(false);
        }
      });
    } else {
      // CREATE
      this.budgetService.createBudget(request).subscribe({
        next: (newBudget) => {
          this.budgets.update(list => [...list, newBudget]);
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  // 4. ELIMINAR
  deleteBudget(id: number) {
    if(!confirm('¿Eliminar este presupuesto?')) return;

    this.budgetService.deleteBudget(id).subscribe(() => {
      this.budgets.update(list => list.filter(b => b.id !== id));
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
    this.editingId.set(null);
    this.budgetForm.reset();
  }

  // NAVEGACIÓN FECHAS
  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
    this.loadBudgets();
  }
}
