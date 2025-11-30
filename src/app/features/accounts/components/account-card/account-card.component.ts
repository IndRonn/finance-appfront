import { Component, Input, Output, EventEmitter, signal } from '@angular/core'; // <--- Importar signal
import { CommonModule } from '@angular/common';
import { Account } from '@core/models/account.model';
import { AccountType, Currency } from '@core/models/enums.model';

@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-card.component.html',
  styleUrls: ['./account-card.component.scss']
})
export class AccountCardComponent {
  @Input({ required: true }) account!: Account;
  @Output() edit = new EventEmitter<Account>();
  @Output() delete = new EventEmitter<number>();

  AccountType = AccountType;
  Currency = Currency;

  // Estado de confirmación visual
  isConfirmingDelete = signal(false);

  handleDelete() {
    if (this.isConfirmingDelete()) {
      // Segundo clic: Confirmado -> Emitir evento
      this.delete.emit(this.account.id);
    } else {
      // Primer clic: Activar modo seguro
      this.isConfirmingDelete.set(true);
      // Resetear después de 3 segundos si no confirma
      setTimeout(() => this.isConfirmingDelete.set(false), 3000);
    }
  }

  getCardBackground(): string {
    switch (this.account.type) {
      case AccountType.EFECTIVO:
        return 'linear-gradient(135deg, #2E8B57 0%, #1A472A 100%)';
      default:
        return 'linear-gradient(135deg, #1f2937 0%, #000000 100%)';
    }
  }
}
