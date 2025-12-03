import { AccountType, Currency } from './enums.model';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: Currency;
  bankName?: string;
  initialBalance: number; // En TC: Deuda Total Acumulada
  isActive: boolean;

  statementBalance?: number;    // A Pagar (Facturado)
  currentCycleBalance?: number;
  // Datos de Crédito
  creditLimit?: number;
  closingDate?: number | null;
  paymentDate?: number | null;

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

  previousBalance?: number; // Deuda ya facturada (Ciclo cerrado)
  currentBalance?: number;  // Deuda flotante (Ciclo actual)
}
