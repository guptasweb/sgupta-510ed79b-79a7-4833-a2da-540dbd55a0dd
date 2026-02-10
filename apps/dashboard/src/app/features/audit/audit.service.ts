import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog, AuditLogListResponse } from '../../shared/models';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiUrl = `${environment.apiUrl}/audit-log`;

  constructor(private readonly http: HttpClient) {}

  getLogs(filters: AuditLogFilters = {}): Observable<AuditLogListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<AuditLogListResponse>(this.apiUrl, { params });
  }
}
