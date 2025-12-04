import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; // <--- Importante
import { SavingsGoalService } from './services/savings-goal.service';
import { SavingsGoalResponse, SavingsGoalRequest } from '@core/models/savings-goal.model';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {UiStateService} from "@core/services/ui-state.service"; // <--- Reutilizamos

@Component({
  selector: 'app-savings',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './savings.component.html',
  styleUrls: ['./savings.component.scss']
})
export class SavingsComponent implements OnInit {
  private savingsService = inject(SavingsGoalService);
  private fb = inject(FormBuilder);
  private uiState = inject(UiStateService);

  goals = signal<SavingsGoalResponse[]>([]);
  isLoading = signal(true);

  // Estado del Modal y Formulario
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingId = signal<number | null>(null); // Si tiene ID, es edición

  goalForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    targetAmount: [0, [Validators.required, Validators.min(1)]],
    // initialAmount solo tiene sentido al crear, pero lo mantenemos en el form
    initialAmount: [0]
  });

  ngOnInit() {
    this.loadGoals();
    this.uiState.setPageTitle('Bóvedas', 'Metas de Ahorro');
  }

  loadGoals() {
    this.isLoading.set(true);
    this.savingsService.getAll().subscribe({
      next: (data) => {
        this.goals.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- ACCIONES DEL MODAL ---

  openCreateModal() {
    this.editingId.set(null); // Modo Crear
    this.goalForm.reset({ targetAmount: 0, initialAmount: 0 });
    this.isModalOpen.set(true);
  }

  openEditModal(goal: SavingsGoalResponse) {
    this.editingId.set(goal.id); // Modo Edición
    this.goalForm.patchValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      initialAmount: 0 // No editamos el monto inicial, eso es histórico
    });
    this.isModalOpen.set(true);
  }

  onSubmit() {
    if (this.goalForm.invalid) return;

    this.isSubmitting.set(true);
    const request = this.goalForm.value as SavingsGoalRequest;

    if (this.editingId()) {
      // ACTUALIZAR
      this.savingsService.update(this.editingId()!, request).subscribe({
        next: (updatedGoal) => {
          // Actualizamos la lista localmente
          this.goals.update(list => list.map(g => g.id === updatedGoal.id ? updatedGoal : g));
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      // CREAR
      this.savingsService.create(request).subscribe({
        next: (newGoal) => {
          this.goals.update(list => [...list, newGoal]);
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  deleteGoal(id: number, event: Event) {
    event.stopPropagation(); // Para no abrir el modal si el click fue en borrar
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;

    this.savingsService.delete(id).subscribe(() => {
      this.goals.update(list => list.filter(g => g.id !== id));
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
  }

  calculateWidth(percentage: number): number {
    return Math.min(percentage * 100, 100);
  }
}
