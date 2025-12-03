import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import { environment } from '@env/environment';
import { Transaction, CreateTransactionRequest } from '@core/models/transaction.model';
import { AccountService } from '@features/accounts/services/account.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transactions`;
  private accountService = inject(AccountService);

  /** Crea una nueva transacción (Gasto, Ingreso, Transferencia) */
  createTransaction(data: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, data).pipe(
      tap(() => this.accountService.notifyRefresh()) // ⚠️ IMPORTANTE: Avisar que el saldo cambió
    );
  }

  // LISTAR
  getHistory(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl);
  }

  // EDITAR
  updateTransaction(id: number, data: CreateTransactionRequest): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.accountService.notifyRefresh()) // El saldo se recalcula en backend, avisamos al front
    );
  }

  // ELIMINAR
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.accountService.notifyRefresh()) // El dinero vuelve a la cuenta, avisamos
    );
  }
}
