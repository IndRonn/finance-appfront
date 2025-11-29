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
import { CreditCardComponent } from './components/credit-card/credit-card.component'; // <--- Importamos la Joya
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

  // Estado Principal
  accounts = signal<Account[]>([]);
  isLoading = signal(true);

  // --- FILTROS COMPUTADOS (La magia de la separación) ---
  // Se actualizan solos cuando 'accounts' cambia
  debitAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.DEBITO || a.type === AccountType.EFECTIVO)
  );

  creditAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.CREDITO)
  );

  // Estado del Modal
  isModalOpen = signal(false);
  isSubmitting = signal(false);

  // Formulario (Igual que antes, con la lógica de fechas y límites)
  accountForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    bankName: [''],
    type: [AccountType.DEBITO, [Validators.required]],
    currency: [Currency.PEN, [Validators.required]],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
    closingDate: [null as number | null],
    paymentDate: [null as number | null],
    creditLimit: [0]
  });

  eAccountType = Object.values(AccountType);
  eCurrency = Object.values(Currency);
  daysOfMonth = Array.from({length: 31}, (_, i) => i + 1);

  ngOnInit() {
    this.loadAccounts();
    this.setupTypeChanges();
  }

  // ... (setupTypeChanges, updateValidators, loadAccounts, openCreateModal, onSubmit se mantienen IGUAL que en el paso anterior)
  // Solo asegúrate de copiar esas funciones que ya tenías.

  // Helper para el HTML
  get isCreditCard(): boolean {
    return this.accountForm.get('type')?.value === AccountType.CREDITO;
  }

  // Métodos copiados para referencia rápida (NO OLVIDAR INCLUIRLOS)
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
      limitControl?.setValidators([Validators.required, Validators.min(1)]);
      closingControl?.setValidators([Validators.required]);
      paymentControl?.setValidators([Validators.required]);
    } else {
      limitControl?.clearValidators(); limitControl?.setValue(0);
      closingControl?.clearValidators(); closingControl?.setValue(null);
      paymentControl?.clearValidators(); paymentControl?.setValue(null);
    }
    limitControl?.updateValueAndValidity();
    closingControl?.updateValueAndValidity();
    paymentControl?.updateValueAndValidity();
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

  openCreateModal() {
    this.accountForm.reset({
      type: AccountType.DEBITO,
      currency: Currency.PEN,
      initialBalance: 0
    });
    this.isModalOpen.set(true);
  }

  onSubmit() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const request = this.accountForm.value as CreateAccountRequest;

    this.accountService.createAccount(request).subscribe({
      next: (newAccount) => {
        this.accounts.update(list => [...list, newAccount]);
        this.isModalOpen.set(false);
        this.isSubmitting.set(false);
      },
      error: () => this.isSubmitting.set(false)
    });
  }
}
