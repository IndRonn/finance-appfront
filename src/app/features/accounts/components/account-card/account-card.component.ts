import { Component, Input } from '@angular/core';
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

  // Helpers para el HTML
  AccountType = AccountType;
  Currency = Currency;

  getCardBackground(): string {
    switch (this.account.type) {
      case AccountType.EFECTIVO:
        // DEGRADADO VERDE SLYTHERIN (Distintivo para Cash)
        return 'linear-gradient(135deg, #2E8B57 0%, #1A472A 100%)';
      default:
        // DEGRADADO NEGRO MATE (Para Débito Bancario)
        return 'linear-gradient(135deg, #1f2937 0%, #000000 100%)';
    }
  }
}
