import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs'; // <--- Importar Subject
import { environment } from '@env/environment';
import { Account, CreateAccountRequest } from '@core/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts`;

  // 1. EL CANAL DE COMUNICACIÓN
  // Subject que no emite datos, solo la señal "void" de que algo pasó
  private _refreshNeeded$ = new Subject<void>();

  // 2. EXPOSICIÓN PÚBLICA (Solo lectura)
  // Los componentes se suscribirán a esto
  get refreshNeeded$() {
    return this._refreshNeeded$.asObservable();
  }

  // 3. EL GATILLO
  // Llamaremos a esto cuando hagamos un cambio (POST/PUT/DELETE)
  notifyRefresh() {
    this._refreshNeeded$.next();
  }

  getMyAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }

  createAccount(data: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, data);
    // Nota: Aquí NO llamamos a notifyRefresh() automáticamente porque a veces
    // queremos controlar manualmente cuándo refrescar en el componente.
  }

  updateAccount(id: number, data: CreateAccountRequest): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/${id}`, data);
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
