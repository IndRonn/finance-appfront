import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services & Models
import { ExternalDebtService } from './services/external-debt.service';
import { AccountService } from '@features/accounts/services/account.service';
import { CategoryStateService } from '@core/services/category-state.service'; // Usamos el State para el select
import { DebtResponse, DebtRequest, DebtPaymentRequest } from '@core/models/debt.model';
import { Account } from '@core/models/account.model';
import { CategoryResponse } from '@core/models/category.model';
import { TransactionType } from '@core/models/enums.model';

// Components
import { DebtCardComponent } from './components/debt-card/debt-card.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AutoFocusDirective } from '@shared/directives/auto-focus.directive';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule, DebtCardComponent, ModalComponent, ReactiveFormsModule, AutoFocusDirective],
  templateUrl: './debts.component.html',
  styleUrls: ['./debts.component.scss']
})
export class DebtsComponent implements OnInit {
  private debtService = inject(ExternalDebtService);
  private accountService = inject(AccountService);

  // CORRECCIÓN: Renombramos la propiedad para que coincida con su uso
  private categoryStateService = inject(CategoryStateService);

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // DATA
  debts = signal<DebtResponse[]>([]);
  accounts = signal<Account[]>([]);
  categories = signal<CategoryResponse[]>([]);

  isLoading = signal(true);

  // MODAL STATE
  isModalOpen = signal(false);
  modalMode = signal<'CREATE' | 'EDIT' | 'PAY'>('CREATE');
  selectedDebtId = signal<number | null>(null);
  isSubmitting = signal(false);

  // FORMULARIO 1: CREAR/EDITAR
  debtForm = this.fb.group({
    name: ['', [Validators.required]],
    creditor: ['', [Validators.required]],
    totalAmount: [0, [Validators.required, Validators.min(1)]],
    currentBalance: [0, [Validators.required, Validators.min(0)]]
  });

  // FORMULARIO 2: PAGAR
  paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    sourceAccountId: [null as number | null, [Validators.required]],
    categoryId: [null as number | null, [Validators.required]]
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    this.debtService.getMyDebts().subscribe({
      next: (data) => {
        this.debts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    // Cargar cuentas (Débito/Efectivo) para pagar
    this.accountService.getMyAccounts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accs => {
      this.accounts.set(accs.filter(a => a.type === 'DEBITO' || a.type === 'EFECTIVO'));
    });

    // Cargar categorías (Solo Gastos) usando el servicio de estado correctamente
    this.categoryStateService.categories$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(cats => {
      this.categories.set(cats.filter(c => c.type === TransactionType.GASTO));
    });
  }

  // --- ACTIONS ---

  openCreate() {
    this.modalMode.set('CREATE');
    this.debtForm.reset({ totalAmount: 0, currentBalance: 0 }); // Reset limpio
    this.isModalOpen.set(true);
  }

  openEdit(debt: DebtResponse) {
    this.modalMode.set('EDIT');
    this.selectedDebtId.set(debt.id);
    this.debtForm.patchValue({
      name: debt.name,
      creditor: debt.creditor,
      totalAmount: debt.totalAmount,
      currentBalance: debt.currentBalance
    });
    this.isModalOpen.set(true);
  }

  openAmortize(debt: DebtResponse) {
    this.modalMode.set('PAY');
    this.selectedDebtId.set(debt.id);

    this.paymentForm.reset();
    // Sugerimos pagar todo lo pendiente
    this.paymentForm.patchValue({ amount: debt.currentBalance });

    // Seleccionar cuenta por defecto si existe
    if (this.accounts().length > 0) {
      this.paymentForm.patchValue({ sourceAccountId: this.accounts()[0].id });
    }

    this.isModalOpen.set(true);
  }

  // --- SUBMITS ---

  onSubmitDebt() {
    if (this.debtForm.invalid) return;
    this.isSubmitting.set(true);

    const request = this.debtForm.value as DebtRequest;

    if (this.modalMode() === 'EDIT') {
      this.debtService.updateDebt(this.selectedDebtId()!, request).subscribe({
        next: (updated) => {
          this.debts.update(list => list.map(d => d.id === updated.id ? updated : d));
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      // CREATE
      // Si no definió saldo actual, asumimos que es igual al total (deuda nueva)
      if (request.currentBalance === undefined || request.currentBalance === null) {
        request.currentBalance = request.totalAmount;
      }

      this.debtService.createDebt(request).subscribe({
        next: (created) => {
          this.debts.update(list => [...list, created]);
          this.closeModal();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  onSubmitPayment() {
    if (this.paymentForm.invalid) return;
    this.isSubmitting.set(true);

    const request = this.paymentForm.value as DebtPaymentRequest;

    this.debtService.amortizeDebt(this.selectedDebtId()!, request).subscribe({
      next: () => {
        this.loadData(); // Recargamos para ver la barra bajar
        this.accountService.notifyRefresh(); // Avisamos a cuentas que bajó el saldo
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      }
    });
  }

  deleteDebt(id: number) {
    if(!confirm('¿Eliminar registro de deuda?')) return;

    this.debtService.deleteDebt(id).subscribe(() => {
      this.debts.update(list => list.filter(d => d.id !== id));
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
    this.selectedDebtId.set(null);
  }

  get modalTitle(): string {
    if (this.modalMode() === 'PAY') return 'Amortizar Deuda';
    return this.modalMode() === 'EDIT' ? 'Editar Deuda' : 'Nueva Deuda';
  }
}
