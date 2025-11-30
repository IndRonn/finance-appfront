import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from './services/category.service';
import { CategoryResponse, CategoryRequest, CategoryManagementType } from '@core/models/category.model';
import { TransactionType } from '@core/models/enums.model';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  categories = signal<CategoryResponse[]>([]);
  isLoading = signal(true);

  // Filtros Computados
  incomeCategories = computed(() => this.categories().filter(c => c.type === TransactionType.INGRESO));
  expenseCategories = computed(() => this.categories().filter(c => c.type === TransactionType.GASTO));

  // Modal State
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingId = signal<number | null>(null);

  // Formulario
  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    type: [TransactionType.GASTO, [Validators.required]],
    managementType: [CategoryManagementType.DIA_A_DIA, [Validators.required]]
  });

  // Enums para HTML
  eTypes = [TransactionType.GASTO, TransactionType.INGRESO];
  eManagement = Object.values(CategoryManagementType);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- CRUD ---
  openCreateModal() {
    this.editingId.set(null);
    this.categoryForm.reset({
      type: TransactionType.GASTO,
      managementType: CategoryManagementType.DIA_A_DIA
    });
    this.isModalOpen.set(true);
  }

  openEditModal(cat: CategoryResponse) {
    this.editingId.set(cat.id);
    this.categoryForm.patchValue({
      name: cat.name,
      type: cat.type,
      managementType: cat.managementType
    });
    this.isModalOpen.set(true);
  }

  onSubmit() {
    if (this.categoryForm.invalid) return;

    this.isSubmitting.set(true);
    const request = this.categoryForm.value as CategoryRequest;

    if (this.editingId()) {
      this.categoryService.update(this.editingId()!, request).subscribe({
        next: (updated) => {
          this.categories.update(list => list.map(c => c.id === updated.id ? updated : c));
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.categoryService.create(request).subscribe({
        next: (created) => {
          this.categories.update(list => [...list, created]);
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  deleteCategory(id: number, event: Event) {
    event.stopPropagation();
    if(!confirm('¿Eliminar categoría? Esto podría afectar historiales.')) return;

    this.categoryService.delete(id).subscribe(() => {
      this.categories.update(list => list.filter(c => c.id !== id));
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
  }
}
