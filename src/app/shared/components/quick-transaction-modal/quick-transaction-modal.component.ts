import { Component, inject, OnInit, signal, DestroyRef, Input, Output, EventEmitter } from '@angular/core'; // <--- Añadir Input, Output, EventEmitter
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AutoFocusDirective } from '@shared/directives/auto-focus.directive';
import { FilterPipe } from '@shared/pipes/filter.pipe'; // Asegúrate de importar el Pipe
import { TransactionService } from '@features/transactions/services/transaction.service';
import { AccountService } from '@features/accounts/services/account.service';
import { CategoryStateService } from '@core/services/category-state.service';

import { TransactionType } from '@core/models/enums.model';
import { CategoryResponse } from '@core/models/category.model';
import { Account } from '@core/models/account.model';

@Component({
  selector: 'app-quick-transaction-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule, AutoFocusDirective, FilterPipe],
  templateUrl: './quick-transaction-modal.component.html',
  styleUrls: ['./quick-transaction-modal.component.scss']
})
export class QuickTransactionModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private transactionService = inject(TransactionService);
  private categoryStateService = inject(CategoryStateService);
  private accountService = inject(AccountService);

  // --- CORRECCIÓN CLAVE AQUÍ ---
  // Reemplazamos la signal interna por Input/Output para control externo
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  isSubmitting = signal(false);

  // Datos
  accounts = signal<Account[]>([]);
  categories = signal<CategoryResponse[]>([]);
  transactionTypes = Object.values(TransactionType);
  public TransactionType = TransactionType; // Exponer al HTML

  currentType = signal<TransactionType>(TransactionType.GASTO);
  sourceAccountCurrency = signal<string>('PEN');

  transactionForm = this.fb.group({
    type: [TransactionType.GASTO, [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(200)]],
    transactionDate: [new Date().toISOString().substring(0, 16), [Validators.required]],
    accountId: [null as number | null, [Validators.required]],
    categoryId: [null as number | null],
    destinationAccountId: [null as number | null],
    exchangeRate: [1],
  });

  ngOnInit() {
    this.loadInitialData();
    this.setupFormLogic();
  }

  // ... (loadInitialData y setupFormLogic se mantienen IGUAL) ...
  loadInitialData() {
    this.categoryStateService.categories$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(categories => {
      this.categories.set(categories);
    });
    this.accountService.getMyAccounts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accounts => {
      this.accounts.set(accounts);
      if (accounts.length > 0) {
        this.transactionForm.get('accountId')?.setValue(accounts[0].id);
        this.sourceAccountCurrency.set(accounts[0].currency);
      }
    });
  }

  setupFormLogic() {
    const form = this.transactionForm;
    form.get('type')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(type => {
      this.currentType.set(type as TransactionType);
      this.updateConditionalValidators(type as TransactionType);
    });
    form.get('accountId')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accountId => {
      const selectedAccount = this.accounts().find(acc => acc.id === accountId);
      if (selectedAccount) this.sourceAccountCurrency.set(selectedAccount.currency);
    });
  }

  updateConditionalValidators(type: TransactionType) {
    const { categoryId, destinationAccountId, exchangeRate } = this.transactionForm.controls;
    [categoryId, destinationAccountId].forEach(c => c.clearValidators());
    [categoryId, destinationAccountId].forEach(c => c.setValue(null));
    exchangeRate.clearValidators(); exchangeRate.setValue(1);

    if (type === TransactionType.GASTO || type === TransactionType.INGRESO) {
      categoryId.setValidators([Validators.required]);
    } else if (type === TransactionType.TRANSFERENCIA) {
      destinationAccountId.setValidators([Validators.required]);
    }
    this.transactionForm.updateValueAndValidity();
  }

  onSubmit() {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const formValue = this.transactionForm.value;

    // Objeto seguro
    const request: any = {
      type: formValue.type!,
      amount: formValue.amount!,
      accountId: formValue.accountId!,
      transactionDate: formValue.transactionDate!,
      description: formValue.description || undefined,
      categoryId: formValue.categoryId || undefined,
      destinationAccountId: formValue.destinationAccountId || undefined,
      exchangeRate: formValue.exchangeRate || undefined,
    };

    this.transactionService.createTransaction(request).subscribe({
      next: (response) => {
        console.log('Transaction success', response);
        this.isSubmitting.set(false);
        this.closeModal(); // Cierra y limpia
        this.transactionForm.reset({
          type: TransactionType.GASTO,
          transactionDate: new Date().toISOString().substring(0, 16),
          amount: null
        });
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
      }
    });
  }

  closeModal() {
    // Emitimos el evento hacia el padre (Layout) para que actualice el servicio
    this.close.emit();
  }
}
