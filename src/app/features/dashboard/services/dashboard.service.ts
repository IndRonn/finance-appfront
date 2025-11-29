import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { DailyStatus } from '@core/models/dashboard.model'; // Asegúrate de tener este modelo creado en la Fase 2

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/daily`;

  getDailyStatus(): Observable<DailyStatus> {
    return this.http.get<DailyStatus>(`${this.apiUrl}/status`);
  }
}
