import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services & Models
import { BudgetService } from './services/budget.service';
import { CategoryStateService } from '@core/services/category-state.service';
import { AccountService } from '@features/accounts/services/account.service'; // <--- NUEVO
import { BudgetResponse, BudgetRequest } from '@core/models/budget.model';
import { CategoryResponse } from '@core/models/category.model';
import { TransactionType } from '@core/models/enums.model';

// Components
import { BudgetProgressComponent } from './components/budget-progress/budget-progress.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AutoFocusDirective } from '@shared/directives/auto-focus.directive';
import {UiStateService} from "@core/services/ui-state.service";


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
  private accountService = inject(AccountService); // <--- Inyectar
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private uiState = inject(UiStateService);

  budgets = signal<BudgetResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  isLoading = signal(true);
  currentDate = signal(new Date());

  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingId = signal<number | null>(null);

  budgetForm = this.fb.group({
    categoryId: [null as number | null, [Validators.required]],
    limitAmount: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit() {
    this.uiState.setPageTitle('Presupuestos', 'Control de Límites');
    this.loadBudgets();
    this.loadCategories();
    this.setupAutoRefresh(); // <--- Activar escucha
  }

  // --- ESCUCHA DE EVENTOS GLOBALES ---
  private setupAutoRefresh() {
    // Si ocurre un gasto, el AccountService avisa.
    // Como un gasto afecta el presupuesto, recargamos aquí también.
    this.accountService.refreshNeeded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadBudgets();
      });
  }

  loadCategories() {
    this.categoryService.categories$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cats => {
        const expenses = cats.filter(c => c.type === TransactionType.GASTO);
        this.categories.set(expenses);
      });
  }

  loadBudgets() {
    // Opcional: No poner isLoading(true) si es refresh silencioso
    // this.isLoading.set(true);
    const date = this.currentDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    this.budgetService.getBudgets(month, year).subscribe({
      next: (data) => {
        this.budgets.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // ... (El resto de métodos openCreateModal, openEditModal, onSubmit, deleteBudget, closeModal, changeMonth se mantienen IGUAL que en tu código anterior) ...
  // Solo asegúrate de copiarlos aquí abajo.

  openCreateModal() {
    this.editingId.set(null);
    this.budgetForm.reset();
    this.budgetForm.get('categoryId')?.enable();
    this.isModalOpen.set(true);
  }

  openEditModal(budget: BudgetResponse) {
    this.editingId.set(budget.id);
    const matchingCategory = this.categories().find(c => c.name === budget.categoryName);
    this.budgetForm.patchValue({
      limitAmount: budget.limitAmount,
      categoryId: matchingCategory ? matchingCategory.id : null
    });
    this.budgetForm.get('categoryId')?.disable();
    this.isModalOpen.set(true);
  }

  onSubmit() {
    if (this.budgetForm.invalid) return;
    this.isSubmitting.set(true);
    const formVal = this.budgetForm.getRawValue();
    const date = this.currentDate();

    const request: BudgetRequest = {
      categoryId: formVal.categoryId!,
      limitAmount: formVal.limitAmount!,
      month: date.getMonth() + 1,
      year: date.getFullYear()
    };

    if (this.editingId()) {
      this.budgetService.updateBudget(this.editingId()!, request).subscribe({
        next: (updated) => {
          this.budgets.update(list => list.map(b => b.id === updated.id ? updated : b));
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.budgetService.createBudget(request).subscribe({
        next: (newBudget) => {
          this.budgets.update(list => [...list, newBudget]);
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  deleteBudget(id: number) {
    if(!confirm('¿Eliminar este presupuesto?')) return;
    this.budgetService.deleteBudget(id).subscribe({
      next: () => this.budgets.update(list => list.filter(b => b.id !== id)),
      error: (e) => console.error(e)
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
    this.editingId.set(null);
    this.budgetForm.reset();
  }

  changeMonth(delta: number) {
    const newDate = new Date(this.currentDate());
    newDate.setMonth(newDate.getMonth() + delta);
    this.currentDate.set(newDate);
    this.loadBudgets();
  }
}
