import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillService } from './services/bill.service';
import { AccountService } from '@features/accounts/services/account.service'; // Para pagar
import { CategoryStateService } from '@core/services/category-state.service';
import { BillResponse, BillRequest } from '@core/models/bill.model';
import { Account } from '@core/models/account.model';
import { CategoryResponse } from '@core/models/category.model';
import { Currency } from '@core/models/enums.model';

import { BillCardComponent } from './components/bill-card/bill-card.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AutoFocusDirective } from '@shared/directives/auto-focus.directive';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, BillCardComponent, ModalComponent, ReactiveFormsModule, AutoFocusDirective],
  templateUrl: './bills.component.html',
  styleUrls: ['./bills.component.scss']
})
export class BillsComponent implements OnInit {
  private billService = inject(BillService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryStateService);
  private fb = inject(FormBuilder);

  bills = signal<BillResponse[]>([]);
  accounts = signal<Account[]>([]);
  categories = signal<CategoryResponse[]>([]);
  isLoading = signal(true);

  // Modales
  isFormModalOpen = signal(false);
  isPayModalOpen = signal(false);
  isSubmitting = signal(false);

  // Estado Temporal
  editingId = signal<number | null>(null);
  payingBillId = signal<number | null>(null); // ID del recibo que estamos pagando

  // Formulario Creación/Edición
  billForm = this.fb.group({
    name: ['', Validators.required],
    company: [''],
    serviceCode: [''],
    categoryId: [null as number | null, Validators.required],
    currency: [Currency.PEN, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.1)]],
    dueDate: ['', Validators.required]
  });

  // Formulario Pago
  payForm = this.fb.group({
    sourceAccountId: [null as number | null, Validators.required]
  });

  eCurrency = Object.values(Currency);

  ngOnInit() {
    this.loadBills();
    // Precargamos data auxiliar
    this.categoryService.categories$.subscribe(c => this.categories.set(c.filter(x => x.type === 'GASTO')));
    this.accountService.getMyAccounts().subscribe(a => this.accounts.set(a.filter(x => x.type !== 'CREDITO'))); // Solo paga con débito
  }

  loadBills() {
    this.isLoading.set(true);
    this.billService.getBills().subscribe({
      next: (data) => {
        this.bills.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- ACTIONS ---

  openCreate() {
    this.editingId.set(null);
    this.billForm.reset({ currency: Currency.PEN });
    this.isFormModalOpen.set(true);
  }

  openEdit(bill: BillResponse) {
    this.editingId.set(bill.id);
    this.billForm.patchValue({
      name: bill.name,
      company: bill.company,
      serviceCode: bill.serviceCode,
      categoryId: bill.categoryId,
      currency: bill.currency,
      amount: bill.amount,
      dueDate: bill.dueDate
    });
    this.isFormModalOpen.set(true);
  }

  // SMART CLONING 🧠
  openClone(bill: BillResponse) {
    this.editingId.set(null); // Es un nuevo registro
    this.billForm.reset({
      name: bill.name,       // Mismo nombre
      company: bill.company, // Misma empresa
      serviceCode: bill.serviceCode, // Mismo código
      categoryId: bill.categoryId,   // Misma categoría
      currency: bill.currency,
      amount: null,  // LIMPIO: El usuario pone el nuevo monto
      dueDate: ''    // LIMPIO: El usuario pone la nueva fecha
    });
    this.isFormModalOpen.set(true);
  }

  openPay(bill: BillResponse) {
    this.payingBillId.set(bill.id);
    this.payForm.reset();
    if (this.accounts().length > 0) {
      this.payForm.patchValue({ sourceAccountId: this.accounts()[0].id });
    }
    this.isPayModalOpen.set(true);
  }

  // --- SUBMITS ---

  onSubmitBill() {
    if (this.billForm.invalid) return;
    this.isSubmitting.set(true);
    const request = this.billForm.value as BillRequest;

    const op$ = this.editingId()
      ? this.billService.updateBill(this.editingId()!, request)
      : this.billService.createBill(request);

    op$.subscribe({
      next: () => {
        this.loadBills();
        this.isFormModalOpen.set(false);
        this.isSubmitting.set(false);
      },
      error: (e) => { console.error(e); this.isSubmitting.set(false); }
    });
  }

  onSubmitPay() {
    if (this.payForm.invalid) return;
    this.isSubmitting.set(true);

    const accountId = this.payForm.value.sourceAccountId!;

    this.billService.payBill(this.payingBillId()!, accountId).subscribe({
      next: () => {
        this.loadBills(); // Refrescar estado del recibo
        this.accountService.notifyRefresh(); // ACTUALIZAR SALDO GLOBAL (Sidebar)
        this.isPayModalOpen.set(false);
        this.isSubmitting.set(false);
      },
      error: (e) => { console.error(e); this.isSubmitting.set(false); }
    });
  }

  deleteBill(id: number) {
    if(!confirm('¿Eliminar recibo?')) return;
    this.billService.deleteBill(id).subscribe(() => this.loadBills());
  }
}
