import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Transaction, CreateTransactionRequest } from '@core/models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;

  /** Crea una nueva transacción (Gasto, Ingreso, Transferencia) */
  createTransaction(data: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, data);
  }

  /** Obtiene el historial completo */
  getHistory(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  // Aquí irán updateTransaction y deleteTransaction más adelante
}
