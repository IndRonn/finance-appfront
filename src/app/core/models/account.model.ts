import { AccountType, Currency } from './enums.model';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: Currency;
  bankName?: string;
  initialBalance: number; // Nota: En TC, esto es la DEUDA ACTUAL (Positivo)
  isActive: boolean;

  // Nuevos campos oficiales del Backend
  creditLimit?: number;   // Viene null en Débito/Efectivo
  closingDate?: number;
  paymentDate?: number;
}

export interface CreateAccountRequest {
  name: string;
  type: AccountType;
  currency: Currency;
  bankName?: string;
  initialBalance: number;

  // Obligatorio para TC
  creditLimit?: number;
  closingDate?: number;
  paymentDate?: number;
}
