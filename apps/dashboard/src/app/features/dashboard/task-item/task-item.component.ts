import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../../../shared/models/task.model';
import { TaskService } from '../task.service';
import { TasksRepository } from '../../../store/tasks.repository';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './task-item.component.html',
  styleUrl: './task-item.component.css',
})
export class TaskItemComponent {
  @Input() task!: Task;
  /** When false (e.g. viewer role), Edit and Delete actions are hidden. */
  @Input() canEdit = true;
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<string>();
  @Output() taskEdited = new EventEmitter<Task>();

  isDeleting = false;
  showDeleteConfirm = false;
  isTogglingStatus = false;

  // Enums for template
  TaskStatus = TaskStatus;
  TaskCategory = TaskCategory;
  TaskPriority = TaskPriority;

  constructor(
    private taskService: TaskService,
    private tasksRepository: TasksRepository
  ) {}

  onEdit(): void {
    this.taskEdited.emit(this.task);
  }

  onDelete(): void {
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    this.isDeleting = true;
    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.tasksRepository.deleteTaskSuccess(this.task.id);
        this.taskDeleted.emit(this.task.id);
        this.isDeleting = false;
        this.showDeleteConfirm = false;
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.isDeleting = false;
        this.showDeleteConfirm = false;
      },
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  onCardKeydown(event: KeyboardEvent): void {
    if (this.showDeleteConfirm) return;
    const key = event.key.toLowerCase();
    if (this.canEdit && key === 'e') {
      event.preventDefault();
      this.onEdit();
      return;
    }
    if (this.canEdit && (event.key === 'Delete' || event.key === 'Backspace')) {
      event.preventDefault();
      this.onDelete();
      return;
    }
    if (key === ' ' || key === 'spacebar') {
      event.preventDefault();
      this.toggleComplete();
      return;
    }
  }

  toggleComplete(): void {
    if (this.isTogglingStatus) return;

    const newStatus =
      this.task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;

    this.isTogglingStatus = true;
    this.taskService.updateTask(this.task.id, { status: newStatus }).subscribe({
      next: (updatedTask) => {
        this.tasksRepository.updateTaskSuccess(updatedTask);
        this.task = updatedTask;
        this.taskUpdated.emit(updatedTask);
        this.isTogglingStatus = false;
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.isTogglingStatus = false;
      },
    });
  }

  getStatusBadgeClass(status: TaskStatus): string {
    const baseClasses = 'px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 font-mono';
    switch (status) {
      case TaskStatus.PENDING:
        return `${baseClasses} bg-bg-elevated text-accent-amber border-accent-amber`;
      case TaskStatus.IN_PROGRESS:
        return `${baseClasses} bg-bg-elevated text-accent-teal border-accent-teal`;
      case TaskStatus.IN_REVIEW:
        return `${baseClasses} bg-bg-elevated text-accent-burnt border-accent-burnt`;
      case TaskStatus.COMPLETED:
        return `${baseClasses} bg-bg-elevated text-accent-sage border-accent-sage opacity-60`;
      case TaskStatus.ON_HOLD:
        return `${baseClasses} bg-bg-elevated text-[#5b8a9a] border-[#5b8a9a]`;
      default:
        return baseClasses;
    }
  }

  getPriorityIndicatorClass(priority: TaskPriority): string {
    const baseClasses = 'w-3 h-3 border-2 flex-shrink-0';
    switch (priority) {
      case TaskPriority.HIGH:
        return `${baseClasses} bg-accent-rust border-accent-rust shadow-[0_0_8px_rgba(168,74,58,0.6)]`;
      case TaskPriority.MEDIUM:
        return `${baseClasses} bg-accent-amber border-accent-amber shadow-[0_0_8px_rgba(212,165,66,0.6)]`;
      case TaskPriority.LOW:
        return `${baseClasses} bg-accent-teal border-accent-teal shadow-[0_0_8px_rgba(42,125,125,0.6)]`;
      default:
        return baseClasses;
    }
  }

  getCategoryBadgeClass(category: TaskCategory | null): string {
    const baseClasses = 'px-2 py-1 text-xs font-bold uppercase tracking-wider border-2 font-mono';
    if (!category) {
      return `${baseClasses} bg-bg-elevated text-text-tertiary border-glass-border`;
    }
    switch (category) {
      case TaskCategory.WORK:
        return `${baseClasses} bg-[rgba(212,98,42,0.15)] text-accent-burnt border-accent-burnt`;
      case TaskCategory.PERSONAL:
        return `${baseClasses} bg-[rgba(42,125,125,0.15)] text-accent-teal border-accent-teal`;
      default:
        return baseClasses;
    }
  }

  get isCompleted(): boolean {
    return this.task.status === TaskStatus.COMPLETED;
  }
}
