import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { StorageService } from './storage.service';
import { LoginRequest, AuthResponse, RegisterRequest } from '@core/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // SIGNAL: ¿Está el usuario logueado?
  // Se inicializa en true si existe un token en storage
  readonly isAuthenticated = signal<boolean>(!!this.storage.getToken());

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.storage.setToken(response.token);
        this.isAuthenticated.set(true);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        this.storage.setToken(response.token);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    this.storage.removeToken();
    this.isAuthenticated.set(false);
    // Aquí redirigiremos al login más adelante
  }
}
