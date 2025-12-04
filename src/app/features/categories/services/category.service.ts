import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryResponse, CategoryRequest } from '@core/models/category.model';
import { CategoryStateService } from '@core/services/category-state.service'; // <--- 1. IMPORTAR

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  // 👇 2. INYECTAR EL ESTADO GLOBAL
  private categoryState = inject(CategoryStateService);

  getAll(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.apiUrl);
  }

  create(data: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.apiUrl, data).pipe(
      // 👇 3. AL CREAR, REFRESCAMOS EL ESTADO GLOBAL
      tap(() => this.categoryState.loadCategories().subscribe())
    );
  }

  update(id: number, data: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.apiUrl}/${id}`, data).pipe(
      // 👇 4. AL EDITAR, REFRESCAMOS
      tap(() => this.categoryState.loadCategories().subscribe())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      // 👇 5. AL BORRAR, REFRESCAMOS
      tap(() => this.categoryState.loadCategories().subscribe())
    );
  }
}
