import { AccountType, Currency } from './enums.model';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  bankName?: string; // Opcional según schema
  initialBalance: number;
  isActive: boolean;
  currency: Currency;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  bankName?: string;
  initialBalance: number;
  currency: Currency;
  closingDate?: number; // Para tarjetas de crédito (HU-13)
  paymentDate?: number;
}
