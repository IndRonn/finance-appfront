import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DailyStatus, DailyCloseRequest } from '@core/models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/daily`;

  getDailyStatus(): Observable<DailyStatus> {
    return this.http.get<DailyStatus>(`${this.apiUrl}/status`);
  }

  // 👇 NUEVO: EJECUTAR EL RITUAL
  closeDailyBox(data: DailyCloseRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/close`, data);
  }
}
