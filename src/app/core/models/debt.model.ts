export interface DebtResponse {
  id: number;
  name: string;
  creditor: string; // A quién le debes (Banco, Mamá, Prestamista)
  totalAmount: number; // Deuda original
  currentBalance: number; // Lo que falta pagar
  progressPercentage: number; // 0.0 a 1.0 (Cuánto has pagado)
}

export interface DebtRequest {
  name: string;
  creditor: string;
  totalAmount: number;
  currentBalance: number; // Al crear, suele ser igual al totalAmount
}

export interface DebtPaymentRequest {
  amount: number;
  sourceAccountId: number; // De dónde sale el dinero para pagar
  categoryId: number; // Para clasificar el gasto (ej: "Pago de Deudas")
}
