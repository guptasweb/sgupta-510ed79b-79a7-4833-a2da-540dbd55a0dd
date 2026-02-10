import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../../../shared/models/task.model';

export interface TaskFormState {
  open: boolean;
  task: Task | null;
}

export interface TaskFormCallbacks {
  onCreated?: () => void;
  onUpdated?: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class TaskFormService {
  private state$ = new BehaviorSubject<TaskFormState>({ open: false, task: null });
  private callbacks: TaskFormCallbacks = {};

  getState(): Observable<TaskFormState> {
    return this.state$.asObservable();
  }

  open(task: Task | null, callbacks: TaskFormCallbacks = {}): void {
    this.callbacks = callbacks;
    this.state$.next({ open: true, task });
  }

  close(): void {
    this.state$.next({ open: false, task: null });
    this.callbacks = {};
  }

  notifyCreated(): void {
    this.callbacks.onCreated?.();
    this.close();
  }

  notifyUpdated(): void {
    this.callbacks.onUpdated?.();
    this.close();
  }

  notifyCancel(): void {
    this.callbacks.onCancel?.();
    this.close();
  }
}
