export interface DailyStatus {
  date: string;
  availableForToday: number;
  totalMonthLimit: number;
  totalMonthSpent: number;
  remainingDays: number;
  status: 'OK' | 'WARNING' | 'DANGER' | string; // Mapeo flexible del string del backend
}

export interface DailyCloseRequest {
  date: string;
  amount: number;
  action: 'SAVE' | 'ROLLOVER';
  targetSavingsGoalId?: number;
}
