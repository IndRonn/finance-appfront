import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SavingsGoalResponse, SavingsGoalRequest } from '@core/models/savings-goal.model';

@Injectable({
  providedIn: 'root'
})
export class SavingsGoalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/savings-goals`;

  getAll(): Observable<SavingsGoalResponse[]> {
    return this.http.get<SavingsGoalResponse[]>(this.apiUrl);
  }

  create(data: SavingsGoalRequest): Observable<SavingsGoalResponse> {
    return this.http.post<SavingsGoalResponse>(this.apiUrl, data);
  }

  // --- NUEVOS MÉTODOS CRUD ---

  update(id: number, data: SavingsGoalRequest): Observable<SavingsGoalResponse> {
    return this.http.put<SavingsGoalResponse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
