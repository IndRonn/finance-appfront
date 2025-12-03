export interface DailyStatus {
  date: string;
  availableForToday: number;
  totalMonthLimit: number;
  totalMonthSpent: number;
  remainingDays: number;
  status: string;

  // 👇 NUEVOS CAMPOS DEL BACKEND
  yesterdaySpent: number;
  projectedAvailableTomorrow: number;
  yesterdaySaved: number;
  dailyLimit: number; // La meta original de hoy (ej: 11.83)
  spentToday: number; // Lo que ya gastaste hoy (ej: 2.00)
}

export interface DailyCloseRequest {
  date: string;
  amount: number;
  action: 'SAVE' | 'ROLLOVER';
  targetSavingsGoalId?: number;
  sourceAccountId?: number;
  categoryId?: number;
}
