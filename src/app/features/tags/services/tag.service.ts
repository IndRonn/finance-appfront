import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Tag, TagRequest } from '@core/models/tag.model';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tags`;

  getAll(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl);
  }

  create(data: TagRequest): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, data);
  }
}
