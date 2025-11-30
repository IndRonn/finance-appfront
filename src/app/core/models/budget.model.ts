export interface BudgetResponse {
  id: number;
  categoryName: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number; // Decimal (ej: 0.75 para 75%)
  status: 'OK' | 'WARNING' | 'DANGER' | 'EXCEEDED'; // Strings del backend
}

export interface BudgetRequest {
  categoryId: number;
  limitAmount: number;
  month: number; // 1-12
  year: number;
}
