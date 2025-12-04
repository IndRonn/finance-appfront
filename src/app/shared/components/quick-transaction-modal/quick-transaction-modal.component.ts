import { Component, inject, OnInit, signal, DestroyRef, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Components & Utils
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AutoFocusDirective } from '@shared/directives/auto-focus.directive';
import { FilterPipe } from '@shared/pipes/filter.pipe';
import { DateUtils } from '@core/utils/date.utils';
import { ChipsInputComponent } from '@shared/components/chips-input/chips-input.component';

// Services
import { TransactionService } from '@features/transactions/services/transaction.service';
import { AccountService } from '@features/accounts/services/account.service';
import { CategoryStateService } from '@core/services/category-state.service';
import { ModalStateService } from '@core/services/modal-state.service';

// Models
import { TransactionType } from '@core/models/enums.model';
import { CategoryResponse } from '@core/models/category.model';
import { Account } from '@core/models/account.model';
import { Transaction, CreateTransactionRequest } from '@core/models/transaction.model';

@Component({
  selector: 'app-quick-transaction-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ReactiveFormsModule,
    AutoFocusDirective,
    FilterPipe,
    ChipsInputComponent
  ],
  templateUrl: './quick-transaction-modal.component.html',
  styleUrls: ['./quick-transaction-modal.component.scss']
})
export class QuickTransactionModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private transactionService = inject(TransactionService);
  private categoryStateService = inject(CategoryStateService);
  private accountService = inject(AccountService);
  public modalState = inject(ModalStateService);

  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>(); // Nuevo output para avisar al padre

  isSubmitting = signal(false);

  // Datos
  accounts = signal<Account[]>([]);
  categories = signal<CategoryResponse[]>([]);
  transactionTypes = Object.values(TransactionType);
  public TransactionType = TransactionType;

  currentType = signal<TransactionType>(TransactionType.GASTO);
  sourceAccountCurrency = signal<string>('PEN');

  transactionForm = this.fb.group({
    type: [TransactionType.GASTO, [Validators.required]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(200)]],
    transactionDate: [DateUtils.getCurrentLocalISOString(), [Validators.required]],
    accountId: [null as number | null, [Validators.required]],
    categoryId: [null as number | null],
    destinationAccountId: [null as number | null],
    exchangeRate: [1],
    tagIds: [[] as number[]] // Array de IDs para las etiquetas
  });

  constructor() {
    effect(() => {
      const txToEdit = this.modalState.editingTransaction();

      if (txToEdit) {
        this.loadTransactionData(txToEdit);
      } else {
        // Solo reseteamos si estamos abriendo (isOpen true) y NO hay edición
        if (this.isOpen && !txToEdit) {
          this.resetForm();
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadInitialData();
    this.setupFormLogic();
  }

  loadInitialData() {
    this.categoryStateService.categories$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(categories => {
      this.categories.set(categories);
    });
    this.accountService.getMyAccounts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(accounts => {
      this.accounts.set(accounts);
      // Preseleccionar cuenta por defecto solo si es nuevo
      if (!this.modalState.editingTransaction() && accounts.length > 0) {
        this.transactionForm.get('accountId')?.setValue(accounts[0].id);
        this.sourceAccountCurrency.set(accounts[0].currency);
      }
    });
  }

  loadTransactionData(tx: Transaction) {
    // 1. Configurar tipo y validadores
    this.currentType.set(tx.type);
    this.updateConditionalValidators(tx.type);

    // 2. Extraer IDs de las etiquetas (El modelo tiene objetos Tag completas)
    const tagIds = tx.tags ? tx.tags.map(t => t.id) : [];

    // 3. Parchear valores al formulario
    this.transactionForm.patchValue({
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      transactionDate: DateUtils.toLocalISOString(tx.transactionDate),
      accountId: tx.accountId,
      categoryId: tx.categoryId || null,
      destinationAccountId: tx.destinationAccountId || null,
      exchangeRate: tx.exchangeRate || 1,
      tagIds: tagIds // ✅ CORREGIDO: Mapeo de tags
    });

    // 4. Actualizar moneda visual
    const acc = this.accounts().find(a => a.id === tx.accountId);
    if(acc) this.sourceAccountCurrency.set(acc.currency);
  }

  resetForm() {
    // Evitar reseteo si el form ya está limpio
    if (this.transactionForm.pristine && !this.transactionForm.get('amount')?.value) return;

    this.transactionForm.reset({
      type: TransactionType.GASTO,
      transactionDate: DateUtils.getCurrentLocalISOString(),
      amount: null,
      description: '',
      exchangeRate: 1,
      tagIds: [] // ✅ IMPORTANTE: Limpiar tags
    });

    // Restaurar defaults
    if (this.accounts().length > 0) {
      this.transactionForm.get('accountId')?.setValue(this.accounts()[0].id);
      this.sourceAccountCurrency.set(this.accounts()[0].currency);
    }

    this.currentType.set(TransactionType.GASTO);
    this.updateConditionalValidators(TransactionType.GASTO);
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
    const { categoryId, destinationAccountId } = this.transactionForm.controls;

    categoryId.clearValidators();
    destinationAccountId.clearValidators();

    if (type === TransactionType.GASTO || type === TransactionType.INGRESO) {
      categoryId.setValidators([Validators.required]);
    } else if (type === TransactionType.TRANSFERENCIA) {
      destinationAccountId.setValidators([Validators.required]);
    }

    categoryId.updateValueAndValidity();
    destinationAccountId.updateValueAndValidity();
  }

  onSubmit() {
    if (this.transactionForm.invalid || this.isSubmitting()) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.transactionForm.value;

    const request: CreateTransactionRequest = {
      type: formValue.type!,
      amount: formValue.amount!,
      accountId: formValue.accountId!,
      transactionDate: formValue.transactionDate!,
      description: formValue.description || undefined,
      categoryId: formValue.categoryId || undefined,
      destinationAccountId: formValue.destinationAccountId || undefined,
      exchangeRate: formValue.exchangeRate || undefined,
      tagIds: formValue.tagIds || [] // ✅ CORREGIDO: Enviar tags al backend
    };

    const editingTx = this.modalState.editingTransaction();

    if (editingTx) {
      this.transactionService.updateTransaction(editingTx.id, request).subscribe({
        next: () => this.handleSuccess('Movimiento actualizado'),
        error: (err) => this.handleError(err)
      });
    } else {
      this.transactionService.createTransaction(request).subscribe({
        next: () => this.handleSuccess('Movimiento registrado'),
        error: (err) => this.handleError(err)
      });
    }
  }

  handleSuccess(msg: string) {
    // console.log(msg); // Opcional: mostrar toast
    this.accountService.notifyRefresh(); // Actualizar saldos globales
    this.isSubmitting.set(false);
    this.saved.emit(); // Avisar al componente padre
    this.closeModal();
  }

  handleError(err: any) {
    console.error(err);
    this.isSubmitting.set(false);
  }

  getAccountDisplayLabel(account: Account): string {
    const symbol = account.currency === 'PEN' ? 'S/' : '$';
    // Lógica visual para distinguir Débito de Crédito en el select
    if (account.type === 'CREDITO') {
      const limit = Number(account.creditLimit) || 0;
      const debt = Number(account.initialBalance) || 0; // En TC, saldo suele ser deuda
      const available = Math.max(0, limit - debt);
      return `${account.name} — Disp: ${symbol}${available.toFixed(2)}`;
    } else {
      return `${account.name} — Saldo: ${symbol}${account.initialBalance.toFixed(2)}`;
    }
  }

  closeModal() {
    this.close.emit();
    // Esperar a la animación de cierre antes de limpiar el estado global
    setTimeout(() => {
      this.modalState.closeTransactionModal();
      this.resetForm(); // Limpieza final por seguridad
    }, 300);
  }
}
