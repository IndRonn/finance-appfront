import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// Services & Models
import { AccountService } from './services/account.service';
import { Account, CreateAccountRequest } from '@core/models/account.model';
import { AccountType, Currency } from '@core/models/enums.model';
import { UiStateService } from '@core/services/ui-state.service';

// Components
import { AccountCardComponent } from './components/account-card/account-card.component';
import { CreditCardComponent } from './components/credit-card/credit-card.component';
import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AccountCardComponent,
    CreditCardComponent,
    ModalComponent
  ],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss']
})
export class AccountsComponent implements OnInit {
  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  public uiState = inject(UiStateService);

  // Estados
  accounts = signal<Account[]>([]);
  isLoading = signal(true);

  debitAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.DEBITO || a.type === AccountType.EFECTIVO)
  );

  creditAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.CREDITO)
  );

  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingAccountId = signal<number | null>(null);

  // --- FORMULARIO ACTUALIZADO ---
  accountForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    bankName: [''],
    type: [AccountType.DEBITO, [Validators.required]],
    currency: [Currency.PEN, [Validators.required]],

    // Saldo Genérico (Débito/Efectivo)
    initialBalance: [0, [Validators.min(0)]],

    // Campos TC
    closingDate: [null as number | null],
    paymentDate: [null as number | null],
    creditLimit: [0],

    // 👇 NUEVOS CAMPOS (Desglose TC)
    previousBalance: [0, [Validators.min(0)]], // Facturado
    currentBalance: [0, [Validators.min(0)]]   // Consumo actual
  });

  eAccountType = Object.values(AccountType);
  eCurrency = Object.values(Currency);
  daysOfMonth = Array.from({length: 31}, (_, i) => i + 1);

  ngOnInit() {
    this.uiState.setPageTitle('Billetera', 'Activos y Pasivos');
    this.loadAccounts();
    this.setupTypeChanges();
    this.setupAutoRefresh();
  }

  private setupAutoRefresh() {
    this.accountService.refreshNeeded$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadAccounts());
  }

  loadAccounts() {
    this.accountService.getMyAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  private setupTypeChanges() {
    this.accountForm.get('type')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => this.updateValidators(type as AccountType));
  }

  // --- VALIDACIÓN DINÁMICA ---
  private updateValidators(type: AccountType) {
    const limitControl = this.accountForm.get('creditLimit');
    const closingControl = this.accountForm.get('closingDate');
    const paymentControl = this.accountForm.get('paymentDate');
    const initialControl = this.accountForm.get('initialBalance');
    const prevControl = this.accountForm.get('previousBalance');
    const currControl = this.accountForm.get('currentBalance');

    if (type === AccountType.CREDITO) {
      // CASO CRÉDITO:
      // 1. Requiere configuración de tarjeta (Límite y Fechas)
      limitControl?.setValidators([Validators.required, Validators.min(1)]);
      closingControl?.setValidators([Validators.required]);
      paymentControl?.setValidators([Validators.required]);

      // 2. El saldo inicial genérico ya no es el foco principal, usamos el desglose
      // Quitamos required a initialBalance porque usaremos previous/current
      initialControl?.clearValidators();

    } else {
      // CASO DÉBITO/EFECTIVO:
      // 1. Limpiamos campos de tarjeta
      limitControl?.clearValidators(); limitControl?.setValue(0);
      closingControl?.clearValidators(); closingControl?.setValue(null);
      paymentControl?.clearValidators(); paymentControl?.setValue(null);

      // 2. Limpiamos desglose
      prevControl?.setValue(0);
      currControl?.setValue(0);

      // 3. Saldo inicial es obligatorio
      initialControl?.setValidators([Validators.required, Validators.min(0)]);
    }

    // Refrescar estados
    limitControl?.updateValueAndValidity();
    closingControl?.updateValueAndValidity();
    paymentControl?.updateValueAndValidity();
    initialControl?.updateValueAndValidity();
  }

  // --- ACTIONS ---

  openCreateModal() {
    this.editingAccountId.set(null);
    this.accountForm.reset({
      type: AccountType.DEBITO,
      currency: Currency.PEN,
      initialBalance: 0,
      creditLimit: 0,
      previousBalance: 0,
      currentBalance: 0
    });
    this.updateValidators(AccountType.DEBITO);
    this.isModalOpen.set(true);
  }

  openEditModal(account: Account) {
    this.editingAccountId.set(account.id);

    this.accountForm.patchValue({
      name: account.name,
      bankName: account.bankName,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance, // En edición, mostramos el total
      creditLimit: account.creditLimit || 0,
      closingDate: account.closingDate || null,
      paymentDate: account.paymentDate || null,
      // En edición no solemos desglosar lo histórico, se asume 0 para no alterar si no se toca
      previousBalance: 0,
      currentBalance: 0
    });

    this.updateValidators(account.type);
    this.isModalOpen.set(true);
  }

  onSubmit() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.accountForm.value;
    const isCredit = formVal.type === AccountType.CREDITO;

    // CONSTRUCCIÓN DEL REQUEST
    const request: CreateAccountRequest = {
      name: formVal.name!,
      bankName: formVal.bankName || undefined,
      type: formVal.type!,
      currency: formVal.currency!,

      // Si es Crédito, initialBalance es 0 (el backend suma el desglose)
      // O si es edición, se manda el valor calculado.
      // Para simplificar: Si es creación y es crédito, mandamos 0 en initial y usamos el desglose.
      initialBalance: isCredit ? 0 : (formVal.initialBalance || 0),

      creditLimit: isCredit ? formVal.creditLimit! : undefined,
      closingDate: isCredit ? formVal.closingDate! : undefined,
      paymentDate: isCredit ? formVal.paymentDate! : undefined,

      // Enviamos el desglose solo si es Crédito
      previousBalance: isCredit ? (formVal.previousBalance || 0) : undefined,
      currentBalance: isCredit ? (formVal.currentBalance || 0) : undefined
    };

    const currentId = this.editingAccountId();

    if (currentId) {
      this.accountService.updateAccount(currentId, request).subscribe({
        next: (updatedAccount) => {
          this.accounts.update(list => list.map(acc => acc.id === currentId ? updatedAccount : acc));
          this.closeModal();
        },
        error: (err) => { console.error(err); this.isSubmitting.set(false); }
      });
    } else {
      this.accountService.createAccount(request).subscribe({
        next: (newAccount) => {
          this.accounts.update(list => [...list, newAccount]);
          this.closeModal();
        },
        error: (err) => { console.error(err); this.isSubmitting.set(false); }
      });
    }
  }

  deleteAccount(id: number) {
    this.accountService.deleteAccount(id).subscribe({
      next: () => this.accounts.update(list => list.filter(a => a.id !== id)),
      error: (err) => console.error(err)
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
    this.editingAccountId.set(null);
  }

  get isCreditCard(): boolean {
    return this.accountForm.get('type')?.value === AccountType.CREDITO;
  }
}
