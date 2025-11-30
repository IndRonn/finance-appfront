import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DebtResponse, DebtRequest, DebtPaymentRequest } from '@core/models/debt.model';

@Injectable({
  providedIn: 'root'
})
export class ExternalDebtService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/external-debts`;

  getMyDebts(): Observable<DebtResponse[]> {
    return this.http.get<DebtResponse[]>(this.apiUrl);
  }

  createDebt(data: DebtRequest): Observable<DebtResponse> {
    return this.http.post<DebtResponse>(this.apiUrl, data);
  }

  updateDebt(id: number, data: DebtRequest): Observable<DebtResponse> {
    return this.http.put<DebtResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteDebt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // LA OPERACIÓN ESPECIAL: Pagar Cuota
  amortizeDebt(id: number, payment: DebtPaymentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/amortize`, payment);
  }
}
