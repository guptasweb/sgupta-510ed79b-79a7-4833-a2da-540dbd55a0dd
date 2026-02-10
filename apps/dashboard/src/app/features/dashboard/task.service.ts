import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskFilters } from '../../shared/models/task.model';

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  status?: string;
  category?: string | null;
  priority?: string;
  organizationId: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: string;
  category?: string | null;
  priority?: string;
  order?: number;
}

export interface ReorderTaskRequest {
  order: number;
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Get all tasks with optional filtering
   * JWT token is automatically added by AuthInterceptor
   */
  getTasks(filters?: TaskFilters, page: number = 1, limit: number = 10): Observable<TaskResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.category) {
      params = params.set('category', filters.category);
    }
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<TaskResponse>(this.apiUrl, { params });
  }

  /**
   * Create a new task
   * JWT token is automatically added by AuthInterceptor
   */
  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  /**
   * Update an existing task
   * JWT token is automatically added by AuthInterceptor
   */
  updateTask(id: string, task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  /**
   * Delete a task
   * JWT token is automatically added by AuthInterceptor
   */
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Reorder a task within its column.
   * @param id Task id
   * @param targetIndex Position in column (0 = first, 1 = second, ...)
   * @param previousIndex Optional current position; backend uses for validation
   */
  reorderTask(id: string, targetIndex: number, previousIndex?: number): Observable<Task> {
    const body: { order: number; previousIndex?: number } = { order: targetIndex };
    if (previousIndex !== undefined) body.previousIndex = previousIndex;
    return this.http.patch<Task>(`${this.apiUrl}/${id}/reorder`, body);
  }
}
