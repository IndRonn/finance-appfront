import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, take, tap } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryResponse } from '@core/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryStateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  private categoriesSubject = new BehaviorSubject<CategoryResponse[]>([]);
  public readonly categories$ = this.categoriesSubject.asObservable();

  constructor() {
    this.loadCategories().pipe(take(1)).subscribe();
  }

  loadCategories(): Observable<CategoryResponse[]> {
    // Implementación real de la llamada GET /categories
    return this.http.get<CategoryResponse[]>(this.apiUrl).pipe(
      tap(data => this.categoriesSubject.next(data))
    );
  }

  // Getter síncrono útil para el componente
  getCategoriesSnapshot(): CategoryResponse[] {
    return this.categoriesSubject.getValue();
  }
}
