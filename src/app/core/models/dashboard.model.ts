export interface DailyStatus {
  date: string;
  availableForToday: number;
  totalMonthLimit: number;
  totalMonthSpent: number;
  remainingDays: number;
  status: 'OK' | 'WARNING' | 'DANGER' | string; // Mapeo flexible del string del backend
}

export interface DailyCloseRequest {
  date: string; // YYYY-MM-DD
  amount: number;
  action: 'SAVE' | 'ROLLOVER';
  targetSavingsGoalId?: number; // Solo si action es SAVE
  sourceAccountId?: number;     // De dónde sale la plata real
  categoryId?: number;          // Opcional, para clasificar el movimiento
}
