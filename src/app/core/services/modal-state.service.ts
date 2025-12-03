import { Injectable, signal } from '@angular/core';
import { Transaction } from '@core/models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class ModalStateService {
  // Señal de visibilidad
  readonly isTransactionModalOpen = signal(false);

  // Señal de datos
  readonly editingTransaction = signal<Transaction | null>(null);

  openTransactionModal() {
    this.editingTransaction.set(null); // Limpiar datos previos
    this.isTransactionModalOpen.set(true); // <--- ESTO DEBE PONERSE EN TRUE
    console.log('📖 ModalState: Abriendo modal (CREAR)');
  }

  openEditTransaction(tx: Transaction) {
    this.editingTransaction.set(tx);
    this.isTransactionModalOpen.set(true); // <--- ESTO TAMBIÉN
    console.log('✏️ ModalState: Abriendo modal (EDITAR)', tx);
  }

  closeTransactionModal() {
    this.isTransactionModalOpen.set(false);
    this.editingTransaction.set(null);
  }
}
