import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BudgetResponse, BudgetRequest } from '@core/models/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/budgets`;

  /**
   * Obtiene los presupuestos de un mes específico.
   */
  getBudgets(month: number, year: number): Observable<BudgetResponse[]> {
    const params = new HttpParams()
      .set('month', month)
      .set('year', year);

    return this.http.get<BudgetResponse[]>(this.apiUrl, { params });
  }

  /**
   * Crea un nuevo presupuesto para una categoría.
   */
  createBudget(data: BudgetRequest): Observable<BudgetResponse> {
    return this.http.post<BudgetResponse>(this.apiUrl, data);
  }
}
