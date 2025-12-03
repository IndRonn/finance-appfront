import { Currency } from './enums.model';

export type BillStatus = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

export interface BillResponse {
  id: number;
  name: string;        // "Internet Casa"
  company: string;     // "Movistar"
  serviceCode: string; // "001-23456"
  categoryName: string;
  categoryId: number;
  currency: Currency;
  amount: number;
  dueDate: string;     // YYYY-MM-DD
  status: BillStatus;
  transactionId?: number;
}

export interface BillRequest {
  name: string;
  company?: string;
  serviceCode?: string;
  categoryId: number;
  currency: Currency;
  amount: number;
  dueDate: string;
}
