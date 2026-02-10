import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService, CreateTaskRequest, UpdateTaskRequest } from '../task.service';
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../../../shared/models/task.model';
import { AuthRepository } from '../../../store/auth.repository';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css',
})
export class TaskFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() task: Task | null = null; // If provided, form is in edit mode
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  // Enums for template
  TaskStatus = TaskStatus;
  TaskCategory = TaskCategory;
  TaskPriority = TaskPriority;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private authRepository: AuthRepository
  ) {
    // Initialize form in constructor to ensure it's available immediately
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      status: [TaskStatus.PENDING],
      category: [null],
      priority: [TaskPriority.MEDIUM],
    });
  }

  // Options for dropdowns
  statusOptions = [
    { value: TaskStatus.PENDING, label: 'Pending' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.IN_REVIEW, label: 'In Review' },
    { value: TaskStatus.COMPLETED, label: 'Completed' },
    { value: TaskStatus.ON_HOLD, label: 'On Hold' },
  ];

  categoryOptions = [
    { value: TaskCategory.WORK, label: 'Work' },
    { value: TaskCategory.PERSONAL, label: 'Personal' },
  ];

  priorityOptions = [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
  ];


  organizationId = '';

  private destroy$ = new Subject<void>();


  ngOnInit(): void {
    // Update form with task data if editing
    if (this.task && this.taskForm) {
      this.taskForm.patchValue({
        title: this.task.title || '',
        description: this.task.description || '',
        status: this.task.status || TaskStatus.PENDING,
        category: this.task.category || null,
        priority: this.task.priority || TaskPriority.MEDIUM,
      });
    }
    
    // Get organization ID from current user
    this.authRepository.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user && user.organizationId) {
        this.organizationId = user.organizationId;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reinitialize form when task input changes
    if (changes['task'] && this.taskForm) {
      this.taskForm.patchValue({
        title: this.task?.title || '',
        description: this.task?.description || '',
        status: this.task?.status || TaskStatus.PENDING,
        category: this.task?.category || null,
        priority: this.task?.priority || TaskPriority.MEDIUM,
      });
    }
  }

  initializeForm(): void {
    // Always create/recreate the form
    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required, Validators.maxLength(255)]],
      description: [this.task?.description || ''],
      status: [this.task?.status || TaskStatus.PENDING],
      category: [this.task?.category || null],
      priority: [this.task?.priority || TaskPriority.MEDIUM],
    });
  }

  onSubmit(): void {
    if (!this.taskForm || this.taskForm.invalid || !this.organizationId) {
      if (this.taskForm) {
        this.markFormGroupTouched(this.taskForm);
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.taskForm.value;

    if (this.task) {
      // Update existing task - only send fields allowed by API (no organizationId)
      const updateData: UpdateTaskRequest = {
        title: formValue.title,
        description: formValue.description || null,
        status: formValue.status,
        category: formValue.category || null,
        priority: formValue.priority,
      };
      this.taskService.updateTask(this.task.id, updateData).subscribe({
        next: (updatedTask) => {
          this.isSubmitting = false;
          this.taskUpdated.emit(updatedTask);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Failed to update task';
        },
      });
    } else {
      // Create new task
      const createData: CreateTaskRequest = {
        title: formValue.title,
        description: formValue.description || null,
        status: formValue.status,
        category: formValue.category || null,
        priority: formValue.priority,
        organizationId: this.organizationId,
      };
      this.taskService.createTask(createData).subscribe({
        next: (newTask) => {
          this.isSubmitting = false;
          this.taskCreated.emit(newTask);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Failed to create task';
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    if (!this.taskForm) return '';
    const control = this.taskForm.get(fieldName);
    if (control?.hasError('required') && control.touched) {
      return 'This field is required';
    }
    if (control?.hasError('maxlength') && control.touched) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    if (!this.taskForm) return false;
    const control = this.taskForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
