import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BillResponse, BillRequest } from '@core/models/bill.model';

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/bills`;

  getBills(): Observable<BillResponse[]> {
    return this.http.get<BillResponse[]>(this.apiUrl);
  }

  createBill(data: BillRequest): Observable<BillResponse> {
    return this.http.post<BillResponse>(this.apiUrl, data);
  }

  updateBill(id: number, data: BillRequest): Observable<BillResponse> {
    return this.http.put<BillResponse>(`${this.apiUrl}/${id}`, data);
  }

  deleteBill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // LA MAGIA DE PAGO
  payBill(id: number, accountId: number): Observable<void> {
    const params = new HttpParams().set('accountId', accountId);
    return this.http.post<void>(`${this.apiUrl}/${id}/pay`, {}, { params });
  }
}
