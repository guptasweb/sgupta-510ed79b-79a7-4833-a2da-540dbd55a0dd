import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../task.service';
import { TaskFormService } from '../task-form/task-form.service';
import { Task, TaskStatus, TaskCategory, TaskPriority, TaskFilters } from '../../../shared/models/task.model';
import { TaskItemComponent } from '../task-item/task-item.component';
import { AuthRepository } from '../../../store/auth.repository';
import { TasksRepository } from '../../../store/tasks.repository';
import { AuthService } from '../../auth/auth.service';
import { EmptyStateComponent, ErrorBannerComponent, LoadingIndicatorComponent } from '../../../shared/components';

type SortField = 'date' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';
type FilterPanelTab = 'sort' | 'filters';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    TaskItemComponent,
    EmptyStateComponent,
    ErrorBannerComponent,
    LoadingIndicatorComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  // Filters
  filters: TaskFilters = {};
  @Input() statusFilter: TaskStatus | '' = '';
  @Input() categoryFilter: TaskCategory | '' = '';
  @Input() searchQuery = '';
  /** When true, hide header and filters (used when embedded in dashboard). */
  @Input() embedded = false;
  @Output() taskEditRequested = new EventEmitter<Task>();

  // Sorting
  sortField: SortField = 'date';
  sortDirection: SortDirection = 'desc';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalTasks = 0;

  canCreateTask = false;
  /** False for viewer role so drag-and-drop is disabled. */
  canDrag = false;

  // Enums for template
  TaskStatus = TaskStatus;
  TaskCategory = TaskCategory;
  TaskPriority = TaskPriority;

  // Filter panel state
  showFilterPanel = false;
  filterPanelTab: FilterPanelTab = 'filters';
  statusSectionExpanded = true;
  prioritySectionExpanded = true;

  // Multi-select filter state (pending = not yet applied)
  pendingStatusFilters: Set<TaskStatus> = new Set();
  pendingPriorityFilters: Set<TaskPriority> = new Set();

  // Applied multi-select filters
  appliedStatusFilters: Set<TaskStatus> = new Set();
  appliedPriorityFilters: Set<TaskPriority> = new Set();

  // All available statuses and priorities for the filter panel
  allStatuses: { value: TaskStatus; label: string; icon: string }[] = [
    { value: TaskStatus.PENDING, label: 'PENDING', icon: '\u25A1' },
    { value: TaskStatus.IN_PROGRESS, label: 'IN PROGRESS', icon: '\u26A1' },
    { value: TaskStatus.IN_REVIEW, label: 'IN REVIEW', icon: '\uD83D\uDC40' },
    { value: TaskStatus.COMPLETED, label: 'COMPLETED', icon: '\u2705' },
  ];

  allPriorities: { value: TaskPriority; label: string; icon: string }[] = [
    { value: TaskPriority.HIGH, label: 'HIGH', icon: '\u25C6' },
    { value: TaskPriority.MEDIUM, label: 'MEDIUM', icon: '\u25C7' },
    { value: TaskPriority.LOW, label: 'LOW', icon: '\u25C7' },
  ];

  private destroy$ = new Subject<void>();
  /** Refetch when tab becomes visible so admin sees changes made by owner in another tab. */
  private wasTabHidden = false;

  constructor(
    private taskService: TaskService,
    private taskFormService: TaskFormService,
    private authRepository: AuthRepository,
    private tasksRepository: TasksRepository,
    private authService: AuthService
  ) {}

  openCreateTaskForm(): void {
    this.taskFormService.open(null, {
      onCreated: () => this.loadTasks(),
      onUpdated: () => this.loadTasks(),
    });
  }

  ngOnInit(): void {
    this.tasksRepository.sort$.pipe(takeUntil(this.destroy$)).subscribe((sort) => {
      this.sortField = sort.sortField;
      this.sortDirection = sort.sortDirection;
      if (this.tasks.length > 0) this.applySorting();
    });
    this.tasksRepository.tasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks) => {
      this.tasks = tasks;
      this.applySorting();
    });
    this.tasksRepository.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.isLoading = loading;
    });
    this.tasksRepository.error$.pipe(takeUntil(this.destroy$)).subscribe((err) => {
      this.errorMessage = err ?? '';
    });
    this.tasksRepository.totalTasks$.pipe(takeUntil(this.destroy$)).subscribe((total) => {
      this.totalTasks = total;
    });
    this.checkCreatePermission();
    this.loadTasks();
  }

  checkCreatePermission(): void {
    // Check if user has permission to create tasks and to drag (Viewer cannot create or drag)
    this.authRepository.user$.pipe(takeUntil(this.destroy$)).subscribe((user: any) => {
      if (!user) {
        this.canCreateTask = false;
        this.canDrag = false;
        return;
      }

      // Extract role name from user object (could be roleName or role.name)
      let roleName: string | undefined = user.roleName;
      if (!roleName && user.role && typeof user.role === 'object' && user.role.name) {
        roleName = user.role.name;
      }

      // If roleName is available, use it
      if (roleName) {
        const normalizedRoleName = roleName.toLowerCase();
        const canEdit = normalizedRoleName === 'owner' || normalizedRoleName === 'admin';
        this.canCreateTask = canEdit;
        this.canDrag = canEdit;
      } else {
        // If roleName is not available, fetch full profile to get it
        this.authService.getCurrentUser().pipe(takeUntil(this.destroy$)).subscribe({
          next: (fullUser: any) => {
            let fetchedRoleName = fullUser.roleName;
            if (!fetchedRoleName && fullUser.role && typeof fullUser.role === 'object' && fullUser.role.name) {
              fetchedRoleName = fullUser.role.name;
            }
            
            if (fetchedRoleName) {
              const normalizedRoleName = fetchedRoleName.toLowerCase();
              const canEdit = normalizedRoleName === 'owner' || normalizedRoleName === 'admin';
              this.canCreateTask = canEdit;
              this.canDrag = canEdit;
            } else {
              this.canCreateTask = true;
              this.canDrag = true;
            }
          },
          error: () => {
            this.canCreateTask = true;
            this.canDrag = true;
          }
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload tasks when filters change
    if (changes['statusFilter'] || changes['categoryFilter'] || changes['searchQuery']) {
      this.currentPage = 1;
      this.loadTasks();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Refetch tasks when user returns to the tab so changes by others (e.g. owner) are visible. */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.wasTabHidden = true;
    } else if (document.visibilityState === 'visible' && this.wasTabHidden) {
      this.wasTabHidden = false;
      this.loadTasks();
    }
  }

  loadTasks(): void {
    const filters: TaskFilters = {};
    if (this.statusFilter) {
      filters.status = this.statusFilter as TaskStatus;
    }
    if (this.categoryFilter) {
      filters.category = this.categoryFilter as TaskCategory;
    }
    if (this.searchQuery.trim()) {
      filters.search = this.searchQuery.trim();
    }
    this.tasksRepository.loadTasksRequest({
      filters,
      page: this.currentPage,
      limit: this.pageSize,
    });
  }

  applySorting(): void {
    // Apply client-side multi-select filters
    let filtered = [...this.tasks];

    // Apply multi-status filter client-side (when multiple are selected, backend gets no filter)
    if (this.appliedStatusFilters.size > 1) {
      filtered = filtered.filter(t => this.appliedStatusFilters.has(t.status));
    }

    // Apply priority filter client-side
    if (this.appliedPriorityFilters.size > 0) {
      filtered = filtered.filter(t => this.appliedPriorityFilters.has(t.priority));
    }

    this.filteredTasks = filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortField) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder: Record<string, number> = {
            [TaskStatus.PENDING]: 1,
            [TaskStatus.IN_PROGRESS]: 2,
            [TaskStatus.IN_REVIEW]: 3,
            [TaskStatus.COMPLETED]: 4,
            [TaskStatus.ON_HOLD]: 5,
          };
          comparison = (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0);
          break;
      }

      // If comparison is equal, fall back to order field to maintain drag-drop order
      if (comparison === 0) {
        comparison = (a.order ?? 0) - (b.order ?? 0);
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSort(field: SortField): void {
    const direction =
      this.sortField === field
        ? this.sortDirection === 'asc'
          ? 'desc'
          : 'asc'
        : 'asc';
    this.tasksRepository.setSort(field, direction);
    this.applySorting();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadTasks();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadTasks();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.categoryFilter = '';
    this.searchQuery = '';
    this.appliedStatusFilters.clear();
    this.appliedPriorityFilters.clear();
    this.currentPage = 1;
    this.loadTasks();
  }

  // --- Filter Panel Methods ---

  openFilterPanel(): void {
    if (this.showFilterPanel && this.filterPanelTab === 'filters') {
      this.showFilterPanel = false;
      return;
    }
    this.filterPanelTab = 'filters';
    // Copy applied filters to pending state
    this.pendingStatusFilters = new Set(this.appliedStatusFilters);
    this.pendingPriorityFilters = new Set(this.appliedPriorityFilters);
    this.showFilterPanel = true;
  }

  openSortPanel(): void {
    if (this.showFilterPanel && this.filterPanelTab === 'sort') {
      this.showFilterPanel = false;
      return;
    }
    this.filterPanelTab = 'sort';
    this.pendingStatusFilters = new Set(this.appliedStatusFilters);
    this.pendingPriorityFilters = new Set(this.appliedPriorityFilters);
    this.showFilterPanel = true;
  }

  closeFilterPanel(): void {
    this.showFilterPanel = false;
  }

  toggleStatusFilter(status: TaskStatus): void {
    if (this.pendingStatusFilters.has(status)) {
      this.pendingStatusFilters.delete(status);
    } else {
      this.pendingStatusFilters.add(status);
    }
  }

  togglePriorityFilter(priority: TaskPriority): void {
    if (this.pendingPriorityFilters.has(priority)) {
      this.pendingPriorityFilters.delete(priority);
    } else {
      this.pendingPriorityFilters.add(priority);
    }
  }

  clearAllPanelFilters(): void {
    this.pendingStatusFilters.clear();
    this.pendingPriorityFilters.clear();
  }

  applyPanelFilters(): void {
    this.appliedStatusFilters = new Set(this.pendingStatusFilters);
    this.appliedPriorityFilters = new Set(this.pendingPriorityFilters);

    // If exactly one status is selected, use backend filter
    if (this.appliedStatusFilters.size === 1) {
      this.statusFilter = [...this.appliedStatusFilters][0];
    } else {
      this.statusFilter = '';
    }

    this.currentPage = 1;
    this.showFilterPanel = false;
    this.loadTasks();
  }

  cancelFilterPanel(): void {
    this.showFilterPanel = false;
  }

  get hasActiveFilters(): boolean {
    return this.appliedStatusFilters.size > 0 || this.appliedPriorityFilters.size > 0;
  }

  get activeFilterCount(): number {
    return this.appliedStatusFilters.size + this.appliedPriorityFilters.size;
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showFilterPanel) {
      this.closeFilterPanel();
    }
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

  get totalPages(): number {
    return Math.ceil(this.totalTasks / this.pageSize);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTasks();
    }
  }

  onTaskUpdated(_updatedTask: Task): void {
    // Store is updated by task-item dispatching updateTaskSuccess; tasks$ subscription will refresh list.
  }

  onTaskDeleted(_taskId: string): void {
    // Store is updated by task-item dispatching deleteTaskSuccess; tasks$ subscription will refresh list.
  }

  onTaskEdited(task: Task): void {
    this.taskEditRequested.emit(task);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  /**
   * Handle drag and drop event
   * Updates task order optimistically and persists to backend
   */
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(this.filteredTasks, event.previousIndex, event.currentIndex);
    const movedTask = this.filteredTasks[event.currentIndex];
    const newOrder = event.currentIndex;
    this.taskService.reorderTask(movedTask.id, newOrder).subscribe({
      next: (updated) => this.tasksRepository.updateTaskSuccess(updated),
      error: () => this.loadTasks(),
    });
  }
}
