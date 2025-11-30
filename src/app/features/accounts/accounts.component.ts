import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

// Services & Models
import { AccountService } from './services/account.service';
import { Account, CreateAccountRequest } from '@core/models/account.model';
import { AccountType, Currency } from '@core/models/enums.model';

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

  // --- ESTADO PRINCIPAL ---
  accounts = signal<Account[]>([]);
  isLoading = signal(true);

  // Filtros Computados (Separan las listas visualmente)
  debitAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.DEBITO || a.type === AccountType.EFECTIVO)
  );

  creditAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.CREDITO)
  );

  // --- ESTADO DEL MODAL ---
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingAccountId = signal<number | null>(null); // null = Modo Crear, number = Modo Editar

  // --- FORMULARIO REACTIVO ---
  accountForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    bankName: [''],
    type: [AccountType.DEBITO, [Validators.required]],
    currency: [Currency.PEN, [Validators.required]],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
    // Campos opcionales (Solo Crédito)
    closingDate: [null as number | null],
    paymentDate: [null as number | null],
    creditLimit: [0]
  });

  // Helpers para el HTML
  eAccountType = Object.values(AccountType);
  eCurrency = Object.values(Currency);
  daysOfMonth = Array.from({length: 31}, (_, i) => i + 1);

  ngOnInit() {
    this.loadAccounts();
    this.setupTypeChanges(); // Activa la escucha de cambios de tipo
  }

  loadAccounts() {
    this.isLoading.set(true);
    this.accountService.getMyAccounts().subscribe({
      next: (data) => {
        this.accounts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- LÓGICA DE FORMULARIO DINÁMICO ---
  private setupTypeChanges() {
    this.accountForm.get('type')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => this.updateValidators(type as AccountType));
  }

  private updateValidators(type: AccountType) {
    const limitControl = this.accountForm.get('creditLimit');
    const closingControl = this.accountForm.get('closingDate');
    const paymentControl = this.accountForm.get('paymentDate');

    if (type === AccountType.CREDITO) {
      // Activar validaciones para tarjeta de crédito
      limitControl?.setValidators([Validators.required, Validators.min(1)]);
      closingControl?.setValidators([Validators.required]);
      paymentControl?.setValidators([Validators.required]);
    } else {
      // Limpiar validaciones para débito/efectivo
      limitControl?.clearValidators();
      limitControl?.setValue(0);

      closingControl?.clearValidators();
      closingControl?.setValue(null);

      paymentControl?.clearValidators();
      paymentControl?.setValue(null);
    }

    // Refrescar estado de los inputs
    limitControl?.updateValueAndValidity();
    closingControl?.updateValueAndValidity();
    paymentControl?.updateValueAndValidity();
  }

  // --- ACCIONES DEL USUARIO (CRUD) ---

  // 1. ABRIR PARA CREAR
  openCreateModal() {
    this.editingAccountId.set(null); // Modo Crear
    this.accountForm.reset({
      type: AccountType.DEBITO,
      currency: Currency.PEN,
      initialBalance: 0,
      creditLimit: 0
    });
    // Forzamos validación inicial correcta (limpia campos de crédito)
    this.updateValidators(AccountType.DEBITO);
    this.isModalOpen.set(true);
  }

  // 2. ABRIR PARA EDITAR
  openEditModal(account: Account) {
    this.editingAccountId.set(account.id); // Modo Editar

    this.accountForm.patchValue({
      name: account.name,
      bankName: account.bankName,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
      creditLimit: account.creditLimit || 0,
      closingDate: account.closingDate || null,
      paymentDate: account.paymentDate || null
    });

    // Ajustamos validadores según el tipo que viene de la BD
    this.updateValidators(account.type);

    this.isModalOpen.set(true);
  }

  // 3. GUARDAR (CREATE / UPDATE)
  onSubmit() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched(); // Muestra errores en rojo
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.accountForm.value;
    const isCredit = formValue.type === AccountType.CREDITO;

    // CONSTRUCCIÓN SEGURA DEL REQUEST
    // Solo enviamos datos de crédito si el tipo es CRÉDITO.
    // Si es débito, enviamos undefined para que el backend reciba null o lo ignore.
    const request: CreateAccountRequest = {
      name: formValue.name!,
      bankName: formValue.bankName || undefined,
      type: formValue.type!,
      currency: formValue.currency!,
      initialBalance: formValue.initialBalance!,

      creditLimit: isCredit ? formValue.creditLimit! : undefined,
      closingDate: isCredit ? formValue.closingDate! : undefined,
      paymentDate: isCredit ? formValue.paymentDate! : undefined
    };

    const currentId = this.editingAccountId();

    if (currentId) {
      // --- ACTUALIZAR ---
      this.accountService.updateAccount(currentId, request).subscribe({
        next: (updatedAccount) => {
          // Actualizamos la lista localmente (sin recargar página)
          this.accounts.update(list =>
            list.map(acc => acc.id === currentId ? updatedAccount : acc)
          );
          this.closeModal();
        },
        error: (err) => {
          console.error('Error actualizando', err);
          this.isSubmitting.set(false);
        }
      });
    } else {
      // --- CREAR ---
      this.accountService.createAccount(request).subscribe({
        next: (newAccount) => {
          // Agregamos la nueva cuenta a la lista
          this.accounts.update(list => [...list, newAccount]);
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creando', err);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  // 4. ELIMINAR
  deleteAccount(id: number) {
    // Nota: El botón de la tarjeta ya hace una pre-confirmación visual ("seguro?").
    // Aquí ejecutamos el borrado real.

    this.accountService.deleteAccount(id).subscribe({
      next: () => {
        // Filtramos la lista para quitar el eliminado
        this.accounts.update(list => list.filter(a => a.id !== id));
      },
      error: (err) => console.error('Error eliminando', err)
    });
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.isSubmitting.set(false);
    this.editingAccountId.set(null);
  }

  // Helper para el HTML (ngIf)
  get isCreditCard(): boolean {
    return this.accountForm.get('type')?.value === AccountType.CREDITO;
  }
}
