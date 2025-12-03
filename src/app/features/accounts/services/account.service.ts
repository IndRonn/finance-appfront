import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs'; // <--- Importante: Subject
import { environment } from '@env/environment';
import { Account, CreateAccountRequest } from '@core/models/account.model';
import { AccountType } from '@core/models/enums.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts`;

  // 1. ESTADO GLOBAL (Signals para Sidebar/Patrimonio)
  readonly accounts = signal<Account[]>([]);

  readonly totalLiquidity = computed(() => {
    return this.accounts()
      .filter(a => a.isActive && (a.type === AccountType.DEBITO || a.type === AccountType.EFECTIVO))
      .reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
  });

  readonly totalDebt = computed(() => {
    return this.accounts()
      .filter(a => a.isActive && a.type === AccountType.CREDITO)
      .reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
  });

  // 2. BUS DE EVENTOS (Para recarga de componentes)
  // Restauramos esto para que AccountsComponent no falle
  private _refreshNeeded$ = new Subject<void>();

  get refreshNeeded$() {
    return this._refreshNeeded$.asObservable();
  }

  // --- MÉTODOS ---

  /**
   * Carga datos del backend y actualiza la señal global.
   */
  loadAccounts() {
    this.http.get<Account[]>(this.apiUrl).subscribe({
      next: (data) => this.accounts.set(data),
      error: (e) => console.error('Error sync accounts', e)
    });
  }

  /**
   * Avisa a toda la app que hubo cambios.
   * Actualiza el store global y emite el evento para suscriptores manuales.
   */
  notifyRefresh() {
    this.loadAccounts();          // Actualiza el Sidebar (Signals)
    this._refreshNeeded$.next();  // Actualiza la Página de Cuentas (Subject)
  }

  // --- CRUD ---

  getMyAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl).pipe(
      tap(data => this.accounts.set(data)) // Mantiene sincronizada la señal
    );
  }

  createAccount(data: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, data).pipe(
      tap(() => this.notifyRefresh())
    );
  }

  updateAccount(id: number, data: CreateAccountRequest): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.notifyRefresh())
    );
  }

  deleteAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.notifyRefresh())
    );
  }

  // (Opcional) Si implementaste reactivateAccount antes
  reactivateAccount(id: number): Observable<void> {
    // Simulación o llamada real
    return new Observable(obs => {
      obs.next();
      obs.complete();
      this.notifyRefresh();
    });
  }
}
