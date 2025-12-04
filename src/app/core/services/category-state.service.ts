import { Injectable, inject, effect } from '@angular/core'; // <--- Importar effect
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, take, tap } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryResponse } from '@core/models/category.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryStateService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/categories`;

  private categoriesSubject = new BehaviorSubject<CategoryResponse[]>([]);
  public readonly categories$ = this.categoriesSubject.asObservable();

  constructor() {
    // 1. Carga inicial (por si recargas la página con F5)
    this.loadCategories().pipe(take(1)).subscribe();

    // 2. Limpieza al salir (Logout)
    this.authService.logout$.subscribe(() => {
      console.log('🧹 CategoryState: Limpiando categorías...');
      this.categoriesSubject.next([]);
    });

    // 👇 3. RECARGA AUTOMÁTICA AL ENTRAR (Login)
    // Este efecto "vigila" el estado de autenticación.
    // Si cambia a TRUE, recarga los datos inmediatamente.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        console.log('🔄 CategoryState: Nueva sesión detectada, recargando datos...');
        this.loadCategories().subscribe();
      }
    });
  }

  loadCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.apiUrl).pipe(
      tap(data => this.categoriesSubject.next(data))
    );
  }

  getCategoriesSnapshot(): CategoryResponse[] {
    return this.categoriesSubject.getValue();
  }
}
