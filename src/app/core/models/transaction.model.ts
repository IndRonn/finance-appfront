import { TransactionType } from './enums.model';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string; // ISO Date String
  accountId: number;
  accountName: string;
  categoryId?: number;
  categoryName?: string;
  destinationAccountId?: number; // Solo transferencias
  destinationAccountName?: string;
  exchangeRate?: number;
  tags: Tag[];
}

export interface CreateTransactionRequest {
  accountId: number;
  amount: number;
  transactionDate: string;
  type: TransactionType;
  description?: string;
  categoryId?: number;
  destinationAccountId?: number;
  exchangeRate?: number;
  tagIds?: number[];
}
