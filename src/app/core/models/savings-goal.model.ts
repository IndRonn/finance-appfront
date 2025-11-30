export interface SavingsGoalResponse {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number; // Decimal: 0.5 = 50%
}

export interface SavingsGoalRequest {
  name: string;
  targetAmount: number;
  initialAmount?: number;
}
