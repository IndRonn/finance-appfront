import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // <--- 1. Importar Router
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { StorageService } from './storage.service';
import { LoginRequest, AuthResponse, RegisterRequest, User } from '@core/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router); // <--- 2. Inyectar Router
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Estado de autenticación
  readonly isAuthenticated = signal<boolean>(!!this.storage.getToken());
  readonly currentUser = signal<User | null>(null);

  constructor() {
    // Intentar restaurar usuario si hay token
    const token = this.storage.getToken();
    if (token) {
      this.decodeAndSetUser(token);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        this.handleAuthSuccess(response.token);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        this.handleAuthSuccess(response.token);
      })
    );
  }

  logout(): void {
    this.storage.removeToken();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);

    // 👇 3. REDIRECCIÓN CENTRALIZADA
    this.router.navigate(['/auth/login']);
  }

  // --- HELPERS ---

  private handleAuthSuccess(token: string) {
    this.storage.setToken(token);
    this.isAuthenticated.set(true);
    this.decodeAndSetUser(token);
  }

  private decodeAndSetUser(token: string) {
    try {
      const payloadPart = token.split('.')[1];
      const payloadDecoded = atob(payloadPart);
      const values = JSON.parse(payloadDecoded);

      const user: User = {
        email: values.sub || values.email || '',
        firstName: values.firstName || values.name || 'Usuario',
        lastName: values.lastName || '',
        id: values.id
      };

      this.currentUser.set(user);
    } catch (e) {
      console.error('Error decodificando token', e);
      this.logout(); // Si el token está corrupto, sacamos al usuario
    }
  }
}
