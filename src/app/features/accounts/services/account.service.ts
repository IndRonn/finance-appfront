import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Account, CreateAccountRequest } from '@core/models/account.model';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts`;

  getMyAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiUrl);
  }

  createAccount(data: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, data);
  }
}
