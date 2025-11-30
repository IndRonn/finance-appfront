import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalStateService {
  // Signal para controlar la visibilidad del QuickTransactionModal
  readonly isTransactionModalOpen = signal(false);

  openTransactionModal() {
    this.isTransactionModalOpen.set(true);
  }

  closeTransactionModal() {
    this.isTransactionModalOpen.set(false);
  }
}
